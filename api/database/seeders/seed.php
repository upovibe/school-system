<?php
// api/database/seeders/seed.php - Main seed file (Express/Node.js style)

class Seed {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Starting database seeding...\n\n";
        
        $this->seedUsers();
        
        echo "\n✅ Database seeding completed!\n";
    }
    
    private function seedUsers() {
        echo "📝 Seeding users...\n";
        
        $users = [
            [
                'name' => 'John Doe',
                'email' => 'johns@example.com',
                'phone' => '+1234567890',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane@example.com',
                'phone' => '+1234567891',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            [
                'name' => 'Bob Johnson',
                'email' => 'bob@example.com',
                'phone' => '+1234567892',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        
        foreach ($users as $user) {
            $stmt->execute([
                $user['name'],
                $user['email'],
                $user['phone'],
                $user['password'],
                $user['created_at'],
                $user['updated_at']
            ]);
        }
        
        echo "✅ Seeded " . count($users) . " users\n";
    }
}
?> 