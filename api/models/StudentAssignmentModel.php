<?php
// api/models/StudentAssignmentModel.php - Model for student_assignments table

require_once __DIR__ . '/../core/BaseModel.php';

class StudentAssignmentModel extends BaseModel {
    protected static $table = 'student_assignments';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'student_id',
        'assignment_id',
        'submission_text',
        'submission_file',
        'submitted_at',
        'grade',
        'feedback',
        'status'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'student_id' => 'integer',
        'assignment_id' => 'integer',
        'grade' => 'float',
        'submitted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Get student submission for a specific assignment
     */
    public function getStudentSubmission($studentId, $assignmentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT sa.*, s.first_name, s.last_name, s.student_id as student_student_id
                FROM {$this->getTableName()} sa
                LEFT JOIN students s ON sa.student_id = s.id
                WHERE sa.student_id = ? AND sa.assignment_id = ?
            ");
            $stmt->execute([$studentId, $assignmentId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching student submission: ' . $e->getMessage());
        }
    }
    
    /**
     * Submit or update student assignment
     */
    public function submitAssignment($studentId, $assignmentId, $data) {
        try {
            // Check if submission already exists
            $existing = $this->getStudentSubmission($studentId, $assignmentId);
            
            if ($existing) {
                // Update existing submission
                $data['submitted_at'] = date('Y-m-d H:i:s');
                $data['status'] = 'submitted';
                
                return $this->update($existing['id'], $data);
            } else {
                // Create new submission
                $data['student_id'] = $studentId;
                $data['assignment_id'] = $assignmentId;
                $data['submitted_at'] = date('Y-m-d H:i:s');
                $data['status'] = 'submitted';
                
                return $this->create($data);
            }
        } catch (PDOException $e) {
            throw new Exception('Error submitting assignment: ' . $e->getMessage());
        }
    }
    
    /**
     * Grade student submission
     */
    public function gradeSubmission($studentId, $assignmentId, $grade, $feedback = null) {
        try {
            $submission = $this->getStudentSubmission($studentId, $assignmentId);
            
            if (!$submission) {
                throw new Exception('Submission not found');
            }
            
            $data = [
                'grade' => $grade,
                'feedback' => $feedback,
                'status' => 'graded'
            ];
            
            return $this->update($submission['id'], $data);
        } catch (PDOException $e) {
            throw new Exception('Error grading submission: ' . $e->getMessage());
        }
    }
    
    /**
     * Get all submissions for an assignment
     */
    public function getAssignmentSubmissions($assignmentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT sa.*, s.first_name, s.last_name, s.student_id as student_student_id, s.email
                FROM {$this->getTableName()} sa
                LEFT JOIN students s ON sa.student_id = s.id
                WHERE sa.assignment_id = ?
                ORDER BY sa.submitted_at DESC, s.first_name ASC, s.last_name ASC
            ");
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
     * Get student's assignment history
     */
    public function getStudentAssignmentHistory($studentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    sa.*,
                    ca.title as assignment_title,
                    ca.description as assignment_description,
                    ca.due_date as assignment_due_date,
                    ca.total_points as assignment_total_points,
                    ca.assignment_type,
                    ca.status as assignment_status,
                    t.first_name as teacher_first_name,
                    t.last_name as teacher_last_name,
                    c.name as class_name,
                    c.section as class_section,
                    s.name as subject_name,
                    s.code as subject_code
                FROM {$this->getTableName()} sa
                LEFT JOIN class_assignments ca ON sa.assignment_id = ca.id
                LEFT JOIN teachers t ON ca.teacher_id = t.id
                LEFT JOIN classes c ON ca.class_id = c.id
                LEFT JOIN subjects s ON ca.subject_id = s.id
                WHERE sa.student_id = ?
                ORDER BY sa.submitted_at DESC, ca.due_date DESC
            ");
            $stmt->execute([$studentId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching student assignment history: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if student has submitted assignment
     */
    public function hasStudentSubmitted($studentId, $assignmentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id FROM {$this->getTableName()} 
                WHERE student_id = ? AND assignment_id = ? AND status IN ('submitted', 'graded')
            ");
            $stmt->execute([$studentId, $assignmentId]);
            return $stmt->fetch() !== false;
        } catch (PDOException $e) {
            throw new Exception('Error checking submission status: ' . $e->getMessage());
        }
    }
    
    /**
     * Get submission statistics for an assignment
     */
    public function getAssignmentStatistics($assignmentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) as total_students,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
                    COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_count,
                    COUNT(CASE WHEN status = 'not_submitted' THEN 1 END) as not_submitted_count,
                    AVG(CASE WHEN status = 'graded' THEN grade END) as average_grade,
                    MAX(CASE WHEN status = 'graded' THEN grade END) as highest_grade,
                    MIN(CASE WHEN status = 'graded' THEN grade END) as lowest_grade
                FROM {$this->getTableName()} 
                WHERE assignment_id = ?
            ");
            $stmt->execute([$assignmentId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching assignment statistics: ' . $e->getMessage());
        }
    }
} 