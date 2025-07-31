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
            // JHS 1 Subjects
            'JHS 1' => [
                'ENG_JHS',    // English Language
                'MATH_JHS',   // Mathematics
                'SCI_JHS',    // Integrated Science
                'SOC_JHS',    // Social Studies
                'RME_JHS',    // Religious and Moral Education
                'CAD',        // Creative Arts and Design
                'PE_JHS',     // Physical Education
                'FRENCH_JHS', // French (Elective)
                'GHA_LANG_JHS', // Ghanaian Language (Elective)
                'ICT'         // ICT (Elective)
            ],
            
            // JHS 2 Subjects
            'JHS 2' => [
                'ENG_JHS',    // English Language
                'MATH_JHS',   // Mathematics
                'SCI_JHS',    // Integrated Science
                'SOC_JHS',    // Social Studies
                'RME_JHS',    // Religious and Moral Education
                'CAD',        // Creative Arts and Design
                'PE_JHS',     // Physical Education
                'FRENCH_JHS', // French (Elective)
                'GHA_LANG_JHS', // Ghanaian Language (Elective)
                'ICT'         // ICT (Elective)
            ],
            
            // JHS 3 Subjects
            'JHS 3' => [
                'ENG_JHS',    // English Language
                'MATH_JHS',   // Mathematics
                'SCI_JHS',    // Integrated Science
                'SOC_JHS',    // Social Studies
                'RME_JHS',    // Religious and Moral Education
                'CAD',        // Creative Arts and Design
                'PE_JHS',     // Physical Education
                'FRENCH_JHS', // French (Elective)
                'GHA_LANG_JHS', // Ghanaian Language (Elective)
                'ICT'         // ICT (Elective)
            ],
            
            // Primary 6 Subjects
            'Primary 6' => [
                'ENG_P',      // English Language
                'MATH_P',     // Mathematics
                'SCI_P',      // Integrated Science
                'SOC_P',      // Social Studies
                'RME',        // Religious and Moral Education
                'ART_P',      // Creative Arts
                'PE_P',       // Physical Education
                'FRENCH',     // French (Elective)
                'GHA_LANG'    // Ghanaian Language (Elective)
            ],
            
            // Primary 5 Subjects
            'Primary 5' => [
                'ENG_P',      // English Language
                'MATH_P',     // Mathematics
                'SCI_P',      // Integrated Science
                'SOC_P',      // Social Studies
                'RME',        // Religious and Moral Education
                'ART_P',      // Creative Arts
                'PE_P',       // Physical Education
                'FRENCH',     // French (Elective)
                'GHA_LANG'    // Ghanaian Language (Elective)
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