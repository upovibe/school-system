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
        echo "📝 Seeding subjects from KG1 to JHS3...\n";
        
        $subjects = [
            // Kindergarten (KG1-KG2) - All Core
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
                'description' => 'Basic Mathematics and Number Concepts',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Integrated Science',
                'code' => 'SCI',
                'description' => 'Basic Science and Environmental Studies',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Creative Arts',
                'code' => 'ART',
                'description' => 'Art, Music, and Creative Expression',
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
                'name' => 'Social Studies',
                'code' => 'SOC',
                'description' => 'Social Studies and Citizenship Education',
                'category' => 'core',
                'status' => 'active'
            ],
            
            // Primary School (P1-P6) - Core and Elective
            [
                'name' => 'English Language',
                'code' => 'ENG_P',
                'description' => 'English Language, Reading, and Writing',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Mathematics',
                'code' => 'MATH_P',
                'description' => 'Primary Mathematics and Problem Solving',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Integrated Science',
                'code' => 'SCI_P',
                'description' => 'Primary Science and Environmental Studies',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Social Studies',
                'code' => 'SOC_P',
                'description' => 'Primary Social Studies and Citizenship',
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
                'code' => 'ART_P',
                'description' => 'Primary Art, Music, and Drama',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Physical Education',
                'code' => 'PE_P',
                'description' => 'Primary Physical Education and Sports',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'French',
                'code' => 'FRENCH',
                'description' => 'French Language (Optional)',
                'category' => 'elective',
                'status' => 'active'
            ],
            [
                'name' => 'Ghanaian Language',
                'code' => 'GHA_LANG',
                'description' => 'Local Ghanaian Languages (Twi, Ga, Ewe, etc.)',
                'category' => 'elective',
                'status' => 'active'
            ],
            
            // Junior High School (JHS1-JHS3) - Core, Elective, and Optional
            [
                'name' => 'English Language',
                'code' => 'ENG_JHS',
                'description' => 'JHS English Language and Literature',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Mathematics',
                'code' => 'MATH_JHS',
                'description' => 'JHS Mathematics and Problem Solving',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Integrated Science',
                'code' => 'SCI_JHS',
                'description' => 'JHS Integrated Science (Physics, Chemistry, Biology)',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Social Studies',
                'code' => 'SOC_JHS',
                'description' => 'JHS Social Studies (History, Geography, Government)',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Religious and Moral Education',
                'code' => 'RME_JHS',
                'description' => 'JHS Religious and Moral Education',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Creative Arts and Design',
                'code' => 'CAD',
                'description' => 'JHS Creative Arts and Design',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'Physical Education',
                'code' => 'PE_JHS',
                'description' => 'JHS Physical Education and Sports',
                'category' => 'core',
                'status' => 'active'
            ],
            [
                'name' => 'French',
                'code' => 'FRENCH_JHS',
                'description' => 'JHS French Language',
                'category' => 'elective',
                'status' => 'active'
            ],
            [
                'name' => 'Ghanaian Language',
                'code' => 'GHA_LANG_JHS',
                'description' => 'JHS Ghanaian Languages',
                'category' => 'elective',
                'status' => 'active'
            ],
            [
                'name' => 'Information and Communication Technology',
                'code' => 'ICT',
                'description' => 'JHS ICT and Computer Studies',
                'category' => 'elective',
                'status' => 'active'
            ],
            [
                'name' => 'Home Economics',
                'code' => 'HOME_ECON',
                'description' => 'JHS Home Economics (Optional)',
                'category' => 'optional',
                'status' => 'active'
            ],
            [
                'name' => 'Agricultural Science',
                'code' => 'AGRIC',
                'description' => 'JHS Agricultural Science (Optional)',
                'category' => 'optional',
                'status' => 'active'
            ],
            [
                'name' => 'Pre-Technical Skills',
                'code' => 'PTS',
                'description' => 'JHS Pre-Technical Skills (Optional)',
                'category' => 'optional',
                'status' => 'active'
            ],
            [
                'name' => 'Business Studies',
                'code' => 'BUS_STUD',
                'description' => 'JHS Business Studies (Optional)',
                'category' => 'optional',
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