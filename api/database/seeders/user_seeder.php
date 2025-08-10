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
        $this->seedTeacherUser();
        $this->seedStudentUser();
        $this->seedCashierUser();
        
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
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, password_changed, role_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $adminUser['name'],
            $adminUser['email'],
            $adminUser['phone'],
            $adminUser['password'],
            $adminUser['password_changed'],
            $adminRole['id'],
            $adminUser['status'],
            $adminUser['created_at'],
            $adminUser['updated_at']
        ]);
        
        echo "✅ Seeded admin user\n";
        echo "📧 Email: admin@school.com\n";
        echo "🔑 Password: admin123\n";
    }
    
    private function seedTeacherUser() {
        echo "📝 Seeding teacher user...\n";
        
        // Get teacher role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['teacher']);
        $teacherRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$teacherRole) {
            echo "❌ Teacher role not found. Please run migrations first.\n";
            return;
        }
        
        // Check if teacher user already exists
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute(['teacher@school.com']);
        $existingTeacher = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingTeacher) {
            echo "⚠️  Teacher user already exists\n";
            return;
        }
        
        $teacherUser = [
            'name' => 'Teacher User',
            'email' => 'teacher@school.com',
            'phone' => '+1234567892',
            'password' => password_hash('teacher123', PASSWORD_DEFAULT),
            'password_changed' => true,
            'role_id' => $teacherRole['id'],
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, password_changed, role_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $teacherUser['name'],
            $teacherUser['email'],
            $teacherUser['phone'],
            $teacherUser['password'],
            $teacherUser['password_changed'],
            $teacherRole['id'],
            $teacherUser['status'],
            $teacherUser['created_at'],
            $teacherUser['updated_at']
        ]);
        
        echo "✅ Seeded teacher user\n";
        echo "📧 Email: teacher@school.com\n";
        echo "🔑 Password: teacher123\n";
    }
    
    private function seedStudentUser() {
        echo "📝 Seeding student user...\n";
        
        // Get student role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['student']);
        $studentRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$studentRole) {
            echo "❌ Student role not found. Please run migrations first.\n";
            return;
        }
        
        // Check if student user already exists
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute(['student@school.com']);
        $existingStudent = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingStudent) {
            echo "⚠️  Student user already exists\n";
            return;
        }
        
        $studentUser = [
            'name' => 'Student User',
            'email' => 'student@school.com',
            'phone' => '+1234567893',
            'password' => password_hash('student123', PASSWORD_DEFAULT),
            'password_changed' => true,
            'role_id' => $studentRole['id'],
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, password_changed, role_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $studentUser['name'],
            $studentUser['email'],
            $studentUser['phone'],
            $studentUser['password'],
            $studentUser['password_changed'],
            $studentRole['id'],
            $studentUser['status'],
            $studentUser['created_at'],
            $studentUser['updated_at']
        ]);
        
        echo "✅ Seeded student user\n";
        echo "📧 Email: student@school.com\n";
        echo "🔑 Password: student123\n";
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
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, password_changed, role_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $cashierUser['name'],
            $cashierUser['email'],
            $cashierUser['phone'],
            $cashierUser['password'],
            $cashierUser['password_changed'],
            $cashierRole['id'],
            $cashierUser['status'],
            $cashierUser['created_at'],
            $cashierUser['updated_at']
        ]);
        
        echo "✅ Seeded cashier user\n";
        echo "📧 Email: cashier@school.com\n";
        echo "🔑 Password: cashier123\n";
    }
} 