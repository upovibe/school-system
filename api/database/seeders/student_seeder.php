<?php
// api/database/seeders/student_seeder.php - Seeder for students

class StudentSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding students...\n";
        
        $this->seedStudents();
        
        echo "✅ Students seeded successfully!\n";
    }
    
    private function seedStudents() {
        echo "📝 Seeding 1 student...\n";
        
        $students = [
            [
                'user_id' => null, // Will be linked to user later
                'student_id' => 'S001',
                'first_name' => 'Student',
                'last_name' => 'User',
                'email' => 'student@school.com',
                'phone' => '+233244123461',
                'address' => '123 Accra Street, Accra, Ghana',
                'date_of_birth' => '2008-05-15',
                'gender' => 'male',
                'admission_date' => '2020-09-01',
                'current_class_id' => null, // Will be assigned after classes are created
                'student_type' => 'Day',
                'parent_name' => 'Mr. Parent User',
                'parent_phone' => '+233244123466',
                'parent_email' => 'parent@school.com',
                'emergency_contact' => 'Mrs. Emergency User',
                'emergency_phone' => '+233244123467',
                'blood_group' => 'O+',
                'medical_conditions' => 'None',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'status' => 'active'
            ]
        ];
        
        foreach ($students as $student) {
            $this->seedStudent($student);
        }
        
        echo "📊 Total students seeded: " . count($students) . "\n";
    }
    
    private function seedStudent($studentData) {
        // Check if student already exists
        $stmt = $this->pdo->prepare('SELECT id FROM students WHERE student_id = ? OR email = ?');
        $stmt->execute([$studentData['student_id'], $studentData['email']]);
        $existingStudent = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingStudent) {
            echo "⚠️  Student with student ID '{$studentData['student_id']}' or email '{$studentData['email']}' already exists\n";
            return;
        }
        
        // Link to existing user if available
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$studentData['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $studentData['user_id'] = $user['id'];
            echo "🔗 Linking student to existing user: {$studentData['email']}\n";
        }
        
        // Insert student
        $stmt = $this->pdo->prepare('
            INSERT INTO students (
                user_id, student_id, first_name, last_name, email, phone, address, 
                date_of_birth, gender, admission_date, current_class_id, student_type, parent_name, 
                parent_phone, parent_email, emergency_contact, emergency_phone, 
                blood_group, medical_conditions, password, status, created_at, updated_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        
        $stmt->execute([
            $studentData['user_id'],
            $studentData['student_id'],
            $studentData['first_name'],
            $studentData['last_name'],
            $studentData['email'],
            $studentData['phone'],
            $studentData['address'],
            $studentData['date_of_birth'],
            $studentData['gender'],
            $studentData['admission_date'],
            $studentData['current_class_id'],
            ($studentData['student_type'] ?? 'Day'),
            $studentData['parent_name'],
            $studentData['parent_phone'],
            $studentData['parent_email'],
            $studentData['emergency_contact'],
            $studentData['emergency_phone'],
            $studentData['blood_group'],
            $studentData['medical_conditions'],
            $studentData['password'],
            $studentData['status']
        ]);
        
        echo "✅ Added student: {$studentData['first_name']} {$studentData['last_name']} ({$studentData['student_id']})\n";
    }
}
?> 