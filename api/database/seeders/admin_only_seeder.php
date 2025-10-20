<?php
// api/database/seeders/admin_only_seeder.php - Seeder for admin user only

class AdminOnlySeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding admin user only...\n";
        
        // First ensure admin role exists
        $this->ensureAdminRole();
        
        // Then seed the admin user
        $this->seedAdminUser();
        
        echo "✅ Admin user seeded successfully!\n";
    }
    
    private function ensureAdminRole() {
        echo "🔍 Checking admin role...\n";
        
        // Check if admin role exists
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['admin']);
        $adminRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$adminRole) {
            echo "📝 Creating admin role...\n";
            
            $stmt = $this->pdo->prepare('INSERT INTO roles (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())');
            $stmt->execute(['admin', 'System administrator with full access']);
            
            echo "✅ Admin role created\n";
        } else {
            echo "✅ Admin role already exists\n";
        }
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
            echo "📧 Email: admin@school.com\n";
            echo "🔑 Password: admin123\n";
            return;
        }
        
        $adminUser = [
            'name' => 'System Administrator',
            'email' => 'admin@school.com',
            'phone' => '+1234567890',
            'password' => password_hash('admin123', PASSWORD_DEFAULT),
            'password_changed' => true,
            'role_id' => $adminRole['id'],
            'status' => 'active',
            'gender' => 'male',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, password_changed, role_id, status, gender, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $adminUser['name'],
            $adminUser['email'],
            $adminUser['phone'],
            $adminUser['password'],
            $adminUser['password_changed'],
            $adminUser['role_id'],
            $adminUser['status'],
            $adminUser['gender'],
            $adminUser['created_at'],
            $adminUser['updated_at']
        ]);
        
        echo "✅ Seeded admin user\n";
        echo "📧 Email: admin@school.com\n";
        echo "🔑 Password: admin123\n";
        echo "👤 Name: System Administrator\n";
        echo "📱 Phone: +1234567890\n";
        echo "🎭 Role: Admin\n";
        echo "📊 Status: Active\n";
    }
}
