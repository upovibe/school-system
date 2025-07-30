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
        $this->seedTeachers();
        $this->seedStudents();
        $this->seedParents();
        $this->seedStaff();
        
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
            $adminUser['role_id'],
            $adminUser['status'],
            $adminUser['created_at'],
            $adminUser['updated_at']
        ]);
        
        echo "✅ Seeded admin user\n";
        echo "📧 Email: admin@school.com\n";
        echo "🔑 Password: admin123\n";
    }
    
    private function seedTeachers() {
        echo "📝 Seeding teachers...\n";
        
        // Get teacher role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['teacher']);
        $teacherRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$teacherRole) {
            echo "❌ Teacher role not found. Please run migrations first.\n";
            return;
        }
        
        $teachers = [
            [
                'name' => 'Dr. Sarah Johnson',
                'email' => 'sarah.johnson@school.com',
                'phone' => '+233244123456',
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'role_id' => $teacherRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Mr. Michael Chen',
                'email' => 'michael.chen@school.com',
                'phone' => '+233244123457',
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'role_id' => $teacherRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Ms. Emily Rodriguez',
                'email' => 'emily.rodriguez@school.com',
                'phone' => '+233244123458',
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'role_id' => $teacherRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Mr. David Osei',
                'email' => 'david.osei@school.com',
                'phone' => '+233244123459',
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'role_id' => $teacherRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Mrs. Grace Mensah',
                'email' => 'grace.mensah@school.com',
                'phone' => '+233244123460',
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'role_id' => $teacherRole['id'],
                'status' => 'active'
            ]
        ];
        
        foreach ($teachers as $teacher) {
            $this->seedUser($teacher, 'teacher');
        }
        
        echo "✅ Seeded " . count($teachers) . " teachers\n";
    }
    
    private function seedStudents() {
        echo "📝 Seeding students...\n";
        
        // Get student role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['student']);
        $studentRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$studentRole) {
            echo "❌ Student role not found. Please run migrations first.\n";
            return;
        }
        
        $students = [
            [
                'name' => 'Kwame Asante',
                'email' => 'kwame.asante@student.school.com',
                'phone' => '+233244123461',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'role_id' => $studentRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Ama Osei',
                'email' => 'ama.osei@student.school.com',
                'phone' => '+233244123462',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'role_id' => $studentRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Kofi Mensah',
                'email' => 'kofi.mensah@student.school.com',
                'phone' => '+233244123463',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'role_id' => $studentRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Abena Addo',
                'email' => 'abena.addo@student.school.com',
                'phone' => '+233244123464',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'role_id' => $studentRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Yaw Darko',
                'email' => 'yaw.darko@student.school.com',
                'phone' => '+233244123465',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'role_id' => $studentRole['id'],
                'status' => 'active'
            ]
        ];
        
        foreach ($students as $student) {
            $this->seedUser($student, 'student');
        }
        
        echo "✅ Seeded " . count($students) . " students\n";
    }
    
    private function seedParents() {
        echo "📝 Seeding parents...\n";
        
        // Get parent role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['parent']);
        $parentRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$parentRole) {
            echo "❌ Parent role not found. Please run migrations first.\n";
            return;
        }
        
        $parents = [
            [
                'name' => 'Mr. Kwesi Asante',
                'email' => 'kwesi.asante@parent.school.com',
                'phone' => '+233244123466',
                'password' => password_hash('parent123', PASSWORD_DEFAULT),
                'role_id' => $parentRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Mrs. Akua Osei',
                'email' => 'akua.osei@parent.school.com',
                'phone' => '+233244123467',
                'password' => password_hash('parent123', PASSWORD_DEFAULT),
                'role_id' => $parentRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Mr. Kofi Mensah',
                'email' => 'kofi.mensah@parent.school.com',
                'phone' => '+233244123468',
                'password' => password_hash('parent123', PASSWORD_DEFAULT),
                'role_id' => $parentRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Mrs. Grace Addo',
                'email' => 'grace.addo@parent.school.com',
                'phone' => '+233244123469',
                'password' => password_hash('parent123', PASSWORD_DEFAULT),
                'role_id' => $parentRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Mr. Yaw Darko',
                'email' => 'yaw.darko@parent.school.com',
                'phone' => '+233244123470',
                'password' => password_hash('parent123', PASSWORD_DEFAULT),
                'role_id' => $parentRole['id'],
                'status' => 'active'
            ]
        ];
        
        foreach ($parents as $parent) {
            $this->seedUser($parent, 'parent');
        }
        
        echo "✅ Seeded " . count($parents) . " parents\n";
    }
    
    private function seedStaff() {
        echo "📝 Seeding staff...\n";
        
        // Get staff role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['staff']);
        $staffRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$staffRole) {
            echo "❌ Staff role not found. Please run migrations first.\n";
            return;
        }
        
        $staff = [
            [
                'name' => 'Mr. John Addo',
                'email' => 'john.addo@staff.school.com',
                'phone' => '+233244123471',
                'password' => password_hash('staff123', PASSWORD_DEFAULT),
                'role_id' => $staffRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Ms. Mary Osei',
                'email' => 'mary.osei@staff.school.com',
                'phone' => '+233244123472',
                'password' => password_hash('staff123', PASSWORD_DEFAULT),
                'role_id' => $staffRole['id'],
                'status' => 'active'
            ],
            [
                'name' => 'Mr. Daniel Mensah',
                'email' => 'daniel.mensah@staff.school.com',
                'phone' => '+233244123473',
                'password' => password_hash('staff123', PASSWORD_DEFAULT),
                'role_id' => $staffRole['id'],
                'status' => 'active'
            ]
        ];
        
        foreach ($staff as $staffMember) {
            $this->seedUser($staffMember, 'staff');
        }
        
        echo "✅ Seeded " . count($staff) . " staff members\n";
    }
    
    private function seedUser($userData, $roleName) {
        // Check if user already exists
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$userData['email']]);
        $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingUser) {
            echo "⚠️  {$roleName} user {$userData['email']} already exists\n";
            return;
        }
        
        $userData['password_changed'] = true;
        $userData['created_at'] = date('Y-m-d H:i:s');
        $userData['updated_at'] = date('Y-m-d H:i:s');
        
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, password_changed, role_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $userData['name'],
            $userData['email'],
            $userData['phone'],
            $userData['password'],
            $userData['password_changed'],
            $userData['role_id'],
            $userData['status'],
            $userData['created_at'],
            $userData['updated_at']
        ]);
        
        echo "✅ Seeded {$roleName}: {$userData['email']}\n";
    }
} 