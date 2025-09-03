<?php
// api/database/seeders/class_subject_seeder.php - Seeder for class subjects

class ClassSubjectSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding class subjects...\n";
        
        $this->seedClassSubjects();
        
        echo "✅ Class subjects seeded successfully!\n";
    }
    
    private function seedClassSubjects() {
        echo "📝 Seeding subjects for classes...\n";
        
        // Get all classes
        $stmt = $this->pdo->prepare('SELECT id, name FROM classes WHERE status = "active"');
        $stmt->execute();
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all subjects
        $stmt = $this->pdo->prepare('SELECT id, code, name FROM subjects WHERE status = "active"');
        $stmt->execute();
        $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $classSubjectAssignments = [
            // Kindergarten (KG1-KG2) - KG-specific subjects
            'KG 1' => [
                'LANG_LIT',      // Language & Literacy
                'NUMERACY',      // Numeracy
                'ENV_STUDIES',   // Environmental Studies (Our World Our People)
                'CREATIVE_ARTS', // Creative Arts & Design
                'PHYS_DEV',      // Physical Development, Health & Safety
                'RME',           // Religious & Moral Education
                'ICT'            // ICT
            ],
            
            'KG 2' => [
                'LANG_LIT',      // Language & Literacy
                'NUMERACY',      // Numeracy
                'ENV_STUDIES',   // Environmental Studies (Our World Our People)
                'CREATIVE_ARTS', // Creative Arts & Design
                'PHYS_DEV',      // Physical Development, Health & Safety
                'RME',           // Religious & Moral Education
                'ICT'            // ICT
            ],
            
            // Primary School (P1-P6) - Primary subjects
            'P 1' => [
                'ENG',           // English Language
                'GHA_LANG',      // Ghanaian Language
                'MATH',          // Mathematics
                'OWOP',          // Our World Our People
                'RME',           // Religious & Moral Education
                'CREATIVE_ARTS', // Creative Arts & Design
                'PE',            // Physical Education
                'COMPUTING'      // Computing (ICT)
            ],
            
            'P 2' => [
                'ENG',           // English Language
                'GHA_LANG',      // Ghanaian Language
                'MATH',          // Mathematics
                'OWOP',          // Our World Our People
                'RME',           // Religious & Moral Education
                'CREATIVE_ARTS', // Creative Arts & Design
                'PE',            // Physical Education
                'COMPUTING'      // Computing (ICT)
            ],
            
            'P 3' => [
                'ENG',           // English Language
                'GHA_LANG',      // Ghanaian Language
                'MATH',          // Mathematics
                'OWOP',          // Our World Our People
                'RME',           // Religious & Moral Education
                'CREATIVE_ARTS', // Creative Arts & Design
                'PE',            // Physical Education
                'COMPUTING'      // Computing (ICT)
            ],
            
            'P 4' => [
                'ENG',           // English Language
                'GHA_LANG',      // Ghanaian Language
                'MATH',          // Mathematics
                'SCIENCE',       // Science (introduced formally from Basic 4)
                'OWOP',          // Our World Our People
                'RME',           // Religious & Moral Education
                'CREATIVE_ARTS', // Creative Arts & Design
                'PE',            // Physical Education
                'COMPUTING'      // Computing (ICT)
            ],
            
            'P 5' => [
                'ENG',           // English Language
                'GHA_LANG',      // Ghanaian Language
                'MATH',          // Mathematics
                'SCIENCE',       // Science
                'OWOP',          // Our World Our People
                'RME',           // Religious & Moral Education
                'CREATIVE_ARTS', // Creative Arts & Design
                'PE',            // Physical Education
                'COMPUTING'      // Computing (ICT)
            ],
            
            'P 6' => [
                'ENG',           // English Language
                'GHA_LANG',      // Ghanaian Language
                'MATH',          // Mathematics
                'SCIENCE',       // Science
                'OWOP',          // Our World Our People
                'RME',           // Religious & Moral Education
                'CREATIVE_ARTS', // Creative Arts & Design
                'PE',            // Physical Education
                'COMPUTING'      // Computing (ICT)
            ],
            
            // Junior High School (JHS1-JHS3) - JHS subjects
            'JHS 1' => [
                'ENG',            // English Language
                'GHA_LANG',       // Ghanaian Language
                'MATH',           // Mathematics
                'INTEGRATED_SCI', // Integrated Science
                'SOC_STUDIES',    // Social Studies
                'RME',            // Religious & Moral Education
                'CAREER_TECH',    // Career Technology
                'CREATIVE_ARTS',  // Creative Arts & Design
                'COMPUTING',      // Computing (ICT)
                'PE',             // Physical Education
                'FRENCH'          // French (optional)
            ],
            
            'JHS 2' => [
                'ENG',            // English Language
                'GHA_LANG',       // Ghanaian Language
                'MATH',           // Mathematics
                'INTEGRATED_SCI', // Integrated Science
                'SOC_STUDIES',    // Social Studies
                'RME',            // Religious & Moral Education
                'CAREER_TECH',    // Career Technology
                'CREATIVE_ARTS',  // Creative Arts & Design
                'COMPUTING',      // Computing (ICT)
                'PE',             // Physical Education
                'FRENCH'          // French (optional)
            ],
            
            'JHS 3' => [
                'ENG',            // English Language
                'GHA_LANG',       // Ghanaian Language
                'MATH',           // Mathematics
                'INTEGRATED_SCI', // Integrated Science
                'SOC_STUDIES',    // Social Studies
                'RME',            // Religious & Moral Education
                'CAREER_TECH',    // Career Technology
                'CREATIVE_ARTS',  // Creative Arts & Design
                'COMPUTING',      // Computing (ICT)
                'PE',             // Physical Education
                'FRENCH'          // French (optional)
            ]
        ];
        
        $totalAssignments = 0;
        
        foreach ($classes as $class) {
            $className = $class['name'];
            $classId = $class['id'];
            
            if (isset($classSubjectAssignments[$className])) {
                $subjectCodes = $classSubjectAssignments[$className];
                
                foreach ($subjectCodes as $subjectCode) {
                    // Find subject by code
                    $subjectId = null;
                    foreach ($subjects as $subject) {
                        if ($subject['code'] === $subjectCode) {
                            $subjectId = $subject['id'];
                            break;
                        }
                    }
                    
                    if ($subjectId) {
                        $this->assignSubjectToClass($classId, $subjectId, $className, $subjectCode);
                        $totalAssignments++;
                    } else {
                        echo "⚠️  Subject with code '{$subjectCode}' not found for class '{$className}'\n";
                    }
                }
            } else {
                echo "⚠️  No subject assignments defined for class '{$className}'\n";
            }
        }
        
        echo "📊 Total class-subject assignments: {$totalAssignments}\n";
    }
    
    private function assignSubjectToClass($classId, $subjectId, $className, $subjectCode) {
        // Check if assignment already exists
        $stmt = $this->pdo->prepare('SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ?');
        $stmt->execute([$classId, $subjectId]);
        $existingAssignment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingAssignment) {
            echo "⚠️  Subject '{$subjectCode}' already assigned to class '{$className}'\n";
            return;
        }
        
        // Insert class-subject assignment
        $stmt = $this->pdo->prepare('
            INSERT INTO class_subjects (class_id, subject_id, created_at, updated_at) 
            VALUES (?, ?, NOW(), NOW())
        ');
        
        $stmt->execute([$classId, $subjectId]);
        
        echo "✅ Assigned subject '{$subjectCode}' to class '{$className}'\n";
    }
}
?> 