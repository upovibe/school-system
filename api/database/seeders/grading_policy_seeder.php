<?php
// api/database/seeders/grading_policy_seeder.php - Seeder for grading policies

class GradingPolicySeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "📋 Seeding grading policies...\n";
        
        // Get existing subjects
        $subjects = $this->getSubjects();
        
        if (empty($subjects)) {
            echo "⚠️  No subjects found. Please run subject_seeder first.\n";
            return;
        }
        
        echo "📚 Found " . count($subjects) . " subjects for grading policies\n";
        
        $policies = [
            // English Language - Balanced approach
            [
                'name' => 'English Language Grading Policy',
                'description' => 'English Language grading policy with balanced assessment (Grades 1-9: 1=HIGHEST, 2=HIGHER, 3=HIGH, 4=HIGH AVERAGE, 5=AVERAGE, 6=LOW AVERAGE, 7=LOW, 8=LOWER, 9=LOWEST)',
                'subject_id' => $this->getSubjectId('English Language'),
                'is_active' => 1,
                'assignment_max_score' => 60,
                'exam_max_score' => 40,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Mathematics - More emphasis on assignments
            [
                'name' => 'Mathematics Grading Policy',
                'description' => 'Mathematics grading policy with emphasis on assignments and problem-solving',
                'subject_id' => $this->getSubjectId('Mathematics'),
                'is_active' => 1,
                'assignment_max_score' => 70,
                'exam_max_score' => 30,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Integrated Science - Practical emphasis
            [
                'name' => 'Integrated Science Grading Policy',
                'description' => 'Integrated Science grading policy with emphasis on practical work',
                'subject_id' => $this->getSubjectId('Integrated Science'),
                'is_active' => 1,
                'assignment_max_score' => 65,
                'exam_max_score' => 35,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Social Studies - Balanced approach
            [
                'name' => 'Social Studies Grading Policy',
                'description' => 'Social Studies grading policy with balanced assessment',
                'subject_id' => $this->getSubjectId('Social Studies'),
                'is_active' => 1,
                'assignment_max_score' => 60,
                'exam_max_score' => 40,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Religious and Moral Education - Balanced approach
            [
                'name' => 'Religious and Moral Education Grading Policy',
                'description' => 'RME grading policy with balanced assessment',
                'subject_id' => $this->getSubjectId('Religious and Moral Education'),
                'is_active' => 1,
                'assignment_max_score' => 60,
                'exam_max_score' => 40,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Creative Arts - Practical emphasis
            [
                'name' => 'Creative Arts Grading Policy',
                'description' => 'Creative Arts grading policy with emphasis on practical skills',
                'subject_id' => $this->getSubjectId('Creative Arts'),
                'is_active' => 1,
                'assignment_max_score' => 70,
                'exam_max_score' => 30,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Physical Education - Practical emphasis
            [
                'name' => 'Physical Education Grading Policy',
                'description' => 'Physical Education grading policy with emphasis on practical skills',
                'subject_id' => $this->getSubjectId('Physical Education'),
                'is_active' => 1,
                'assignment_max_score' => 70,
                'exam_max_score' => 30,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // ICT - Practical emphasis
            [
                'name' => 'ICT Grading Policy',
                'description' => 'ICT grading policy with emphasis on practical skills',
                'subject_id' => $this->getSubjectId('ICT'),
                'is_active' => 1,
                'assignment_max_score' => 75,
                'exam_max_score' => 25,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Language & Literacy - KG subject
            [
                'name' => 'Language & Literacy Grading Policy',
                'description' => 'Language & Literacy grading policy for KG levels',
                'subject_id' => $this->getSubjectId('Language & Literacy'),
                'is_active' => 1,
                'assignment_max_score' => 70,
                'exam_max_score' => 30,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Numeracy - KG subject
            [
                'name' => 'Numeracy Grading Policy',
                'description' => 'Numeracy grading policy for KG levels',
                'subject_id' => $this->getSubjectId('Numeracy'),
                'is_active' => 1,
                'assignment_max_score' => 70,
                'exam_max_score' => 30,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Environmental Studies - KG subject
            [
                'name' => 'Environmental Studies Grading Policy',
                'description' => 'Environmental Studies grading policy for KG levels',
                'subject_id' => $this->getSubjectId('Environmental Studies'),
                'is_active' => 1,
                'assignment_max_score' => 60,
                'exam_max_score' => 40,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Physical Development - KG subject
            [
                'name' => 'Physical Development Grading Policy',
                'description' => 'Physical Development grading policy for KG levels',
                'subject_id' => $this->getSubjectId('Physical Development'),
                'is_active' => 1,
                'assignment_max_score' => 70,
                'exam_max_score' => 30,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Ghanaian Language - Primary/JHS subject
            [
                'name' => 'Ghanaian Language Grading Policy',
                'description' => 'Ghanaian Language grading policy with balanced assessment',
                'subject_id' => $this->getSubjectId('Ghanaian Language'),
                'is_active' => 1,
                'assignment_max_score' => 60,
                'exam_max_score' => 40,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Science - Primary subject
            [
                'name' => 'Science Grading Policy',
                'description' => 'Science grading policy with emphasis on practical work',
                'subject_id' => $this->getSubjectId('Science'),
                'is_active' => 1,
                'assignment_max_score' => 65,
                'exam_max_score' => 35,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Our World Our People - Primary subject
            [
                'name' => 'Our World Our People Grading Policy',
                'description' => 'Our World Our People grading policy with balanced assessment',
                'subject_id' => $this->getSubjectId('Our World Our People'),
                'is_active' => 1,
                'assignment_max_score' => 60,
                'exam_max_score' => 40,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Computing - Primary/JHS subject
            [
                'name' => 'Computing Grading Policy',
                'description' => 'Computing grading policy with emphasis on practical skills',
                'subject_id' => $this->getSubjectId('Computing'),
                'is_active' => 1,
                'assignment_max_score' => 75,
                'exam_max_score' => 25,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Career Technology - JHS subject
            [
                'name' => 'Career Technology Grading Policy',
                'description' => 'Career Technology grading policy with emphasis on practical skills',
                'subject_id' => $this->getSubjectId('Career Technology'),
                'is_active' => 1,
                'assignment_max_score' => 70,
                'exam_max_score' => 30,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // French - JHS subject
            [
                'name' => 'French Grading Policy',
                'description' => 'French grading policy with emphasis on language skills',
                'subject_id' => $this->getSubjectId('French'),
                'is_active' => 1,
                'assignment_max_score' => 60,
                'exam_max_score' => 40,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ],
            
            // Arabic - JHS subject
            [
                'name' => 'Arabic Grading Policy',
                'description' => 'Arabic grading policy with emphasis on language skills',
                'subject_id' => $this->getSubjectId('Arabic'),
                'is_active' => 1,
                'assignment_max_score' => 60,
                'exam_max_score' => 40,
                'grade_boundaries' => json_encode([
                    [ 'grade' => 'A+', 'min' => 90 ],
                    [ 'grade' => 'A', 'min' => 80 ],
                    [ 'grade' => 'B+', 'min' => 70 ],
                    [ 'grade' => 'B', 'min' => 60 ],
                    [ 'grade' => 'C+', 'min' => 55 ],
                    [ 'grade' => 'C', 'min' => 50 ],
                    [ 'grade' => 'D+', 'min' => 40 ],
                    [ 'grade' => 'E', 'min' => 35 ],
                    [ 'grade' => 'F', 'min' => 0 ],
                ]),
                'created_by' => $this->getAdminUserId()
            ]
        ];
        
        $successCount = 0;
        foreach ($policies as $policy) {
            if ($this->seedGradingPolicy($policy)) {
                $successCount++;
            }
        }
        
        echo "📊 Total grading policies seeded: " . $successCount . "\n";
    }
    
    /**
     * Helper methods to get existing data
     */
    private function getSubjects() {
        $stmt = $this->pdo->query("SELECT id, name, code FROM subjects WHERE status = 'active'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getSubjectId($name) {
        $stmt = $this->pdo->prepare("SELECT id FROM subjects WHERE name = ? AND status = 'active'");
        $stmt->execute([$name]);
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
     * Seed individual grading policy
     */
    private function seedGradingPolicy($policyData) {
        // Check if subject_id is null and handle it
        if ($policyData['subject_id'] === null) {
            echo "⚠️  Subject not found for '{$policyData['name']}'. Skipping grading policy.\n";
            return false;
        }
        
        // Check if policy already exists for this subject
        $stmt = $this->pdo->prepare('SELECT id FROM grading_policies WHERE subject_id = ?');
        $stmt->execute([$policyData['subject_id']]);
        $existingPolicy = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingPolicy) {
            echo "⚠️  Grading policy for subject ID {$policyData['subject_id']} already exists\n";
            return false; // Indicate failure
        }
        
        // Check if created_by is null and handle it
        if ($policyData['created_by'] === null) {
            echo "⚠️  No user found for created_by. Skipping grading policy {$policyData['name']}\n";
            return false; // Indicate failure
        }
        
        // Insert policy
        $sql = "INSERT INTO grading_policies (name, description, subject_id, is_active, assignment_max_score, exam_max_score, grade_boundaries, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $policyData['name'],
            $policyData['description'],
            $policyData['subject_id'],
            $policyData['is_active'],
            $policyData['assignment_max_score'],
            $policyData['exam_max_score'],
            $policyData['grade_boundaries'],
            $policyData['created_by']
        ]);
        
        echo "✅ Grading policy {$policyData['name']} seeded\n";
        return true; // Indicate success
    }
}
?>
