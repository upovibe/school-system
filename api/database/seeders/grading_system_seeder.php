<?php
// api/database/seeders/grading_system_seeder.php - Seeder for grading system

class GradingSystemSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding grading system...\n";
        
        $this->seedGradingPeriods();
        $this->seedGradingPolicies();
        $this->seedSampleGrades();
        
        echo "✅ Grading system seeded successfully!\n";
    }
    
    /**
     * Seed grading periods for the academic year
     */
    private function seedGradingPeriods() {
        echo "📅 Seeding grading periods...\n";
        
        $periods = [
            [
                'name' => 'First Term',
                'academic_year' => '2024-2025',
                'start_date' => '2024-09-01',
                'end_date' => '2024-12-15',
                'is_active' => true,
                'description' => 'First term of the 2024-2025 academic year',
                'created_by' => 1 // Admin user
            ],
            [
                'name' => 'Second Term',
                'academic_year' => '2024-2025',
                'start_date' => '2025-01-15',
                'end_date' => '2025-04-15',
                'is_active' => false,
                'description' => 'Second term of the 2024-2025 academic year',
                'created_by' => 1
            ],
            [
                'name' => 'Third Term',
                'academic_year' => '2024-2025',
                'start_date' => '2025-05-01',
                'end_date' => '2025-07-31',
                'is_active' => false,
                'description' => 'Third term of the 2024-2025 academic year',
                'created_by' => 1
            ]
        ];
        
        foreach ($periods as $period) {
            $this->seedGradingPeriod($period);
        }
        
        echo "📊 Total grading periods seeded: " . count($periods) . "\n";
    }
    
    /**
     * Seed grading policies for different subjects
     */
    private function seedGradingPolicies() {
        echo "📋 Seeding grading policies...\n";
        
        // Get existing subjects
        $subjects = $this->getSubjects();
        
        $policies = [
            // Mathematics - More emphasis on assignments
            [
                'name' => 'Mathematics Grading Policy',
                'description' => 'Mathematics grading policy with emphasis on assignments and problem-solving',
                'subject_id' => $this->getSubjectId('Mathematics'),
                'is_active' => true,
                'assignment_weight' => 0.70,
                'exam_weight' => 0.30,
                'grade_boundaries' => json_encode([
                    'A+' => 90,
                    'A' => 80,
                    'A-' => 75,
                    'B+' => 70,
                    'B' => 65,
                    'B-' => 60,
                    'C+' => 55,
                    'C' => 50,
                    'C-' => 45,
                    'D+' => 40,
                    'D' => 35,
                    'F' => 0
                ]),
                'created_by' => 1
            ],
            
            // English Language - Balanced approach
            [
                'name' => 'English Language Grading Policy',
                'description' => 'English Language grading policy with balanced assessment',
                'subject_id' => $this->getSubjectId('English Language'),
                'is_active' => true,
                'assignment_weight' => 0.60,
                'exam_weight' => 0.40,
                'grade_boundaries' => json_encode([
                    'A+' => 90,
                    'A' => 80,
                    'A-' => 75,
                    'B+' => 70,
                    'B' => 65,
                    'B-' => 60,
                    'C+' => 55,
                    'C' => 50,
                    'C-' => 45,
                    'D+' => 40,
                    'D' => 35,
                    'F' => 0
                ]),
                'created_by' => 1
            ],
            
            // Integrated Science - Practical emphasis
            [
                'name' => 'Integrated Science Grading Policy',
                'description' => 'Integrated Science grading policy with emphasis on practical work',
                'subject_id' => $this->getSubjectId('Integrated Science'),
                'is_active' => true,
                'assignment_weight' => 0.65,
                'exam_weight' => 0.35,
                'grade_boundaries' => json_encode([
                    'A+' => 90,
                    'A' => 80,
                    'A-' => 75,
                    'B+' => 70,
                    'B' => 65,
                    'B-' => 60,
                    'C+' => 55,
                    'C' => 50,
                    'C-' => 45,
                    'D+' => 40,
                    'D' => 35,
                    'F' => 0
                ]),
                'created_by' => 1
            ],
            
            // Social Studies - Balanced approach
            [
                'name' => 'Social Studies Grading Policy',
                'description' => 'Social Studies grading policy with balanced assessment',
                'subject_id' => $this->getSubjectId('Social Studies'),
                'is_active' => true,
                'assignment_weight' => 0.60,
                'exam_weight' => 0.40,
                'grade_boundaries' => json_encode([
                    'A+' => 90,
                    'A' => 80,
                    'A-' => 75,
                    'B+' => 70,
                    'B' => 65,
                    'B-' => 60,
                    'C+' => 55,
                    'C' => 50,
                    'C-' => 45,
                    'D+' => 40,
                    'D' => 35,
                    'F' => 0
                ]),
                'created_by' => 1
            ],
            
            // ICT - Practical emphasis
            [
                'name' => 'ICT Grading Policy',
                'description' => 'ICT grading policy with emphasis on practical skills',
                'subject_id' => $this->getSubjectId('ICT'),
                'is_active' => true,
                'assignment_weight' => 0.75,
                'exam_weight' => 0.25,
                'grade_boundaries' => json_encode([
                    'A+' => 90,
                    'A' => 80,
                    'A-' => 75,
                    'B+' => 70,
                    'B' => 65,
                    'B-' => 60,
                    'C+' => 55,
                    'C' => 50,
                    'C-' => 45,
                    'D+' => 40,
                    'D' => 35,
                    'F' => 0
                ]),
                'created_by' => 1
            ]
        ];
        
        foreach ($policies as $policy) {
            $this->seedGradingPolicy($policy);
        }
        
        echo "📊 Total grading policies seeded: " . count($policies) . "\n";
    }
    
    /**
     * Seed sample grades for demonstration
     */
    private function seedSampleGrades() {
        echo "📊 Seeding sample grades...\n";
        
        // Get existing data
        $students = $this->getStudents();
        $classes = $this->getClasses();
        $subjects = $this->getSubjects();
        $periods = $this->getGradingPeriods();
        $policies = $this->getGradingPolicies();
        
        // Sample grades for demonstration
        $sampleGrades = [
            // Student 1 (Kwame Asante) - JHS 1A
            [
                'student_id' => $this->getStudentId('S001'),
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'], // First Term
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 85.0,
                'assignment_max' => 100.0,
                'exam_total' => 78.0,
                'exam_max' => 100.0,
                'remarks' => 'Good performance in assignments, needs improvement in exam techniques',
                'created_by' => 1
            ],
            [
                'student_id' => $this->getStudentId('S001'),
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('English Language'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('English Language'),
                'assignment_total' => 92.0,
                'assignment_max' => 100.0,
                'exam_total' => 88.0,
                'exam_max' => 100.0,
                'remarks' => 'Excellent performance in both assignments and exams',
                'created_by' => 1
            ],
            
            // Student 2 (Ama Osei) - JHS 1A
            [
                'student_id' => $this->getStudentId('S002'),
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 78.0,
                'assignment_max' => 100.0,
                'exam_total' => 82.0,
                'exam_max' => 100.0,
                'remarks' => 'Shows improvement in exam performance',
                'created_by' => 1
            ],
            [
                'student_id' => $this->getStudentId('S002'),
                'class_id' => $this->getClassId('JHS 1', 'A'),
                'subject_id' => $this->getSubjectId('Integrated Science'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Integrated Science'),
                'assignment_total' => 88.0,
                'assignment_max' => 100.0,
                'exam_total' => 85.0,
                'exam_max' => 100.0,
                'remarks' => 'Strong practical skills demonstrated',
                'created_by' => 1
            ],
            
            // Student 3 (Kofi Mensah) - JHS 1B
            [
                'student_id' => $this->getStudentId('S003'),
                'class_id' => $this->getClassId('JHS 1', 'B'),
                'subject_id' => $this->getSubjectId('Mathematics'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('Mathematics'),
                'assignment_total' => 95.0,
                'assignment_max' => 100.0,
                'exam_total' => 92.0,
                'exam_max' => 100.0,
                'remarks' => 'Outstanding performance in all areas',
                'created_by' => 1
            ],
            [
                'student_id' => $this->getStudentId('S003'),
                'class_id' => $this->getClassId('JHS 1', 'B'),
                'subject_id' => $this->getSubjectId('ICT'),
                'grading_period_id' => $periods[0]['id'],
                'grading_policy_id' => $this->getPolicyId('ICT'),
                'assignment_total' => 90.0,
                'assignment_max' => 100.0,
                'exam_total' => 85.0,
                'exam_max' => 100.0,
                'remarks' => 'Excellent practical ICT skills',
                'created_by' => 1
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
    private function getSubjects() {
        $stmt = $this->pdo->query("SELECT id, name, code FROM subjects WHERE status = 'active'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getStudents() {
        $stmt = $this->pdo->query("SELECT id, student_id, first_name, last_name FROM students WHERE status = 'active'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getClasses() {
        $stmt = $this->pdo->query("SELECT id, name, section FROM classes WHERE status = 'active'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getGradingPeriods() {
        $stmt = $this->pdo->query("SELECT id, name, academic_year FROM grading_periods");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getGradingPolicies() {
        $stmt = $this->pdo->query("SELECT id, name, subject_id FROM grading_policies WHERE is_active = 1");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getSubjectId($name) {
        $stmt = $this->pdo->prepare("SELECT id FROM subjects WHERE name = ? AND status = 'active'");
        $stmt->execute([$name]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : null;
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
    
    private function getPolicyId($subjectName) {
        $subjectId = $this->getSubjectId($subjectName);
        if (!$subjectId) return null;
        
        $stmt = $this->pdo->prepare("SELECT id FROM grading_policies WHERE subject_id = ? AND is_active = 1");
        $stmt->execute([$subjectId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : null;
    }
    
    /**
     * Seed individual records
     */
    private function seedGradingPeriod($periodData) {
        // Check if period already exists
        $stmt = $this->pdo->prepare('SELECT id FROM grading_periods WHERE name = ? AND academic_year = ?');
        $stmt->execute([$periodData['name'], $periodData['academic_year']]);
        $existingPeriod = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingPeriod) {
            echo "⚠️  Grading period {$periodData['name']} for {$periodData['academic_year']} already exists\n";
            return;
        }
        
        // Insert period
        $sql = "INSERT INTO grading_periods (name, academic_year, start_date, end_date, is_active, description, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $periodData['name'],
            $periodData['academic_year'],
            $periodData['start_date'],
            $periodData['end_date'],
            $periodData['is_active'],
            $periodData['description'],
            $periodData['created_by']
        ]);
        
        echo "✅ Grading period {$periodData['name']} seeded\n";
    }
    
    private function seedGradingPolicy($policyData) {
        // Check if policy already exists for this subject
        $stmt = $this->pdo->prepare('SELECT id FROM grading_policies WHERE subject_id = ?');
        $stmt->execute([$policyData['subject_id']]);
        $existingPolicy = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingPolicy) {
            echo "⚠️  Grading policy for subject ID {$policyData['subject_id']} already exists\n";
            return;
        }
        
        // Insert policy
        $sql = "INSERT INTO grading_policies (name, description, subject_id, is_active, assignment_weight, exam_weight, grade_boundaries, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $policyData['name'],
            $policyData['description'],
            $policyData['subject_id'],
            $policyData['is_active'],
            $policyData['assignment_weight'],
            $policyData['exam_weight'],
            $policyData['grade_boundaries'],
            $policyData['created_by']
        ]);
        
        echo "✅ Grading policy {$policyData['name']} seeded\n";
    }
    
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
        $policyModel = new GradingPolicyModel($this->pdo);
        $policy = $policyModel->findById($gradeData['grading_policy_id']);
        
        if (!$policy) {
            echo "⚠️  Grading policy not found for ID {$gradeData['grading_policy_id']}\n";
            return;
        }
        
        $calculatedGrades = $policyModel->calculateFinalGrade(
            $gradeData['assignment_total'],
            $gradeData['assignment_max'],
            $gradeData['exam_total'],
            $gradeData['exam_max'],
            $policy
        );
        
        // Merge calculated grades with input data
        $insertData = array_merge($gradeData, $calculatedGrades);
        
        // Insert grade
        $sql = "INSERT INTO student_grades (student_id, class_id, subject_id, grading_period_id, grading_policy_id, 
                assignment_total, assignment_max, exam_total, exam_max, assignment_percentage, exam_percentage, 
                final_percentage, final_letter_grade, remarks, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $insertData['student_id'],
            $insertData['class_id'],
            $insertData['subject_id'],
            $insertData['grading_period_id'],
            $insertData['grading_policy_id'],
            $insertData['assignment_total'],
            $insertData['assignment_max'],
            $insertData['exam_total'],
            $insertData['exam_max'],
            $insertData['assignment_percentage'],
            $insertData['exam_percentage'],
            $insertData['final_percentage'],
            $insertData['final_letter_grade'],
            $insertData['remarks'],
            $insertData['created_by']
        ]);
        
        echo "✅ Grade seeded for student {$gradeData['student_id']}, subject {$gradeData['subject_id']}\n";
    }
}
?>
