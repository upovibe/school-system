<?php
// api/models/GradingPolicyModel.php - Model for grading_policies table

require_once __DIR__ . '/../core/BaseModel.php';

class GradingPolicyModel extends BaseModel {
    protected static $table = 'grading_policies';
    
    protected static $fillable = [
        'name', 'description', 'subject_id', 'is_active', 
        'assignment_max_score', 'exam_max_score', 'grade_boundaries',
        'created_by'
    ];
    
    protected static $casts = [
        'subject_id' => 'integer',
        'is_active' => 'boolean',
        'assignment_max_score' => 'integer',
        'exam_max_score' => 'integer',
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
                u.name as creator_name,
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
                u.name as creator_name,
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
        $boundaries = $this->getGradeBoundaries($policy);
        
        // Normalize to array of ['grade' => string, 'min' => number]
        $normalized = [];
        if (is_array($boundaries)) {
            // If associative map: ['A' => 80, 'B' => 70]
            $isAssoc = array_keys($boundaries) !== range(0, count($boundaries) - 1);
            if ($isAssoc) {
                foreach ($boundaries as $grade => $min) {
                    $normalized[] = [ 'grade' => (string)$grade, 'min' => (float)$min ];
                }
            } else {
                // If array of objects: [ ['grade' => 'A', 'min' => 80], ... ]
                foreach ($boundaries as $entry) {
                    if (is_array($entry) && isset($entry['grade']) && isset($entry['min'])) {
                        $normalized[] = [ 'grade' => (string)$entry['grade'], 'min' => (float)$entry['min'] ];
                    }
                }
            }
        }

        // Sort by min descending
        usort($normalized, function($a, $b) {
            if ($a['min'] === $b['min']) return 0;
            return ($a['min'] < $b['min']) ? 1 : -1;
        });

        foreach ($normalized as $boundary) {
            if ($percentage >= $boundary['min']) {
                return $boundary['grade'];
            }
        }

        return 'F';
    }

    /**
     * Calculate final grade based on raw scores and policy
     */
    public function calculateFinalGrade($assignmentTotal, $examTotal, $policy) {
        // Get max scores from policy
        $assignmentMax = $policy['assignment_max_score'];
        $examMax = $policy['exam_max_score'];
        
        // Points-based calculation so the relative max values determine the weight automatically
        $maxTotal = max(0, (float)$assignmentMax + (float)$examMax);
        $rawTotal = max(0, (float)$assignmentTotal + (float)$examTotal);
        $finalPercentage = $maxTotal > 0 ? ($rawTotal / $maxTotal) * 100 : 0;
        
        // Round to 2 decimal places
        $finalPercentage = round($finalPercentage, 2);
        
        // Get letter grade
        $letterGrade = $this->calculateLetterGrade($finalPercentage, $policy);
        
        return [
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
        // Handle both JSON string and array formats
        $raw = is_string($policy['grade_boundaries']) 
            ? json_decode($policy['grade_boundaries'], true) 
            : $policy['grade_boundaries'];
        // Ensure it's an array
        if (!is_array($raw)) { return []; }
        return $raw;
    }
}
?>
