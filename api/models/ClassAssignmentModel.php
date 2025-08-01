<?php
// api/models/ClassAssignmentModel.php - Model for class_assignments table

require_once __DIR__ . '/../core/BaseModel.php';

class ClassAssignmentModel extends BaseModel {
    protected static $table = 'class_assignments';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'title',
        'description',
        'due_date',
        'total_points',
        'assignment_type',
        'status',
        'attachment_file',
        'teacher_id',
        'class_id',
        'subject_id'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'teacher_id' => 'integer',
        'class_id' => 'integer',
        'subject_id' => 'integer',
        'total_points' => 'float',
        'due_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Get assignments with teacher, class, and subject information
     */
    public function getAssignmentsWithDetails($filters = []) {
        try {
            $sql = "
                SELECT 
                    ca.*,
                    t.first_name as teacher_first_name,
                    t.last_name as teacher_last_name,
                    t.employee_id as teacher_employee_id,
                    c.name as class_name,
                    c.section as class_section,
                    s.name as subject_name,
                    s.code as subject_code,
                    COUNT(sa.id) as submission_count,
                    COUNT(CASE WHEN sa.status = 'submitted' THEN 1 END) as submitted_count,
                    COUNT(CASE WHEN sa.status = 'graded' THEN 1 END) as graded_count
                FROM {$this->getTableName()} ca
                LEFT JOIN teachers t ON ca.teacher_id = t.id
                LEFT JOIN classes c ON ca.class_id = c.id
                LEFT JOIN subjects s ON ca.subject_id = s.id
                LEFT JOIN student_assignments sa ON ca.id = sa.assignment_id
            ";
            
            $whereConditions = [];
            $params = [];
            
            // Apply filters
            if (!empty($filters['teacher_id'])) {
                $whereConditions[] = "ca.teacher_id = ?";
                $params[] = $filters['teacher_id'];
            }
            
            if (!empty($filters['class_id'])) {
                $whereConditions[] = "ca.class_id = ?";
                $params[] = $filters['class_id'];
            }
            
            if (!empty($filters['subject_id'])) {
                $whereConditions[] = "ca.subject_id = ?";
                $params[] = $filters['subject_id'];
            }
            
            if (!empty($filters['status'])) {
                $whereConditions[] = "ca.status = ?";
                $params[] = $filters['status'];
            }
            
            if (!empty($filters['assignment_type'])) {
                $whereConditions[] = "ca.assignment_type = ?";
                $params[] = $filters['assignment_type'];
            }
            
            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(' AND ', $whereConditions);
            }
            
            $sql .= " GROUP BY ca.id ORDER BY ca.created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching assignments with details: ' . $e->getMessage());
        }
    }
    
    /**
     * Get assignments for a specific teacher
     */
    public function getTeacherAssignments($teacherId, $filters = []) {
        $filters['teacher_id'] = $teacherId;
        return $this->getAssignmentsWithDetails($filters);
    }
    
    /**
     * Get assignments for a specific class
     */
    public function getClassAssignments($classId, $filters = []) {
        $filters['class_id'] = $classId;
        return $this->getAssignmentsWithDetails($filters);
    }
    
    /**
     * Get assignments for a specific student (based on their class)
     */
    public function getStudentAssignments($studentId, $filters = []) {
        try {
            $sql = "
                SELECT 
                    ca.*,
                    t.first_name as teacher_first_name,
                    t.last_name as teacher_last_name,
                    t.employee_id as teacher_employee_id,
                    c.name as class_name,
                    c.section as class_section,
                    s.name as subject_name,
                    s.code as subject_code,
                    sa.submission_text,
                    sa.submission_file,
                    sa.submitted_at,
                    sa.grade,
                    sa.feedback,
                    sa.status as submission_status
                FROM {$this->getTableName()} ca
                LEFT JOIN teachers t ON ca.teacher_id = t.id
                LEFT JOIN classes c ON ca.class_id = c.id
                LEFT JOIN subjects s ON ca.subject_id = s.id
                LEFT JOIN student_assignments sa ON ca.id = sa.assignment_id AND sa.student_id = ?
                WHERE ca.class_id = (SELECT current_class_id FROM students WHERE id = ?)
                AND ca.status = 'published'
            ";
            
            $params = [$studentId, $studentId];
            
            // Apply additional filters
            if (!empty($filters['assignment_type'])) {
                $sql .= " AND ca.assignment_type = ?";
                $params[] = $filters['assignment_type'];
            }
            
            $sql .= " ORDER BY ca.due_date ASC, ca.created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching student assignments: ' . $e->getMessage());
        }
    }
    
    /**
     * Get assignment with full details by ID
     */
    public function getAssignmentWithDetails($id) {
        try {
            $sql = "
                SELECT 
                    ca.*,
                    t.first_name as teacher_first_name,
                    t.last_name as teacher_last_name,
                    t.employee_id as teacher_employee_id,
                    c.name as class_name,
                    c.section as class_section,
                    c.capacity as class_capacity,
                    s.name as subject_name,
                    s.code as subject_code,
                    COUNT(sa.id) as submission_count,
                    COUNT(CASE WHEN sa.status = 'submitted' THEN 1 END) as submitted_count,
                    COUNT(CASE WHEN sa.status = 'graded' THEN 1 END) as graded_count
                FROM {$this->getTableName()} ca
                LEFT JOIN teachers t ON ca.teacher_id = t.id
                LEFT JOIN classes c ON ca.class_id = c.id
                LEFT JOIN subjects s ON ca.subject_id = s.id
                LEFT JOIN student_assignments sa ON ca.id = sa.assignment_id
                WHERE ca.id = ?
                GROUP BY ca.id
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching assignment details: ' . $e->getMessage());
        }
    }
    
    /**
     * Get assignment submissions for grading
     */
    public function getAssignmentSubmissions($assignmentId) {
        try {
            $sql = "
                SELECT 
                    sa.*,
                    s.first_name as student_first_name,
                    s.last_name as student_last_name,
                    s.student_id as student_student_id,
                    s.email as student_email
                FROM student_assignments sa
                LEFT JOIN students s ON sa.student_id = s.id
                WHERE sa.assignment_id = ?
                ORDER BY sa.submitted_at DESC, s.first_name ASC, s.last_name ASC
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$assignmentId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching assignment submissions: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if teacher can access assignment
     */
    public function canTeacherAccessAssignment($assignmentId, $teacherId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id FROM {$this->getTableName()} 
                WHERE id = ? AND teacher_id = ?
            ");
            $stmt->execute([$assignmentId, $teacherId]);
            return $stmt->fetch() !== false;
        } catch (PDOException $e) {
            throw new Exception('Error checking teacher access: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if student can access assignment
     */
    public function canStudentAccessAssignment($assignmentId, $studentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ca.id 
                FROM {$this->getTableName()} ca
                JOIN students s ON ca.class_id = s.current_class_id
                WHERE ca.id = ? AND s.id = ? AND ca.status = 'published'
            ");
            $stmt->execute([$assignmentId, $studentId]);
            return $stmt->fetch() !== false;
        } catch (PDOException $e) {
            throw new Exception('Error checking student access: ' . $e->getMessage());
        }
    }
} 