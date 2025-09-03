<?php
// api/database/seeders/subject_seeder.php - Seeder for Ghanaian school subjects

class SubjectSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding Ghanaian school subjects...\n";
        
        $this->seedSubjects();
        
        echo "✅ Ghanaian school subjects seeded successfully!\n";
    }
    
    private function seedSubjects() {
        echo "📝 Seeding subjects for basic Ghanaian school system...\n";
        
        $subjects = [
            // Kindergarten (KG1-KG2) Subjects
            [
                'name' => 'Language & Literacy',
                'code' => 'LANG_LIT',
                'description' => 'Language & Literacy (English, Ghanaian Language & Literacy)',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Numeracy',
                'code' => 'NUMERACY',
                'description' => 'Basic Numeracy and Number Concepts',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Environmental Studies',
                'code' => 'ENV_STUDIES',
                'description' => 'Our World Our People (Environmental Studies)',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Creative Arts & Design',
                'code' => 'CREATIVE_ARTS',
                'description' => 'Creative Arts & Design',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Physical Development',
                'code' => 'PHYS_DEV',
                'description' => 'Physical Development, Health & Safety',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Religious & Moral Education',
                'code' => 'RME',
                'description' => 'Religious & Moral Education (RME)',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'ICT',
                'code' => 'ICT',
                'description' => 'Information and Communication Technology',
                'category' => 'core',
                'status' => 'active'
            ],
            
            // Primary (Basic 1-6) Additional Subjects
            [
                'name' => 'English Language',
                'code' => 'ENG',
                'description' => 'English Language',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Ghanaian Language',
                'code' => 'GHA_LANG',
                'description' => 'Ghanaian Language',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Mathematics',
                'code' => 'MATH',
                'description' => 'Mathematics',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Science',
                'code' => 'SCIENCE',
                'description' => 'Science (introduced formally from Basic 4)',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Our World Our People',
                'code' => 'OWOP',
                'description' => 'Our World Our People (OWOP)',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Physical Education',
                'code' => 'PE',
                'description' => 'Physical Education',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Computing',
                'code' => 'COMPUTING',
                'description' => 'Computing (ICT)',
                'category' => 'core',
                'status' => 'active'
            ],
            
            // Junior High School (JHS1-JHS3) Additional Subjects
            [
                'name' => 'Integrated Science',
                'code' => 'INTEGRATED_SCI',
                'description' => 'Integrated Science',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Social Studies',
                'code' => 'SOC_STUDIES',
                'description' => 'Social Studies',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Career Technology',
                'code' => 'CAREER_TECH',
                'description' => 'Career Technology (replaces Pre-Technical Skills & Home Economics)',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'French',
                'code' => 'FRENCH',
                'description' => 'French (optional subject)',
                'category' => 'elective',
                'status' => 'active'
            ],
            [
                'name' => 'Arabic',
                'code' => 'ARABIC',
                'description' => 'Arabic',
                'category' => 'elective',
                'status' => 'active'
            ]
        ];
        
        foreach ($subjects as $subject) {
            // Check if subject already exists
            $stmt = $this->pdo->prepare('SELECT id FROM subjects WHERE code = ?');
            $stmt->execute([$subject['code']]);
            $existingSubject = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingSubject) {
                echo "⚠️  Subject with code '{$subject['code']}' already exists\n";
                continue;
            }
            
            // Insert subject
            $stmt = $this->pdo->prepare('
                INSERT INTO subjects (name, code, description, category, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                $subject['name'],
                $subject['code'],
                $subject['description'],
                $subject['category'],
                $subject['status']
            ]);
            
            echo "✅ Added subject: {$subject['name']} ({$subject['code']})\n";
        }
        
        echo "📊 Total subjects seeded: " . count($subjects) . "\n";
        echo "📚 Breakdown: 7 KG subjects, 7 Primary subjects, 5 JHS subjects (2 elective)\n";
    }
}
?> 