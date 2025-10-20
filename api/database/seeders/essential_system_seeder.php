<?php
// api/database/seeders/essential_system_seeder.php - Seeder for essential system components

class EssentialSystemSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding essential system components...\n";
        
        // Seed in order of dependencies
        $this->seedRoles();
        $this->seedAdminUser();
        $this->seedAcademicYears();
        $this->seedPagesAndSettings();
        
        echo "✅ Essential system components seeded successfully!\n";
    }
    
    private function seedRoles() {
        echo "🔐 Seeding roles...\n";
        
        // Include the role seeder
        require_once __DIR__ . '/role_seeder.php';
        $roleSeeder = new RoleSeeder($this->pdo);
        $roleSeeder->run();
    }
    
    private function seedAdminUser() {
        echo "👤 Seeding admin user...\n";
        
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
    
    private function seedAcademicYears() {
        echo "📅 Seeding academic years...\n";
        
        // Include the academic year seeder
        require_once __DIR__ . '/academic_year_seeder.php';
        $academicYearSeeder = new AcademicYearSeeder($this->pdo);
        $academicYearSeeder->run();
    }
    
    private function seedPagesAndSettings() {
        echo "📄 Seeding pages and settings...\n";
        
        // Include the page seeder
        require_once __DIR__ . '/page_seeder.php';
        $pageSeeder = new PageSeeder($this->pdo);
        $pageSeeder->run();
        
        // Include the settings seeder
        require_once __DIR__ . '/settings_seeder.php';
        $settingsSeeder = new SettingsSeeder($this->pdo);
        $settingsSeeder->run();
    }
}
