<?php
// api/models/GradingPolicyModel.php - Model for grading_policies table

require_once __DIR__ . '/../core/BaseModel.php';

class GradingPolicyModel extends BaseModel {
    protected static $table = 'grading_policies';
    
    protected static $fillable = [
        'name', 'description', 'subject_id', 'is_active', 
        'assignment_weight', 'exam_weight', 'grade_boundaries',
        'created_by'
    ];
    
    protected static $casts = [
        'subject_id' => 'integer',
        'is_active' => 'boolean',
        'assignment_weight' => 'float',
        'exam_weight' => 'float',
        'grade_boundaries' => 'json',
        'created_by' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get grading policy by subject ID
     */
    public function getBySubjectId($subjectId) {
        $sql = "SELECT * FROM grading_policies WHERE subject_id = ? AND is_active = 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$subjectId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get all grading policies with subject info
     */
    public function getAllPoliciesWithSubject() {
        $sql = "
            SELECT 
                gp.*,
                s.name as subject_name,
                s.code as subject_code,
                u.first_name as creator_first_name,
                u.last_name as creator_last_name,
                u.email as creator_email
            FROM grading_policies gp
            LEFT JOIN subjects s ON gp.subject_id = s.id
            LEFT JOIN users u ON gp.created_by = u.id
            ORDER BY s.name ASC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get grading policy by ID with subject info
     */
    public function getPolicyWithSubject($id) {
        $sql = "
            SELECT 
                gp.*,
                s.name as subject_name,
                s.code as subject_code,
                u.first_name as creator_first_name,
                u.last_name as creator_last_name,
                u.email as creator_email
            FROM grading_policies gp
            LEFT JOIN subjects s ON gp.subject_id = s.id
            LEFT JOIN users u ON gp.created_by = u.id
            WHERE gp.id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get active policies only
     */
    public function getActivePolicies() {
        $sql = "
            SELECT 
                gp.*,
                s.name as subject_name,
                s.code as subject_code
            FROM grading_policies gp
            LEFT JOIN subjects s ON gp.subject_id = s.id
            WHERE gp.is_active = 1
            ORDER BY s.name ASC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Check if subject has an active policy
     */
    public function subjectHasPolicy($subjectId) {
        $sql = "SELECT id FROM grading_policies WHERE subject_id = ? AND is_active = 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$subjectId]);
        return $stmt->fetch() !== false;
    }

    /**
     * Deactivate policy for a subject
     */
    public function deactivatePolicy($subjectId) {
        $sql = "UPDATE grading_policies SET is_active = 0 WHERE subject_id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$subjectId]);
    }

    /**
     * Activate policy for a subject
     */
    public function activatePolicy($subjectId) {
        $sql = "UPDATE grading_policies SET is_active = 1 WHERE subject_id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$subjectId]);
    }

    /**
     * Validate grade weights sum to 1.0 (100%)
     */
    public function validateWeights($assignmentWeight, $examWeight) {
        $total = $assignmentWeight + $examWeight;
        return abs($total - 1.0) < 0.01; // Allow small floating point differences
    }

    /**
     * Calculate letter grade based on percentage and policy
     */
    public function calculateLetterGrade($percentage, $policy) {
        $boundaries = json_decode($policy['grade_boundaries'], true);
        
        // Sort boundaries from highest to lowest
        arsort($boundaries);
        
        foreach ($boundaries as $grade => $minPercentage) {
            if ($percentage >= $minPercentage) {
                return $grade;
            }
        }
        
        return 'F'; // Default to F if no grade boundary matches
    }

    /**
     * Calculate final grade based on raw scores and policy
     */
    public function calculateFinalGrade($assignmentTotal, $assignmentMax, $examTotal, $examMax, $policy) {
        // Calculate percentages
        $assignmentPercentage = $assignmentMax > 0 ? ($assignmentTotal / $assignmentMax) * 100 : 0;
        $examPercentage = $examMax > 0 ? ($examTotal / $examMax) * 100 : 0;
        
        // Calculate weighted final grade
        $finalPercentage = (
            ($assignmentPercentage * $policy['assignment_weight']) +
            ($examPercentage * $policy['exam_weight'])
        );
        
        // Round to 2 decimal places
        $finalPercentage = round($finalPercentage, 2);
        
        // Get letter grade
        $letterGrade = $this->calculateLetterGrade($finalPercentage, $policy);
        
        return [
            'assignment_percentage' => round($assignmentPercentage, 2),
            'exam_percentage' => round($examPercentage, 2),
            'final_percentage' => $finalPercentage,
            'final_letter_grade' => $letterGrade
        ];
    }

    /**
     * Get subjects without grading policies
     */
    public function getSubjectsWithoutPolicies() {
        $sql = "
            SELECT s.* 
            FROM subjects s
            LEFT JOIN grading_policies gp ON s.id = gp.subject_id AND gp.is_active = 1
            WHERE gp.id IS NULL
            ORDER BY s.name ASC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get grade boundaries as array
     */
    public function getGradeBoundaries($policy) {
        return json_decode($policy['grade_boundaries'], true);
    }
}
?>
