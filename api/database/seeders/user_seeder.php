<?php
// api/database/seeders/user_seeder.php - Seeder for default users

class UserSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding default users...\n";
        
        $this->seedAdminUser();
        $this->seedSecondAdminUser();
        $this->seedCashierUser();
        $this->seedSecondCashierUser();
        
        echo "✅ Default users seeded successfully!\n";
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
            $adminRole['id'],
            $adminUser['status'],
            $adminUser['gender'],
            $adminUser['created_at'],
            $adminUser['updated_at']
        ]);
        
        echo "✅ Seeded admin user\n";
        echo "📧 Email: admin@school.com\n";
        echo "🔑 Password: admin123\n";
    }
    
    private function seedSecondAdminUser() {
        echo "📝 Seeding second admin user...\n";
        
        // Get admin role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['admin']);
        $adminRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$adminRole) {
            echo "❌ Admin role not found. Please run migrations first.\n";
            return;
        }
        
        // Check if second admin user already exists
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute(['admin2@school.com']);
        $existingAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingAdmin) {
            echo "⚠️  Second admin user already exists\n";
            return;
        }
        
        $adminUser = [
            'name' => 'Deputy Administrator',
            'email' => 'admin2@school.com',
            'phone' => '+1234567894',
            'password' => password_hash('admin123', PASSWORD_DEFAULT),
            'password_changed' => true,
            'role_id' => $adminRole['id'],
            'status' => 'active',
            'gender' => 'female',
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
            $adminRole['id'],
            $adminUser['status'],
            $adminUser['gender'],
            $adminUser['created_at'],
            $adminUser['updated_at']
        ]);
        
        echo "✅ Seeded second admin user\n";
        echo "📧 Email: admin2@school.com\n";
        echo "🔑 Password: admin123\n";
    }
    


    private function seedCashierUser() {
        echo "📝 Seeding cashier user...\n";
        
        // Get cashier role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['cashier']);
        $cashierRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$cashierRole) {
            echo "❌ Cashier role not found. Please run migrations first.\n";
            return;
        }
        
        // Check if cashier user already exists
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute(['cashier@school.com']);
        $existingCashier = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingCashier) {
            echo "⚠️  Cashier user already exists\n";
            return;
        }
        
        $cashierUser = [
            'name' => 'Cashier User',
            'email' => 'cashier@school.com',
            'phone' => '+1234567891',
            'password' => password_hash('cashier123', PASSWORD_DEFAULT),
            'password_changed' => true,
            'role_id' => $cashierRole['id'],
            'status' => 'active',
            'gender' => 'female',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, password_changed, role_id, status, gender, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $cashierUser['name'],
            $cashierUser['email'],
            $cashierUser['phone'],
            $cashierUser['password'],
            $cashierUser['password_changed'],
            $cashierRole['id'],
            $cashierUser['status'],
            $cashierUser['gender'],
            $cashierUser['created_at'],
            $cashierUser['updated_at']
        ]);
        
        echo "✅ Seeded cashier user\n";
        echo "📧 Email: cashier@school.com\n";
        echo "🔑 Password: cashier123\n";
    }
    
    private function seedSecondCashierUser() {
        echo "📝 Seeding second cashier user...\n";
        
        // Get cashier role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['cashier']);
        $cashierRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$cashierRole) {
            echo "❌ Cashier role not found. Please run migrations first.\n";
            return;
        }
        
        // Check if second cashier user already exists
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute(['cashier2@school.com']);
        $existingCashier = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingCashier) {
            echo "⚠️  Second cashier user already exists\n";
            return;
        }
        
        $cashierUser = [
            'name' => 'Assistant Cashier',
            'email' => 'cashier2@school.com',
            'phone' => '+1234567895',
            'password' => password_hash('cashier123', PASSWORD_DEFAULT),
            'password_changed' => true,
            'role_id' => $cashierRole['id'],
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
            $cashierUser['name'],
            $cashierUser['email'],
            $cashierUser['phone'],
            $cashierUser['password'],
            $cashierUser['password_changed'],
            $cashierRole['id'],
            $cashierUser['status'],
            $cashierUser['gender'],
            $cashierUser['created_at'],
            $cashierUser['updated_at']
        ]);
        
        echo "✅ Seeded second cashier user\n";
        echo "📧 Email: cashier2@school.com\n";
        echo "🔑 Password: cashier123\n";
    }
} 