<?php
// api/database/seeders/student_grade_seeder.php - Seeder for student grades

class StudentGradeSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "📊 Seeding sample grades...\n";
        
        // Get existing data
        $students = $this->getStudents();
        $classes = $this->getClasses();
        $subjects = $this->getSubjects();
        $periods = $this->getGradingPeriods();
        $policies = $this->getGradingPolicies();
        
        // Check if we have the required data
        if (empty($periods)) {
            echo "⚠️  No grading periods found. Skipping sample grades.\n";
            return;
        }
        
        if (empty($policies)) {
            echo "⚠️  No grading policies found. Skipping sample grades.\n";
            return;
        }
        
        // Sample grades for JHS 1, 2, and 3 students
        $sampleGrades = [
            // JHS 1 Students - Mathematics
            [
                'student_id' => $this->getStudentId('STU250811133'), // Akosua Nkrumah
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'], // First Term
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 65.0, // Out of 70 max
                'exam_total' => 28.0, // Out of 30 max
                'remarks' => 'Excellent performance in both assignments and exams',
                'created_by' => $this->getAdminUserId()
            ],
            [
                'student_id' => $this->getStudentId('STU250811134'), // Akua Hammond
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 58.0, // Out of 70 max
                'exam_total' => 25.0, // Out of 30 max
                'remarks' => 'Good performance in assignments, needs improvement in exam techniques',
                'created_by' => $this->getAdminUserId()
            ],
            [
                'student_id' => $this->getStudentId('STU250811135'), // Afia Johnson
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 62.0, // Out of 70 max
                'exam_total' => 26.0, // Out of 30 max
                'remarks' => 'Strong mathematical foundation, consistent performance',
                'created_by' => $this->getAdminUserId()
            ],
            
            // JHS 1 Students - English Language
            [
                'student_id' => $this->getStudentId('STU250811133'), // Akosua Nkrumah
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('English Language'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('English Language'),
                'assignment_total' => 55.0, // Out of 60 max
                'exam_total' => 35.0, // Out of 40 max
                'remarks' => 'Excellent writing skills and comprehension',
                'created_by' => $this->getAdminUserId()
            ],
            [
                'student_id' => $this->getStudentId('STU250811134'), // Akua Hammond
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('English Language'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('English Language'),
                'assignment_total' => 52.0, // Out of 60 max
                'exam_total' => 32.0, // Out of 40 max
                'remarks' => 'Good progress in reading comprehension',
                'created_by' => $this->getAdminUserId()
            ],
            
            // JHS 1 Students - Integrated Science
            [
                'student_id' => $this->getStudentId('STU250811135'), // Afia Johnson
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('Integrated Science'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Integrated Science'),
                'assignment_total' => 58.0, // Out of 65 max
                'exam_total' => 32.0, // Out of 35 max
                'remarks' => 'Strong practical skills demonstrated',
                'created_by' => $this->getAdminUserId()
            ],
            [
                'student_id' => $this->getStudentId('STU250811136'), // Ama Darko
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('Integrated Science'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Integrated Science'),
                'assignment_total' => 55.0, // Out of 65 max
                'exam_total' => 30.0, // Out of 35 max
                'remarks' => 'Good understanding of scientific concepts',
                'created_by' => $this->getAdminUserId()
            ],
            
            // JHS 2 Students - Mathematics
            [
                'student_id' => $this->getStudentId('STU250811151'), // Akua Hammond
                'class_id' => $this->getClassId('JHS 2', 'A'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 68.0, // Out of 70 max
                'exam_total' => 29.0, // Out of 30 max
                'remarks' => 'Outstanding performance in advanced mathematics',
                'created_by' => $this->getAdminUserId()
            ],
            [
                'student_id' => $this->getStudentId('STU250811152'), // Kwame Boateng
                'class_id' => $this->getClassId('JHS 2', 'A'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 60.0, // Out of 70 max
                'exam_total' => 27.0, // Out of 30 max
                'remarks' => 'Good problem-solving skills, consistent effort',
                'created_by' => $this->getAdminUserId()
            ],
            
            // JHS 2 Students - English Language
            [
                'student_id' => $this->getStudentId('STU250811153'), // Akosua Lartey
                'class_id' => $this->getClassId('JHS 2', 'A'),
                'subject_id' => $this->getSubjectId('English Language'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('English Language'),
                'assignment_total' => 57.0, // Out of 60 max
                'exam_total' => 36.0, // Out of 40 max
                'remarks' => 'Excellent communication skills and vocabulary',
                'created_by' => $this->getAdminUserId()
            ],
            
            // JHS 3 Students - Mathematics
            [
                'student_id' => $this->getStudentId('STU250811171'), // Afia Adjei
                'class_id' => $this->getClassId('JHS 3', 'A'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 69.0, // Out of 70 max
                'exam_total' => 30.0, // Out of 30 max
                'remarks' => 'Exceptional mathematical ability, ready for advanced studies',
                'created_by' => $this->getAdminUserId()
            ],
            [
                'student_id' => $this->getStudentId('STU250811172'), // Kweku Appiah
                'class_id' => $this->getClassId('JHS 3', 'A'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 64.0, // Out of 70 max
                'exam_total' => 28.0, // Out of 30 max
                'remarks' => 'Strong analytical skills, good preparation for final exams',
                'created_by' => $this->getAdminUserId()
            ],
            
            // JHS 3 Students - Integrated Science
            [
                'student_id' => $this->getStudentId('STU250811173'), // Yaw Owusu
                'class_id' => $this->getClassId('JHS 3', 'A'),
                'subject_id' => $this->getSubjectId('Integrated Science'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Integrated Science'),
                'assignment_total' => 62.0, // Out of 65 max
                'exam_total' => 33.0, // Out of 35 max
                'remarks' => 'Excellent scientific reasoning and practical application',
                'created_by' => $this->getAdminUserId()
            ]
        ];
        
        foreach ($sampleGrades as $grade) {
            $this->seedGrade($grade);
        }
        
        echo "📊 Total sample grades seeded: " . count($sampleGrades) . "\n";
    }
    
    /**
     * Helper methods to get existing data
     */
    private function getStudents() {
        $stmt = $this->pdo->query("SELECT id, student_id, first_name, last_name FROM students WHERE status = 'active'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getClasses() {
        $stmt = $this->pdo->query("SELECT id, name, section FROM classes WHERE status = 'active'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getSubjects() {
        $stmt = $this->pdo->query("SELECT id, name, code FROM subjects WHERE status = 'active'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getGradingPeriods() {
        $stmt = $this->pdo->query("
            SELECT gp.id, gp.name, ay.year_code as academic_year 
            FROM grading_periods gp 
            JOIN academic_years ay ON gp.academic_year_id = ay.id
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getGradingPolicies() {
        $stmt = $this->pdo->query("SELECT id, name, subject_id FROM grading_policies WHERE is_active = 1");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getStudentId($studentId) {
        $stmt = $this->pdo->prepare("SELECT id FROM students WHERE student_id = ? AND status = 'active'");
        $stmt->execute([$studentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : null;
    }
    
    private function getClassId($name, $section) {
        $stmt = $this->pdo->prepare("SELECT id FROM classes WHERE name = ? AND section = ? AND status = 'active'");
        $stmt->execute([$name, $section]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : null;
    }
    
    private function getSubjectId($name) {
        $stmt = $this->pdo->prepare("SELECT id FROM subjects WHERE name = ? AND status = 'active'");
        $stmt->execute([$name]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : null;
    }
    
    private function getPolicyId($subjectName) {
        $subjectId = $this->getSubjectId($subjectName);
        if (!$subjectId) return null;
        
        $stmt = $this->pdo->prepare("SELECT id FROM grading_policies WHERE subject_id = ? AND is_active = 1");
        $stmt->execute([$subjectId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : null;
    }
    
    /**
     * Get admin user ID or create a default one
     */
    private function getAdminUserId() {
        // Try to get the first admin user (role_id = 1 is typically admin)
        $stmt = $this->pdo->prepare("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin' LIMIT 1");
        $stmt->execute();
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            return $admin['id'];
        }
        
        // Fallback: try to get user with role_id = 1 (assuming admin is role_id 1)
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE role_id = 1 LIMIT 1");
        $stmt->execute();
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            return $admin['id'];
        }
        
        // If no admin user exists, try to get any user
        $stmt = $this->pdo->prepare("SELECT id FROM users LIMIT 1");
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            return $user['id'];
        }
        
        // If no users exist, return null (will be handled by foreign key constraint)
        return null;
    }
    
    /**
     * Seed individual grade
     */
    private function seedGrade($gradeData) {
        // Check if grade already exists
        $stmt = $this->pdo->prepare('SELECT id FROM student_grades WHERE student_id = ? AND subject_id = ? AND grading_period_id = ?');
        $stmt->execute([$gradeData['student_id'], $gradeData['subject_id'], $gradeData['grading_period_id']]);
        $existingGrade = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingGrade) {
            echo "⚠️  Grade for student {$gradeData['student_id']}, subject {$gradeData['subject_id']}, period {$gradeData['grading_period_id']} already exists\n";
            return;
        }
        
        // Calculate grades using policy
        require_once __DIR__ . '/../../models/GradingPolicyModel.php';
        $policyModel = new GradingPolicyModel($this->pdo);
        $policy = $policyModel->findById($gradeData['grading_policy_id']);
        
        if (!$policy) {
            echo "⚠️  Grading policy not found for ID {$gradeData['grading_policy_id']}\n";
            return;
        }
        
        $calculatedGrades = $policyModel->calculateFinalGrade(
            $gradeData['assignment_total'],
            $gradeData['exam_total'],
            $policy
        );
        
        // Merge calculated grades with input data
        $insertData = array_merge($gradeData, $calculatedGrades);
        
        // Insert grade
        $sql = "INSERT INTO student_grades (student_id, class_id, subject_id, grading_period_id, grading_policy_id, 
                assignment_total, exam_total, final_percentage, final_letter_grade, remarks, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $insertData['student_id'],
            $insertData['class_id'],
            $insertData['subject_id'],
            $insertData['grading_period_id'],
            $insertData['grading_policy_id'],
            $insertData['assignment_total'],
            $insertData['exam_total'],
            $insertData['final_percentage'],
            $insertData['final_letter_grade'],
            $insertData['remarks'],
            $insertData['created_by']
        ]);
        
        echo "✅ Grade seeded for student {$gradeData['student_id']}, subject {$gradeData['subject_id']}\n";
    }
}
?>
