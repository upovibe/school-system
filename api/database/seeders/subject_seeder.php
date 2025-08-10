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
            // Core subjects that apply across all levels
            [
                'name' => 'English Language',
                'code' => 'ENG',
                'description' => 'English Language and Communication Skills',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Mathematics',
                'code' => 'MATH',
                'description' => 'Mathematics and Problem Solving',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Integrated Science',
                'code' => 'SCI',
                'description' => 'Integrated Science and Environmental Studies',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Social Studies',
                'code' => 'SOC',
                'description' => 'Social Studies, History, Geography, and Citizenship',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Religious and Moral Education',
                'code' => 'RME',
                'description' => 'Religious and Moral Education',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Creative Arts',
                'code' => 'ART',
                'description' => 'Creative Arts, Music, and Design',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Physical Education',
                'code' => 'PE',
                'description' => 'Physical Education and Sports',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Information and Communication Technology',
                'code' => 'ICT',
                'description' => 'ICT and Computer Studies',
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
    }
}
?> 