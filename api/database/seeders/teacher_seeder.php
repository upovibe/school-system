<?php
// api/database/seeders/teacher_seeder.php - Seeder for teachers

class TeacherSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding teachers...\n";
        
        $this->seedTeachers();
        
        echo "✅ Teachers seeded successfully!\n";
    }
    
    private function seedTeachers() {
        echo "📝 Seeding 5 teachers...\n";
        
        $teachers = [
            [
                'user_id' => null, // Will be linked to user later
                'employee_id' => 'T001',
                'first_name' => 'Sarah',
                'last_name' => 'Johnson',
                'email' => 'sarah.johnson@school.com',
                'phone' => '+233244123456',
                'address' => '123 Accra Street, Accra, Ghana',
                'date_of_birth' => '1985-03-15',
                'gender' => 'female',
                'qualification' => 'PhD in Mathematics',
                'specialization' => 'Advanced Mathematics, Calculus, Statistics',
                'hire_date' => '2020-09-01',
                'salary' => 8500.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            [
                'user_id' => null,
                'employee_id' => 'T002',
                'first_name' => 'Michael',
                'last_name' => 'Chen',
                'email' => 'michael.chen@school.com',
                'phone' => '+233244123457',
                'address' => '456 Kumasi Road, Kumasi, Ghana',
                'date_of_birth' => '1988-07-22',
                'gender' => 'male',
                'qualification' => 'MSc in Physics',
                'specialization' => 'Physics, Integrated Science, Laboratory Management',
                'hire_date' => '2021-01-15',
                'salary' => 7800.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            [
                'user_id' => null,
                'employee_id' => 'T003',
                'first_name' => 'Emily',
                'last_name' => 'Rodriguez',
                'email' => 'emily.rodriguez@school.com',
                'phone' => '+233244123458',
                'address' => '789 Cape Coast Avenue, Cape Coast, Ghana',
                'date_of_birth' => '1990-11-08',
                'gender' => 'female',
                'qualification' => 'MA in English Literature',
                'specialization' => 'English Language, Literature, Creative Writing',
                'hire_date' => '2019-08-20',
                'salary' => 7200.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            [
                'user_id' => null,
                'employee_id' => 'T004',
                'first_name' => 'David',
                'last_name' => 'Osei',
                'email' => 'david.osei@school.com',
                'phone' => '+233244123459',
                'address' => '321 Tamale Street, Tamale, Ghana',
                'date_of_birth' => '1987-05-12',
                'gender' => 'male',
                'qualification' => 'BSc in Computer Science',
                'specialization' => 'ICT, Computer Studies, Programming',
                'hire_date' => '2022-03-10',
                'salary' => 7500.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            [
                'user_id' => null,
                'employee_id' => 'T005',
                'first_name' => 'Grace',
                'last_name' => 'Mensah',
                'email' => 'grace.mensah@school.com',
                'phone' => '+233244123460',
                'address' => '654 Sekondi Road, Sekondi, Ghana',
                'date_of_birth' => '1992-09-30',
                'gender' => 'female',
                'qualification' => 'MSc in Social Studies',
                'specialization' => 'Social Studies, History, Geography',
                'hire_date' => '2021-06-01',
                'salary' => 7000.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active'
            ]
        ];
        
        foreach ($teachers as $teacher) {
            $this->seedTeacher($teacher);
        }
        
        echo "📊 Total teachers seeded: " . count($teachers) . "\n";
    }
    
    private function seedTeacher($teacherData) {
        // Check if teacher already exists
        $stmt = $this->pdo->prepare('SELECT id FROM teachers WHERE employee_id = ? OR email = ?');
        $stmt->execute([$teacherData['employee_id'], $teacherData['email']]);
        $existingTeacher = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingTeacher) {
            echo "⚠️  Teacher with employee ID '{$teacherData['employee_id']}' or email '{$teacherData['email']}' already exists\n";
            return;
        }
        
        // Link to existing user if available
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$teacherData['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $teacherData['user_id'] = $user['id'];
            echo "🔗 Linking teacher to existing user: {$teacherData['email']}\n";
        }
        
        // Insert teacher
        $stmt = $this->pdo->prepare('
            INSERT INTO teachers (
                user_id, employee_id, first_name, last_name, email, phone, address, 
                date_of_birth, gender, qualification, specialization, hire_date, 
                salary, password, status, created_at, updated_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        
        $stmt->execute([
            $teacherData['user_id'],
            $teacherData['employee_id'],
            $teacherData['first_name'],
            $teacherData['last_name'],
            $teacherData['email'],
            $teacherData['phone'],
            $teacherData['address'],
            $teacherData['date_of_birth'],
            $teacherData['gender'],
            $teacherData['qualification'],
            $teacherData['specialization'],
            $teacherData['hire_date'],
            $teacherData['salary'],
            $teacherData['password'],
            $teacherData['status']
        ]);
        
        echo "✅ Added teacher: {$teacherData['first_name']} {$teacherData['last_name']} ({$teacherData['employee_id']})\n";
    }
}
?> 