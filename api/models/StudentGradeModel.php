<?php
// api/models/StudentGradeModel.php - Model for student_grades table

require_once __DIR__ . '/../core/BaseModel.php';

class StudentGradeModel extends BaseModel {
    protected static $table = 'student_grades';
    
    protected static $fillable = [
        'student_id', 'class_id', 'subject_id', 'grading_period_id', 'grading_policy_id',
        'assignment_total', 'exam_total',
        'final_percentage', 'final_letter_grade',
        'remarks', 'created_by', 'updated_by'
    ];
    
    protected static $casts = [
        'student_id' => 'integer',
        'class_id' => 'integer',
        'subject_id' => 'integer',
        'grading_period_id' => 'integer',
        'grading_policy_id' => 'integer',
        'assignment_total' => 'float',
        'assignment_max' => 'float',
        'exam_total' => 'float',
        'exam_max' => 'float',
        'assignment_percentage' => 'float',
        'exam_percentage' => 'float',
        'final_percentage' => 'float',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get student grades with full details
     */
    public function getStudentGradesWithDetails($studentId, $filters = []) {
        $sql = "
            SELECT 
                sg.*,
                s.name as subject_name,
                s.code as subject_code,
                c.name as class_name,
                c.section as class_section,
                gp.name as grading_period_name,
                ay.year_code as academic_year,
                gp.start_date as period_start,
                gp.end_date as period_end,
                st.first_name as student_first_name,
                st.last_name as student_last_name,
                st.student_id as student_number,
                u1.name as created_by_name,
                u1.email as created_by_email,
                u2.name as updated_by_name,
                u2.email as updated_by_email
            FROM student_grades sg
            LEFT JOIN subjects s ON sg.subject_id = s.id
            LEFT JOIN classes c ON sg.class_id = c.id
            LEFT JOIN grading_periods gp ON sg.grading_period_id = gp.id
            LEFT JOIN academic_years ay ON gp.academic_year_id = ay.id
            LEFT JOIN students st ON sg.student_id = st.id
            LEFT JOIN users u1 ON sg.created_by = u1.id
            LEFT JOIN users u2 ON sg.updated_by = u2.id
        ";
        
        $whereConditions = ["sg.student_id = ?"];
        $params = [$studentId];
        
        if (!empty($filters['grading_period_id'])) {
            $whereConditions[] = "sg.grading_period_id = ?";
            $params[] = $filters['grading_period_id'];
        }
        
        if (!empty($filters['subject_id'])) {
            $whereConditions[] = "sg.subject_id = ?";
            $params[] = $filters['subject_id'];
        }
        
        if (!empty($filters['class_id'])) {
            $whereConditions[] = "sg.class_id = ?";
            $params[] = $filters['class_id'];
        }
        
        if (!empty($whereConditions)) {
            $sql .= " WHERE " . implode(' AND ', $whereConditions);
        }
        
        $sql .= " ORDER BY s.name ASC, gp.start_date DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get class grades with details
     */
    public function getClassGradesWithDetails($classId, $filters = []) {
        $sql = "
            SELECT 
                sg.*,
                s.name as subject_name,
                s.code as subject_code,
                c.name as class_name,
                c.section as class_section,
                gp.name as grading_period_name,
                ay.year_code as academic_year,
                gp.start_date as period_start,
                gp.end_date as period_end,
                st.first_name as student_first_name,
                st.last_name as student_last_name,
                st.student_id as student_number,
                u1.name as created_by_name,
                u1.email as created_by_email,
                u2.name as updated_by_name,
                u2.email as updated_by_email
            FROM student_grades sg
            LEFT JOIN subjects s ON sg.subject_id = s.id
            LEFT JOIN classes c ON sg.class_id = c.id
            LEFT JOIN grading_periods gp ON sg.grading_period_id = gp.id
            LEFT JOIN academic_years ay ON gp.academic_year_id = ay.id
            LEFT JOIN students st ON sg.student_id = st.id
            LEFT JOIN users u1 ON sg.created_by = u1.id
            LEFT JOIN users u2 ON sg.updated_by = u2.id
            WHERE sg.class_id = ?
        ";
        
        $params = [$classId];
        
        if (!empty($filters['grading_period_id'])) {
            $sql .= " AND sg.grading_period_id = ?";
            $params[] = $filters['grading_period_id'];
        }
        
        if (!empty($filters['subject_id'])) {
            $sql .= " AND sg.subject_id = ?";
            $params[] = $filters['subject_id'];
        }
        
        $sql .= " ORDER BY st.first_name ASC, st.last_name ASC, s.name ASC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get all grades with details (admin only)
     */
    public function getAllGradesWithDetails($filters = []) {
        $sql = "
            SELECT 
                sg.*,
                s.name as subject_name,
                s.code as subject_code,
                c.name as class_name,
                c.section as class_section,
                gp.name as grading_period_name,
                ay.year_code as academic_year,
                gp.start_date as period_start,
                gp.end_date as period_end,
                st.first_name as student_first_name,
                st.last_name as student_last_name,
                st.student_id as student_number,
                u1.name as created_by_name,
                u1.email as created_by_email,
                u2.name as updated_by_name,
                u2.email as updated_by_email
            FROM student_grades sg
            LEFT JOIN subjects s ON sg.subject_id = s.id
            LEFT JOIN classes c ON sg.class_id = c.id
            LEFT JOIN grading_periods gp ON sg.grading_period_id = gp.id
            LEFT JOIN academic_years ay ON gp.academic_year_id = ay.id
            LEFT JOIN students st ON sg.student_id = st.id
            LEFT JOIN users u1 ON sg.created_by = u1.id
            LEFT JOIN users u2 ON sg.updated_by = u2.id
        ";
        
        $whereConditions = [];
        $params = [];
        
        if (!empty($filters['grading_period_id'])) {
            $whereConditions[] = "sg.grading_period_id = ?";
            $params[] = $filters['grading_period_id'];
        }
        
        if (!empty($filters['subject_id'])) {
            $whereConditions[] = "sg.subject_id = ?";
            $params[] = $filters['subject_id'];
        }
        
        if (!empty($filters['class_id'])) {
            $whereConditions[] = "sg.class_id = ?";
            $params[] = $filters['class_id'];
        }
        
        if (!empty($whereConditions)) {
            $sql .= " WHERE " . implode(' AND ', $whereConditions);
        }
        
        $sql .= " ORDER BY c.name ASC, st.first_name ASC, st.last_name ASC, s.name ASC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get single grade with details
     */
    public function getGradeWithDetails($id) {
        $sql = "
            SELECT 
                sg.*,
                s.name as subject_name,
                s.code as subject_code,
                c.name as class_name,
                c.section as class_section,
                gp.name as grading_period_name,
                ay.year_code as academic_year,
                st.first_name as student_first_name,
                st.last_name as student_last_name,
                st.student_id as student_number,
                u1.name as created_by_name,
                u1.email as created_by_email,
                u2.name as updated_by_name,
                u2.email as updated_by_email
            FROM student_grades sg
            LEFT JOIN subjects s ON sg.subject_id = s.id
            LEFT JOIN classes c ON sg.class_id = c.id
            LEFT JOIN grading_periods gp ON sg.grading_period_id = gp.id
            LEFT JOIN academic_years ay ON gp.academic_year_id = ay.id
            LEFT JOIN students st ON sg.student_id = st.id
            LEFT JOIN users u1 ON sg.created_by = u1.id
            LEFT JOIN users u2 ON sg.updated_by = u2.id
            WHERE sg.id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Check if grade exists for student, subject, and period
     */
    public function gradeExists($studentId, $subjectId, $gradingPeriodId) {
        $sql = "SELECT id FROM student_grades WHERE student_id = ? AND subject_id = ? AND grading_period_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId, $subjectId, $gradingPeriodId]);
        return $stmt->fetch() !== false;
    }

    /**
     * Get grade by student, subject, and period
     */
    public function getGradeByStudentSubjectPeriod($studentId, $subjectId, $gradingPeriodId) {
        $sql = "SELECT * FROM student_grades WHERE student_id = ? AND subject_id = ? AND grading_period_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId, $subjectId, $gradingPeriodId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get student's average grade for a period
     */
    public function getStudentPeriodAverage($studentId, $gradingPeriodId) {
        $sql = "
            SELECT 
                AVG(sg.final_percentage) as average_percentage,
                COUNT(sg.id) as total_subjects
            FROM student_grades sg
            WHERE sg.student_id = ? AND sg.grading_period_id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId, $gradingPeriodId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get class average for a subject and period
     */
    public function getClassSubjectAverage($classId, $subjectId, $gradingPeriodId) {
        $sql = "
            SELECT 
                AVG(sg.final_percentage) as average_percentage,
                COUNT(sg.id) as total_students,
                MIN(sg.final_percentage) as lowest_grade,
                MAX(sg.final_percentage) as highest_grade
            FROM student_grades sg
            WHERE sg.class_id = ? AND sg.subject_id = ? AND sg.grading_period_id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$classId, $subjectId, $gradingPeriodId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get grade statistics for a period
     */
    public function getGradeStatistics($gradingPeriodId) {
        $sql = "
            SELECT 
                COUNT(*) as total_grades,
                AVG(final_percentage) as average_percentage,
                MIN(final_percentage) as lowest_grade,
                MAX(final_percentage) as highest_grade,
                COUNT(CASE WHEN final_letter_grade = 'A+' THEN 1 END) as a_plus_count,
                COUNT(CASE WHEN final_letter_grade = 'A' THEN 1 END) as a_count,
                COUNT(CASE WHEN final_letter_grade = 'A-' THEN 1 END) as a_minus_count,
                COUNT(CASE WHEN final_letter_grade = 'B+' THEN 1 END) as b_plus_count,
                COUNT(CASE WHEN final_letter_grade = 'B' THEN 1 END) as b_count,
                COUNT(CASE WHEN final_letter_grade = 'B-' THEN 1 END) as b_minus_count,
                COUNT(CASE WHEN final_letter_grade = 'C+' THEN 1 END) as c_plus_count,
                COUNT(CASE WHEN final_letter_grade = 'C' THEN 1 END) as c_count,
                COUNT(CASE WHEN final_letter_grade = 'C-' THEN 1 END) as c_minus_count,
                COUNT(CASE WHEN final_letter_grade = 'D+' THEN 1 END) as d_plus_count,
                COUNT(CASE WHEN final_letter_grade = 'D' THEN 1 END) as d_count,
                COUNT(CASE WHEN final_letter_grade = 'F' THEN 1 END) as f_count
            FROM student_grades 
            WHERE grading_period_id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$gradingPeriodId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Update grade with calculated values
     */
    public function updateGradeWithCalculation($id, $data) {
        // Get the grading policy
        $policyModel = new GradingPolicyModel($this->pdo);
        $policy = $policyModel->findById($data['grading_policy_id']);
        
        if (!$policy) {
            throw new Exception('Grading policy not found');
        }
        
        // Calculate grades using policy
        $calculatedGrades = $policyModel->calculateFinalGrade(
            $data['assignment_total'],
            $data['exam_total'],
            $policy
        );
        
        // Merge calculated grades with input data
        $updateData = array_merge($data, $calculatedGrades);
        
        return $this->update($id, $updateData);
    }

    /**
     * Create grade with automatic calculation
     */
    public function createGradeWithCalculation($data) {
        // Get the grading policy
        $policyModel = new GradingPolicyModel($this->pdo);
        $policy = $policyModel->findById($data['grading_policy_id']);
        
        if (!$policy) {
            throw new Exception('Grading policy not found');
        }
        
        // Calculate grades using policy
        $calculatedGrades = $policyModel->calculateFinalGrade(
            $data['assignment_total'],
            $data['exam_total'],
            $policy
        );
        
        // Merge calculated grades with input data
        $createData = array_merge($data, $calculatedGrades);
        
        return $this->create($createData);
    }
}
?>
