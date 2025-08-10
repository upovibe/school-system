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
            // Kindergarten (KG1-KG2) - Basic subjects
            'KG 1' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE'          // Physical Education
            ],
            
            'KG 2' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE'          // Physical Education
            ],
            
            // Primary School (P1-P6) - Core subjects
            'P 1' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE'          // Physical Education
            ],
            
            'P 2' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE'          // Physical Education
            ],
            
            'P 3' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE'          // Physical Education
            ],
            
            'P 4' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE'          // Physical Education
            ],
            
            'P 5' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE'          // Physical Education
            ],
            
            'P 6' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE'          // Physical Education
            ],
            
            // Junior High School (JHS1-JHS3) - Core + ICT
            'JHS 1' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE',         // Physical Education
                'ICT'         // Information and Communication Technology
            ],
            
            'JHS 2' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE',         // Physical Education
                'ICT'         // Information and Communication Technology
            ],
            
            'JHS 3' => [
                'ENG',        // English Language
                'MATH',       // Mathematics
                'SCI',        // Integrated Science
                'SOC',        // Social Studies
                'RME',        // Religious and Moral Education
                'ART',        // Creative Arts
                'PE',         // Physical Education
                'ICT'         // Information and Communication Technology
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