<?php
// api/models/StudentAssignmentModel.php - Model for student_assignments table

require_once __DIR__ . '/../core/BaseModel.php';

class StudentAssignmentModel extends BaseModel
{
    protected static $table = 'student_assignments';

    protected static $fillable = [
        'student_id',
        'assignment_id',
        'submission_text',
        'submission_file',
        'submitted_at',
        'grade',
        'feedback',
        'status',
        'archived_at'
    ];

    protected static $casts = [
        'student_id' => 'integer',
        'assignment_id' => 'integer',
        'grade' => 'float',
        'submitted_at' => 'datetime',
        'archived_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Submit or update assignment submission
     */
    public function submitAssignment($studentId, $assignmentId, $data)
    {
        // Check if submission already exists
        $existingSubmission = $this->getStudentSubmission($studentId, $assignmentId);

        $submissionData = [
            'student_id' => $studentId,
            'assignment_id' => $assignmentId,
            'submitted_at' => date('Y-m-d H:i:s'),
            'status' => 'submitted'
        ];

        // Add submission text if provided
        if (!empty($data['submission_text'])) {
            $submissionData['submission_text'] = $data['submission_text'];
        }

        // Add submission file if provided
        if (!empty($data['submission_file'])) {
            $submissionData['submission_file'] = $data['submission_file'];
        }

        if ($existingSubmission) {
            // Update existing submission
            return $this->update($existingSubmission['id'], $submissionData);
        } else {
            // Create new submission
            return $this->create($submissionData);
        }
    }

    /**
     * Get student's submission for a specific assignment
     */
    public function getStudentSubmission($studentId, $assignmentId)
    {
        $sql = "
            SELECT 
                sa.*,
                ca.title as assignment_title,
                ca.description as assignment_description,
                ca.due_date as assignment_due_date,
                ca.total_points as assignment_total_points
            FROM student_assignments sa
            LEFT JOIN class_assignments ca ON sa.assignment_id = ca.id
            WHERE sa.student_id = ? AND sa.assignment_id = ?
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId, $assignmentId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get detailed student submission with student info (for teachers)
     */
    public function getStudentSubmissionForTeacher($assignmentId, $studentId)
    {
        $sql = "
            SELECT 
                s.id,
                s.student_id,
                s.first_name,
                s.last_name,
                s.gender,
                s.email,
                s.phone,
                s.date_of_birth,
                s.address,
                sa.id as submission_id,
                sa.submission_text,
                sa.submission_file,
                sa.submitted_at,
                sa.grade,
                sa.feedback,
                sa.status as submission_status,
                ca.title as assignment_title,
                ca.description as assignment_description,
                ca.due_date as assignment_due_date,
                ca.total_points as assignment_total_points,
                ca.assignment_type,
                ca.status as assignment_status
            FROM students s
            LEFT JOIN student_assignments sa ON s.id = sa.student_id AND sa.assignment_id = ?
            LEFT JOIN class_assignments ca ON ca.id = ?
            WHERE s.id = ?
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$assignmentId, $assignmentId, $studentId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get all students in the class with their submission status for an assignment
     */
    public function getAssignmentSubmissions($assignmentId)
    {
        $sql = "
            SELECT 
                s.id as student_id,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.student_id as student_student_id,
                s.email as student_email,
                s.gender,
                s.phone,
                sa.id as submission_id,
                sa.submission_text,
                sa.submission_file,
                sa.submitted_at,
                sa.grade,
                sa.feedback,
                sa.status as submission_status,
                CASE 
                    WHEN sa.id IS NOT NULL THEN 'submitted'
                    ELSE 'not_submitted'
                END as overall_status
            FROM class_assignments ca
            JOIN students s ON ca.class_id = s.current_class_id
            LEFT JOIN student_assignments sa ON ca.id = sa.assignment_id AND sa.student_id = s.id
            WHERE ca.id = ?
            ORDER BY s.first_name ASC, s.last_name ASC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$assignmentId]);
        $rawData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Restructure the data to group submission data
        $structuredData = [];
        foreach ($rawData as $row) {
            $student = [
                'id' => $row['student_id'],
                'first_name' => $row['student_first_name'],
                'last_name' => $row['student_last_name'],
                'student_id' => $row['student_student_id'],
                'email' => $row['student_email'],
                'gender' => $row['gender'],
                'phone' => $row['phone'],
                'overall_status' => $row['overall_status']
            ];
            
            // Create submission object
            if ($row['submission_id']) {
                $student['submission'] = [
                    'id' => $row['submission_id'],
                    'submission_text' => $row['submission_text'],
                    'submission_file' => $row['submission_file'],
                    'submitted_at' => $row['submitted_at'],
                    'grade' => $row['grade'],
                    'feedback' => $row['feedback'],
                    'status' => $row['submission_status']
                ];
            } else {
                $student['submission'] = null;
            }
            
            $structuredData[] = $student;
        }
        
        return $structuredData;
    }

    /**
     * Grade a student submission
     */
    public function gradeSubmission($studentId, $assignmentId, $grade, $feedback = null)
    {
        $submission = $this->getStudentSubmission($studentId, $assignmentId);

        if (!$submission) {
            return false;
        }

        $updateData = [
            'grade' => $grade,
            'feedback' => $feedback,
            'status' => 'graded'
        ];

        return $this->update($submission['id'], $updateData);
    }

    /**
     * Get assignment statistics
     */
    public function getAssignmentStatistics($assignmentId)
    {
        $sql = "
            SELECT 
                COUNT(*) as total_students,
                SUM(CASE WHEN sa.id IS NOT NULL THEN 1 ELSE 0 END) as submitted_count,
                SUM(CASE WHEN sa.status = 'graded' THEN 1 ELSE 0 END) as graded_count,
                SUM(CASE WHEN sa.status = 'late' THEN 1 ELSE 0 END) as late_count,
                AVG(sa.grade) as average_grade,
                MAX(sa.grade) as highest_grade,
                MIN(sa.grade) as lowest_grade
            FROM class_assignments ca
            JOIN students s ON ca.class_id = s.current_class_id
            LEFT JOIN student_assignments sa ON ca.id = sa.assignment_id AND sa.student_id = s.id
            WHERE ca.id = ?
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$assignmentId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get student's assignment history
     */
    public function getStudentAssignmentHistory($studentId)
    {
        $sql = "
            SELECT 
                sa.*,
                ca.title as assignment_title,
                ca.description as assignment_description,
                ca.due_date as assignment_due_date,
                ca.total_points as assignment_total_points,
                ca.assignment_type,
                c.name as class_name,
                s.name as subject_name,
                t.first_name as teacher_first_name,
                t.last_name as teacher_last_name
            FROM student_assignments sa
            LEFT JOIN class_assignments ca ON sa.assignment_id = ca.id
            LEFT JOIN classes c ON ca.class_id = c.id
            LEFT JOIN subjects s ON ca.subject_id = s.id
            LEFT JOIN teachers t ON ca.teacher_id = t.id
            WHERE sa.student_id = ?
            ORDER BY sa.submitted_at DESC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Check if submission is late
     */
    public function isSubmissionLate($assignmentId, $submittedAt)
    {
        $sql = "SELECT due_date FROM class_assignments WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$assignmentId]);
        $assignment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$assignment || !$assignment['due_date']) {
            return false;
        }

        $dueDate = new DateTime($assignment['due_date']);
        $submittedDate = new DateTime($submittedAt);

        return $submittedDate > $dueDate;
    }

    /**
     * Get submission by student and assignment
     */
    public function getByStudentAndAssignment($studentId, $assignmentId)
    {
        $sql = "SELECT * FROM student_assignments WHERE student_id = ? AND assignment_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId, $assignmentId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get all submissions by student ID
     */
    public function getByStudentId($studentId)
    {
        $sql = "SELECT * FROM student_assignments WHERE student_id = ? ORDER BY submitted_at DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get graded submissions by student ID
     */
    public function getGradedByStudentId($studentId)
    {
        $sql = "SELECT * FROM student_assignments WHERE student_id = ? AND grade IS NOT NULL ORDER BY submitted_at DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Archive a student assignment submission
     */
    public function archiveSubmission($studentId, $assignmentId)
    {
        $sql = "UPDATE student_assignments SET archived_at = NOW() WHERE student_id = ? AND assignment_id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$studentId, $assignmentId]);
    }

    /**
     * Unarchive a student assignment submission
     */
    public function unarchiveSubmission($studentId, $assignmentId)
    {
        $sql = "UPDATE student_assignments SET archived_at = NULL WHERE student_id = ? AND assignment_id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$studentId, $assignmentId]);
    }

    /**
     * Check if submission is archived
     */
    public function isSubmissionArchived($studentId, $assignmentId)
    {
        $sql = "SELECT archived_at FROM student_assignments WHERE student_id = ? AND assignment_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId, $assignmentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result && $result['archived_at'] !== null;
    }
}
?>