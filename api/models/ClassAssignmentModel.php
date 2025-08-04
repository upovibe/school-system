<?php
// api/models/ClassAssignmentModel.php - Model for class_assignments table

require_once __DIR__ . '/../core/BaseModel.php';

class ClassAssignmentModel extends BaseModel {
    protected static $table = 'class_assignments';
    
    protected static $fillable = [
        'title', 'description', 'due_date', 'total_points', 'assignment_type',
        'status', 'attachment_file', 'teacher_id', 'class_id', 'subject_id'
    ];
    
    protected static $casts = [
        'teacher_id' => 'integer', 'class_id' => 'integer', 'subject_id' => 'integer',
        'total_points' => 'float', 'due_date' => 'datetime',
        'created_at' => 'datetime', 'updated_at' => 'datetime'
    ];

    /**
     * Get assignments with full details (for admin)
     */
    public function getAssignmentsWithDetails($filters = []) {
        $sql = "
            SELECT 
                ca.*,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name,
                t.email as teacher_email,
                c.name as class_name,
                c.section as class_section,
                s.name as subject_name,
                s.code as subject_code
            FROM class_assignments ca
            LEFT JOIN teachers t ON ca.teacher_id = t.id
            LEFT JOIN classes c ON ca.class_id = c.id
            LEFT JOIN subjects s ON ca.subject_id = s.id
        ";
        
        $whereConditions = [];
        $params = [];
        
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
        
        if (!empty($whereConditions)) {
            $sql .= " WHERE " . implode(' AND ', $whereConditions);
        }
        
        $sql .= " ORDER BY ca.created_at DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get single assignment with details
     */
    public function getAssignmentWithDetails($id) {
        $sql = "
            SELECT 
                ca.*,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name,
                t.email as teacher_email,
                c.name as class_name,
                c.section as class_section,
                s.name as subject_name,
                s.code as subject_code
            FROM class_assignments ca
            LEFT JOIN teachers t ON ca.teacher_id = t.id
            LEFT JOIN classes c ON ca.class_id = c.id
            LEFT JOIN subjects s ON ca.subject_id = s.id
            WHERE ca.id = ?
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get assignment by ID (simple version)
     */
    public function getById($id) {
        $sql = "SELECT * FROM class_assignments WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get assignments by class ID
     */
    public function getByClassId($classId) {
        $sql = "
            SELECT 
                ca.*,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name,
                s.name as subject_name
            FROM class_assignments ca
            LEFT JOIN teachers t ON ca.teacher_id = t.id
            LEFT JOIN subjects s ON ca.subject_id = s.id
            WHERE ca.class_id = ?
            ORDER BY ca.due_date ASC
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$classId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get teacher's assignments (for teacher view)
     */
    public function getTeacherAssignments($teacherId, $filters = []) {
        $sql = "
            SELECT 
                ca.*,
                c.name as class_name,
                c.section as class_section,
                s.name as subject_name,
                s.code as subject_code,
                COUNT(sa.id) as submission_count
            FROM class_assignments ca
            LEFT JOIN classes c ON ca.class_id = c.id
            LEFT JOIN subjects s ON ca.subject_id = s.id
            LEFT JOIN student_assignments sa ON ca.id = sa.assignment_id
            WHERE ca.teacher_id = ?
        ";
        
        $params = [$teacherId];
        
        if (!empty($filters['status'])) {
            $sql .= " AND ca.status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['class_id'])) {
            $sql .= " AND ca.class_id = ?";
            $params[] = $filters['class_id'];
        }
        
        $sql .= " GROUP BY ca.id ORDER BY ca.created_at DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get students for each assignment's class
        foreach ($assignments as &$assignment) {
            $studentStmt = $this->pdo->prepare("
                SELECT 
                    s.id,
                    s.student_id,
                    s.first_name,
                    s.last_name,
                    s.gender,
                    s.date_of_birth,
                    s.address,
                    s.phone,
                    s.email,
                    s.status,
                    s.created_at,
                    s.updated_at,
                    u.name as user_name,
                    u.email as user_email,
                    u.status as user_status
                FROM students s
                LEFT JOIN users u ON s.user_id = u.id
                WHERE s.current_class_id = ?
                ORDER BY s.first_name ASC, s.last_name ASC
            ");
            $studentStmt->execute([$assignment['class_id']]);
            $assignment['students'] = $studentStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        return $assignments;
    }

    /**
     * Get student's assignments (for student view)
     */
    public function getStudentAssignments($studentId, $filters = []) {
        $sql = "
            SELECT 
                ca.*,
                c.name as class_name,
                c.section as class_section,
                s.name as subject_name,
                s.code as subject_code,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name,
                sa.submission_text,
                sa.submission_file,
                sa.submitted_at,
                sa.grade,
                sa.feedback,
                sa.status as submission_status
            FROM class_assignments ca
            LEFT JOIN classes c ON ca.class_id = c.id
            LEFT JOIN subjects s ON ca.subject_id = s.id
            LEFT JOIN teachers t ON ca.teacher_id = t.id
            LEFT JOIN student_assignments sa ON ca.id = sa.assignment_id AND sa.student_id = ?
            WHERE ca.class_id = (SELECT class_id FROM students WHERE id = ?)
            AND ca.status = 'published'
        ";
        
        $params = [$studentId, $studentId];
        
        if (!empty($filters['assignment_type'])) {
            $sql .= " AND ca.assignment_type = ?";
            $params[] = $filters['assignment_type'];
        }
        
        if (!empty($filters['status'])) {
            $sql .= " AND sa.status = ?";
            $params[] = $filters['status'];
        }
        
        $sql .= " ORDER BY ca.due_date ASC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Check if student can access assignment
     */
    public function canStudentAccessAssignment($assignmentId, $studentId) {
        $sql = "
            SELECT COUNT(*) as count
            FROM class_assignments ca
            JOIN students s ON ca.class_id = s.class_id
            WHERE ca.id = ? AND s.id = ? AND ca.status = 'published'
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$assignmentId, $studentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['count'] > 0;
    }

    /**
     * Get assignment statistics
     */
    public function getAssignmentStatistics($assignmentId) {
        $sql = "
            SELECT 
                COUNT(*) as total_students,
                SUM(CASE WHEN sa.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
                SUM(CASE WHEN sa.status = 'graded' THEN 1 ELSE 0 END) as graded_count,
                SUM(CASE WHEN sa.status = 'late' THEN 1 ELSE 0 END) as late_count,
                AVG(sa.grade) as average_grade
            FROM class_assignments ca
            JOIN students s ON ca.class_id = s.class_id
            LEFT JOIN student_assignments sa ON ca.id = sa.assignment_id AND sa.student_id = s.id
            WHERE ca.id = ?
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$assignmentId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?> 