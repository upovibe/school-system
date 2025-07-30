<?php
// api/database/seeders/class_seeder.php - Seeder for Ghanaian school classes

class ClassSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding Ghanaian school classes...\n";
        
        $this->seedClasses();
        
        echo "✅ Ghanaian school classes seeded successfully!\n";
    }
    
    private function seedClasses() {
        echo "📝 Seeding classes from KG1 to JHS3...\n";
        
        $classes = [
            // Kindergarten (KG1-KG2)
            [
                'name' => 'KG1',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 25,
                'status' => 'active'
            ],
            [
                'name' => 'KG1',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 25,
                'status' => 'active'
            ],
            [
                'name' => 'KG2',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 25,
                'status' => 'active'
            ],
            [
                'name' => 'KG2',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 25,
                'status' => 'active'
            ],
            
            // Primary School (P1-P6)
            [
                'name' => 'P1',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P1',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P2',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P2',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P3',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P3',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P4',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P4',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P5',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P5',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P6',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            [
                'name' => 'P6',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 30,
                'status' => 'active'
            ],
            
            // Junior High School (JHS1-JHS3)
            [
                'name' => 'JHS1',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 35,
                'status' => 'active'
            ],
            [
                'name' => 'JHS1',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 35,
                'status' => 'active'
            ],
            [
                'name' => 'JHS1',
                'section' => 'C',
                'academic_year' => '2024-2025',
                'capacity' => 35,
                'status' => 'active'
            ],
            [
                'name' => 'JHS2',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 35,
                'status' => 'active'
            ],
            [
                'name' => 'JHS2',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 35,
                'status' => 'active'
            ],
            [
                'name' => 'JHS2',
                'section' => 'C',
                'academic_year' => '2024-2025',
                'capacity' => 35,
                'status' => 'active'
            ],
            [
                'name' => 'JHS3',
                'section' => 'A',
                'academic_year' => '2024-2025',
                'capacity' => 35,
                'status' => 'active'
            ],
            [
                'name' => 'JHS3',
                'section' => 'B',
                'academic_year' => '2024-2025',
                'capacity' => 35,
                'status' => 'active'
            ],
            [
                'name' => 'JHS3',
                'section' => 'C',
                'academic_year' => '2024-2025',
                'capacity' => 35,
                'status' => 'active'
            ]
        ];
        
        foreach ($classes as $class) {
            // Check if class already exists
            $stmt = $this->pdo->prepare('SELECT id FROM classes WHERE name = ? AND section = ? AND academic_year = ?');
            $stmt->execute([$class['name'], $class['section'], $class['academic_year']]);
            $existingClass = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingClass) {
                echo "⚠️  Class {$class['name']} Section {$class['section']} ({$class['academic_year']}) already exists\n";
                continue;
            }
            
            // Insert class
            $stmt = $this->pdo->prepare('
                INSERT INTO classes (name, section, academic_year, capacity, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                $class['name'],
                $class['section'],
                $class['academic_year'],
                $class['capacity'],
                $class['status']
            ]);
            
            echo "✅ Added class: {$class['name']} Section {$class['section']} ({$class['academic_year']})\n";
        }
        
        echo "📊 Total classes seeded: " . count($classes) . "\n";
    }
}
?> 