<?php
// api/database/seeders/academic_structure_seed.php - Academic structure seeder

class AcademicStructureSeed {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Starting academic structure seeding...\n\n";
        
        $this->seedDepartments();
        $this->seedSubjects();
        $this->seedClasses();
        $this->seedClassSubjects();
        
        echo "\n✅ Academic structure seeding completed!\n";
    }
    
    private function seedDepartments() {
        echo "📝 Seeding departments...\n";
        
        $departments = [
            [
                'name' => 'Mathematics',
                'description' => 'Mathematics and related subjects'
            ],
            [
                'name' => 'Science',
                'description' => 'Science subjects including Physics, Chemistry, Biology'
            ],
            [
                'name' => 'Languages',
                'description' => 'English, French, and other languages'
            ],
            [
                'name' => 'Social Studies',
                'description' => 'History, Geography, Government, Economics'
            ],
            [
                'name' => 'Arts',
                'description' => 'Visual Arts, Music, Drama'
            ],
            [
                'name' => 'Physical Education',
                'description' => 'Physical Education and Sports'
            ],
            [
                'name' => 'Technology',
                'description' => 'Computer Science, ICT, Technical Skills'
            ],
            [
                'name' => 'Religious Studies',
                'description' => 'Religious and Moral Education'
            ]
        ];
        
        $insertStmt = $this->pdo->prepare('
            INSERT INTO departments (name, description, created_at, updated_at) 
            VALUES (?, ?, ?, ?)
        ');
        
        $checkStmt = $this->pdo->prepare('SELECT id FROM departments WHERE name = ?');
        $inserted = 0;
        
        foreach ($departments as $dept) {
            // Check if department already exists
            $checkStmt->execute([$dept['name']]);
            if ($checkStmt->fetch()) {
                echo "  ⏭️  Department '{$dept['name']}' already exists, skipping...\n";
                continue;
            }
            
            $insertStmt->execute([
                $dept['name'],
                $dept['description'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            $inserted++;
        }
        
        echo "✅ Seeded " . $inserted . " new departments\n";
    }
    
    private function seedSubjects() {
        echo "📝 Seeding subjects...\n";
        
        // Get department IDs
        $deptStmt = $this->pdo->prepare('SELECT id, name FROM departments');
        $deptStmt->execute();
        $departments = $deptStmt->fetchAll(PDO::FETCH_ASSOC);
        $deptMap = [];
        foreach ($departments as $dept) {
            $deptMap[$dept['name']] = $dept['id'];
        }
        
        // Get level IDs
        $levelStmt = $this->pdo->prepare('SELECT id, name FROM levels ORDER BY order_index');
        $levelStmt->execute();
        $levels = $levelStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $subjects = [
            // Mathematics Department
            ['name' => 'Mathematics', 'department' => 'Mathematics', 'is_core' => 1],
            ['name' => 'Additional Mathematics', 'department' => 'Mathematics', 'is_core' => 0],
            
            // Science Department
            ['name' => 'Integrated Science', 'department' => 'Science', 'is_core' => 1],
            ['name' => 'Physics', 'department' => 'Science', 'is_core' => 0],
            ['name' => 'Chemistry', 'department' => 'Science', 'is_core' => 0],
            ['name' => 'Biology', 'department' => 'Science', 'is_core' => 0],
            
            // Languages Department
            ['name' => 'English Language', 'department' => 'Languages', 'is_core' => 1],
            ['name' => 'French', 'department' => 'Languages', 'is_core' => 0],
            ['name' => 'Arabic', 'department' => 'Languages', 'is_core' => 0],
            
            // Social Studies Department
            ['name' => 'Social Studies', 'department' => 'Social Studies', 'is_core' => 1],
            ['name' => 'History', 'department' => 'Social Studies', 'is_core' => 0],
            ['name' => 'Geography', 'department' => 'Social Studies', 'is_core' => 0],
            ['name' => 'Government', 'department' => 'Social Studies', 'is_core' => 0],
            ['name' => 'Economics', 'department' => 'Social Studies', 'is_core' => 0],
            
            // Arts Department
            ['name' => 'Visual Arts', 'department' => 'Arts', 'is_core' => 0],
            ['name' => 'Music', 'department' => 'Arts', 'is_core' => 0],
            ['name' => 'Drama', 'department' => 'Arts', 'is_core' => 0],
            
            // Physical Education Department
            ['name' => 'Physical Education', 'department' => 'Physical Education', 'is_core' => 1],
            
            // Technology Department
            ['name' => 'Information Communication Technology', 'department' => 'Technology', 'is_core' => 1],
            ['name' => 'Computer Science', 'department' => 'Technology', 'is_core' => 0],
            
            // Religious Studies Department
            ['name' => 'Religious and Moral Education', 'department' => 'Religious Studies', 'is_core' => 1]
        ];
        
        $insertStmt = $this->pdo->prepare('
            INSERT INTO subjects (name, level_id, department_id, is_core, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        
        $checkStmt = $this->pdo->prepare('SELECT id FROM subjects WHERE name = ? AND level_id = ?');
        $inserted = 0;
        
        foreach ($levels as $level) {
            foreach ($subjects as $subject) {
                // Skip certain subjects for specific levels
                if ($this->shouldSkipSubject($subject['name'], $level['name'])) {
                    continue;
                }
                
                // Check if subject already exists for this level
                $checkStmt->execute([$subject['name'], $level['id']]);
                if ($checkStmt->fetch()) {
                    echo "  ⏭️  Subject '{$subject['name']}' for level '{$level['name']}' already exists, skipping...\n";
                    continue;
                }
                
                $insertStmt->execute([
                    $subject['name'],
                    $level['id'],
                    $deptMap[$subject['department']],
                    $subject['is_core'] ? 1 : 0,
                    date('Y-m-d H:i:s'),
                    date('Y-m-d H:i:s')
                ]);
                $inserted++;
            }
        }
        
        echo "✅ Seeded " . $inserted . " new subjects\n";
    }
    
    private function shouldSkipSubject($subjectName, $levelName) {
        // Skip certain subjects for specific levels
        $skipRules = [
            'Additional Mathematics' => ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
            'Physics' => ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
            'Chemistry' => ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
            'Biology' => ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
            'French' => ['KG1', 'KG2'],
            'Arabic' => ['KG1', 'KG2'],
            'History' => ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3'],
            'Geography' => ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3'],
            'Government' => ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
            'Economics' => ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
            'Visual Arts' => ['KG1', 'KG2'],
            'Music' => ['KG1', 'KG2'],
            'Drama' => ['KG1', 'KG2'],
            'Computer Science' => ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']
        ];
        
        return isset($skipRules[$subjectName]) && in_array($levelName, $skipRules[$subjectName]);
    }
    
    private function seedClasses() {
        echo "📝 Seeding classes...\n";
        
        // Get level IDs
        $levelStmt = $this->pdo->prepare('SELECT id, name FROM levels ORDER BY order_index');
        $levelStmt->execute();
        $levels = $levelStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get school ID (assuming first school)
        $schoolStmt = $this->pdo->prepare('SELECT id FROM schools LIMIT 1');
        $schoolStmt->execute();
        $school = $schoolStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$school) {
            echo "⚠️  No school found. Skipping classes.\n";
            return;
        }
        
        $sections = ['A', 'B', 'C', 'D'];
        $insertStmt = $this->pdo->prepare('
            INSERT INTO classes (level_id, section, school_id, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?)
        ');
        
        $checkStmt = $this->pdo->prepare('SELECT id FROM classes WHERE level_id = ? AND section = ? AND school_id = ?');
        $inserted = 0;
        
        foreach ($levels as $level) {
            // Create 2-4 sections per level depending on the level
            $numSections = $this->getNumSections($level['name']);
            
            for ($i = 0; $i < $numSections; $i++) {
                $section = $sections[$i];
                
                // Check if class already exists
                $checkStmt->execute([$level['id'], $section, $school['id']]);
                if ($checkStmt->fetch()) {
                    echo "  ⏭️  Class '{$level['name']} {$section}' already exists, skipping...\n";
                    continue;
                }
                
                $insertStmt->execute([
                    $level['id'],
                    $section,
                    $school['id'],
                    date('Y-m-d H:i:s'),
                    date('Y-m-d H:i:s')
                ]);
                $inserted++;
            }
        }
        
        echo "✅ Seeded " . $inserted . " new classes\n";
    }
    
    private function getNumSections($levelName) {
        // Define number of sections per level
        $sectionMap = [
            'KG1' => 2, 'KG2' => 2,
            'Primary 1' => 3, 'Primary 2' => 3, 'Primary 3' => 3,
            'Primary 4' => 3, 'Primary 5' => 3, 'Primary 6' => 3,
            'JHS 1' => 4, 'JHS 2' => 4, 'JHS 3' => 4,
            'SHS 1' => 4, 'SHS 2' => 4, 'SHS 3' => 4
        ];
        
        return $sectionMap[$levelName] ?? 2;
    }
    
    private function seedClassSubjects() {
        echo "📝 Seeding class-subject assignments...\n";
        
        // Get classes
        $classStmt = $this->pdo->prepare('
            SELECT c.id, c.level_id, l.name as level_name, c.section 
            FROM classes c 
            JOIN levels l ON c.level_id = l.id 
            ORDER BY l.order_index, c.section
        ');
        $classStmt->execute();
        $classes = $classStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get subjects by level
        $subjectStmt = $this->pdo->prepare('
            SELECT s.id, s.name, s.level_id, s.is_core 
            FROM subjects s 
            ORDER BY s.level_id, s.name
        ');
        $subjectStmt->execute();
        $subjects = $subjectStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group subjects by level
        $subjectsByLevel = [];
        foreach ($subjects as $subject) {
            $subjectsByLevel[$subject['level_id']][] = $subject;
        }
        
        $insertStmt = $this->pdo->prepare('
            INSERT INTO class_subjects (class_id, subject_id, created_at, updated_at) 
            VALUES (?, ?, ?, ?)
        ');
        
        $checkStmt = $this->pdo->prepare('SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ?');
        $inserted = 0;
        
        foreach ($classes as $class) {
            $levelSubjects = $subjectsByLevel[$class['level_id']] ?? [];
            
            foreach ($levelSubjects as $subject) {
                // Check if assignment already exists
                $checkStmt->execute([$class['id'], $subject['id']]);
                if ($checkStmt->fetch()) {
                    echo "  ⏭️  Assignment for class '{$class['level_name']} {$class['section']}' and subject '{$subject['name']}' already exists, skipping...\n";
                    continue;
                }
                
                $insertStmt->execute([
                    $class['id'],
                    $subject['id'],
                    date('Y-m-d H:i:s'),
                    date('Y-m-d H:i:s')
                ]);
                $inserted++;
            }
        }
        
        echo "✅ Seeded " . $inserted . " new class-subject assignments\n";
    }
}
?> 