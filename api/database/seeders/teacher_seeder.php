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
        echo "📝 Seeding 1 teacher...\n";
        
        $teachers = [
            [
                'user_id' => null, // Will be linked to user later
                'employee_id' => 'T001',
                'first_name' => 'Teacher',
                'last_name' => 'User',
                'email' => 'teacher@school.com',
                'phone' => '+1234567892',
                'address' => '123 Teacher Street, Accra, Ghana',
                'date_of_birth' => '1985-03-15',
                'gender' => 'female',
                'qualification' => 'MSc in Education',
                'specialization' => 'General Education, Teaching Methods',
                'hire_date' => '2020-09-01',
                'salary' => 7500.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => null // No class assignment initially
            ],
            [
                'user_id' => null, // Will be linked to user later
                'employee_id' => 'T002',
                'first_name' => 'John',
                'last_name' => 'Mensah',
                'email' => 'john.mensah@school.com',
                'phone' => '+1234567893',
                'address' => '456 Teacher Avenue, Accra, Ghana',
                'date_of_birth' => '1988-07-22',
                'gender' => 'male',
                'qualification' => 'BSc in Mathematics',
                'specialization' => 'Mathematics, Science',
                'hire_date' => '2021-01-15',
                'salary' => 7000.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 9 // JHS 1 class teacher
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
                salary, password, status, created_at, updated_at, class_id
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
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
            $teacherData['status'],
            $teacherData['class_id']
        ]);
        
        echo "✅ Added teacher: {$teacherData['first_name']} {$teacherData['last_name']} ({$teacherData['employee_id']})\n";
    }
}
?> 