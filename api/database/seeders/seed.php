<?php
// api/database/seeders/seed.php - Main seed file (Express/Node.js style)

class Seed {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Starting database seeding...\n\n";
        
        $this->seedAdminUser();
        echo "\n✅ Database seeding completed!\n";
    }
    
    private function seedAdminUser() {
        echo "📝 Seeding admin user...\n";
        
        // Get admin role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['admin']);
        $adminRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$adminRole) {
            echo "❌ Admin role not found. Please run migrations first.\n";
            return;
        }
        
        // Check if admin user already exists
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute(['admin@school.com']);
        $existingAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingAdmin) {
            echo "⚠️  Admin user already exists\n";
            return;
        }
        
        $adminUser = [
            'name' => 'System Administrator',
            'email' => 'admin@school.com',
            'phone' => '+1234567890',
            'password' => password_hash('admin123', PASSWORD_DEFAULT),
            'role_id' => $adminRole['id'],
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, role_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $adminUser['name'],
            $adminUser['email'],
            $adminUser['phone'],
            $adminUser['password'],
            $adminUser['role_id'],
            $adminUser['status'],
            $adminUser['created_at'],
            $adminUser['updated_at']
        ]);
        
        echo "✅ Seeded admin user\n";
        echo "📧 Email: admin@school.com\n";
        echo "🔑 Password: admin123\n";
    }
    
}
?> 