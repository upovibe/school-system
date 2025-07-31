<?php
// api/database/seeders/class_seeder.php - Seeder for classes

class ClassSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding classes...\n";
        
        $this->seedClasses();
        
        echo "✅ Classes seeded successfully!\n";
    }
    
    private function seedClasses() {
        echo "📝 Seeding classes for different grade levels...\n";
        
        $classes = [
            [
                'name' => 'JHS 1',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'JHS 1',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'JHS 2',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'JHS 2',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'JHS 3',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'JHS 3',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'Primary 6',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 25,
                'status' => 'active'
            ],
            [
                'name' => 'Primary 5',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 25,
                'status' => 'active'
            ]
        ];
        
        foreach ($classes as $class) {
            $this->seedClass($class);
        }
        
        echo "📊 Total classes seeded: " . count($classes) . "\n";
    }
    
    private function seedClass($classData) {
        // Check if class already exists
        $stmt = $this->pdo->prepare('SELECT id FROM classes WHERE name = ? AND section = ? AND academic_year = ?');
        $stmt->execute([$classData['name'], $classData['section'], $classData['academic_year']]);
        $existingClass = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingClass) {
            echo "⚠️  Class {$classData['name']} Section {$classData['section']} for {$classData['academic_year']} already exists\n";
            return;
        }
        
        // Insert class
        $stmt = $this->pdo->prepare('
            INSERT INTO classes (name, section, academic_year, capacity, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ');
        
        $stmt->execute([
            $classData['name'],
            $classData['section'],
            $classData['academic_year'],
            $classData['capacity'],
            $classData['status']
        ]);
        
        echo "✅ Added class: {$classData['name']} Section {$classData['section']} ({$classData['academic_year']})\n";
    }
}
?> 