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
        
        echo "✅ Default houses seeded successfully!\n";
    }
    
    private function seedHouses() {
        echo "📝 Seeding houses for school system...\n";
        
        $houses = [
            [
                'name' => 'Lion House',
                'description' => 'The house of courage, leadership, and strength. Lions represent bravery and determination.'
            ],
            [
                'name' => 'Eagle House',
                'description' => 'The house of vision, freedom, and excellence. Eagles soar high and see far.'
            ],
            [
                'name' => 'Phoenix House',
                'description' => 'The house of resilience, renewal, and transformation. Phoenix rises from ashes stronger.'
            ],
            [
                'name' => 'Tiger House',
                'description' => 'The house of power, focus, and determination. Tigers are fierce and unstoppable.'
            ],
            [
                'name' => 'Dragon House',
                'description' => 'The house of wisdom, mystery, and ancient power. Dragons are legendary and wise.'
            ],
            [
                'name' => 'Wolf House',
                'description' => 'The house of loyalty, teamwork, and family bonds. Wolves work together as a pack.'
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
}
?>
