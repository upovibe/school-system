<?php
// api/database/seeders/house_seeder.php - Seeder for default houses

class HouseSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding default houses...\n";
        
        $this->seedHouses();
        $this->assignTeachersToHouses();
        
        echo "✅ Default houses seeded successfully!\n";
    }
    
    private function seedHouses() {
        echo "📝 Seeding houses for school system...\n";
        
        $houses = [
            [
                'name' => 'House 1',
                'description' => 'The first house representing excellence, leadership, and academic achievement.'
            ],
            [
                'name' => 'House 2',
                'description' => 'The second house representing creativity, innovation, and artistic expression.'
            ],
            [
                'name' => 'House 3',
                'description' => 'The third house representing teamwork, collaboration, and community spirit.'
            ],
            [
                'name' => 'House 4',
                'description' => 'The fourth house representing determination, resilience, and personal growth.'
            ],
            [
                'name' => 'House 5',
                'description' => 'The fifth house representing wisdom, integrity, and moral character.'
            ]
        ];
        
        foreach ($houses as $house) {
            // Check if house already exists
            $stmt = $this->pdo->prepare('SELECT id FROM houses WHERE name = ?');
            $stmt->execute([$house['name']]);
            $existingHouse = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingHouse) {
                echo "⚠️  House '{$house['name']}' already exists\n";
                continue;
            }
            
            // Insert house
            $stmt = $this->pdo->prepare('
                INSERT INTO houses (name, description, created_at, updated_at) 
                VALUES (?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                $house['name'],
                $house['description']
            ]);
            
            echo "✅ Added house: {$house['name']}\n";
        }
        
        echo "📊 Total houses seeded: " . count($houses) . "\n";
        echo "🏠 Houses represent different values and characteristics for student development\n";
    }
    
    private function assignTeachersToHouses() {
        echo "👨‍🏫 Assigning teachers to houses...\n";
        
        // Get all teachers
        $stmt = $this->pdo->prepare('SELECT id, first_name, last_name FROM teachers ORDER BY id');
        $stmt->execute();
        $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($teachers)) {
            echo "⚠️  No teachers found to assign to houses\n";
            return;
        }
        
        // Get all houses
        $stmt = $this->pdo->prepare('SELECT id, name FROM houses ORDER BY id');
        $stmt->execute();
        $houses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($houses)) {
            echo "⚠️  No houses found to assign teachers to\n";
            return;
        }
        
        // Assign teachers to houses (distribute evenly)
        $teachersPerHouse = ceil(count($teachers) / count($houses));
        $teacherIndex = 0;
        
        foreach ($houses as $house) {
            $assignedCount = 0;
            
            // Assign teachers to this house
            for ($i = 0; $i < $teachersPerHouse && $teacherIndex < count($teachers); $i++) {
                $teacher = $teachers[$teacherIndex];
                
                // Check if teacher is already assigned to this house
                $stmt = $this->pdo->prepare('SELECT id FROM house_teachers WHERE house_id = ? AND teacher_id = ?');
                $stmt->execute([$house['id'], $teacher['id']]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$existing) {
                    // Assign teacher to house
                    $stmt = $this->pdo->prepare('INSERT INTO house_teachers (house_id, teacher_id, created_at) VALUES (?, ?, NOW())');
                    $stmt->execute([$house['id'], $teacher['id']]);
                    
                    echo "✅ Assigned {$teacher['first_name']} {$teacher['last_name']} to {$house['name']}\n";
                    $assignedCount++;
                }
                
                $teacherIndex++;
            }
            
            echo "📊 {$house['name']}: {$assignedCount} teacher(s) assigned\n";
        }
        
        echo "👨‍🏫 Teacher assignments completed!\n";
    }
}
?>
