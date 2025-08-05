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
        'status'
    ];

    protected static $casts = [
        'student_id' => 'integer',
        'assignment_id' => 'integer',
        'grade' => 'float',
        'submitted_at' => 'datetime',
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
     * Get all submissions for an assignment (for teacher grading)
     */
    public function getAssignmentSubmissions($assignmentId)
    {
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
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
                SUM(CASE WHEN sa.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
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
}
?>