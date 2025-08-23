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
        echo "📝 Seeding students for JHS 1, 2, and 3...\n";
        
        $students = [
            // JHS 1 Student
            [
                'user_id' => null,
                'student_id' => 'S001',
                'first_name' => 'Kwame',
                'last_name' => 'Mensah',
                'email' => 'kwame.mensah@school.com',
                'phone' => '+233244123461',
                'address' => '123 Accra Street, Accra, Ghana',
                'date_of_birth' => '2008-05-15',
                'gender' => 'male',
                'admission_date' => '2020-09-01',
                'current_class_id' => null, // Will be assigned after classes are created
                'student_type' => 'Day',
                'parent_name' => 'Mr. Kofi Mensah',
                'parent_phone' => '+233244123466',
                'parent_email' => 'kofi.mensah@email.com',
                'emergency_contact' => 'Mrs. Ama Mensah',
                'emergency_phone' => '+233244123467',
                'blood_group' => 'O+',
                'medical_conditions' => 'None',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            
            // JHS 2 Students (2 students)
            [
                'user_id' => null,
                'student_id' => 'S002',
                'first_name' => 'Ama',
                'last_name' => 'Osei',
                'email' => 'ama.osei@school.com',
                'phone' => '+233244123462',
                'address' => '456 Kumasi Road, Kumasi, Ghana',
                'date_of_birth' => '2007-03-22',
                'gender' => 'female',
                'admission_date' => '2019-09-01',
                'current_class_id' => null,
                'student_type' => 'Day',
                'parent_name' => 'Mr. Yaw Osei',
                'parent_phone' => '+233244123468',
                'parent_email' => 'yaw.osei@email.com',
                'emergency_contact' => 'Mrs. Efua Osei',
                'emergency_phone' => '+233244123469',
                'blood_group' => 'A+',
                'medical_conditions' => 'None',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            [
                'user_id' => null,
                'student_id' => 'S003',
                'first_name' => 'Kofi',
                'last_name' => 'Addo',
                'email' => 'kofi.addo@school.com',
                'phone' => '+233244123463',
                'address' => '789 Cape Coast Street, Cape Coast, Ghana',
                'date_of_birth' => '2007-07-10',
                'gender' => 'male',
                'admission_date' => '2019-09-01',
                'current_class_id' => null,
                'student_type' => 'Boarding',
                'parent_name' => 'Mr. Kwesi Addo',
                'parent_phone' => '+233244123470',
                'parent_email' => 'kwesi.addo@email.com',
                'emergency_contact' => 'Mrs. Abena Addo',
                'emergency_phone' => '+233244123471',
                'blood_group' => 'B+',
                'medical_conditions' => 'None',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            
            // JHS 3 Students (2 students)
            [
                'user_id' => null,
                'student_id' => 'S004',
                'first_name' => 'Efua',
                'last_name' => 'Boateng',
                'email' => 'efua.boateng@school.com',
                'phone' => '+233244123464',
                'address' => '321 Tamale Avenue, Tamale, Ghana',
                'date_of_birth' => '2006-11-18',
                'gender' => 'female',
                'admission_date' => '2018-09-01',
                'current_class_id' => null,
                'student_type' => 'Day',
                'parent_name' => 'Mr. Nana Boateng',
                'parent_phone' => '+233244123472',
                'parent_email' => 'nana.boateng@email.com',
                'emergency_contact' => 'Mrs. Yaa Boateng',
                'emergency_phone' => '+233244123473',
                'blood_group' => 'AB+',
                'medical_conditions' => 'None',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            [
                'user_id' => null,
                'student_id' => 'S005',
                'first_name' => 'Yaw',
                'last_name' => 'Darko',
                'email' => 'yaw.darko@school.com',
                'phone' => '+233244123465',
                'address' => '654 Ho Street, Ho, Ghana',
                'date_of_birth' => '2006-01-30',
                'gender' => 'male',
                'admission_date' => '2018-09-01',
                'current_class_id' => null,
                'student_type' => 'Boarding',
                'parent_name' => 'Mr. Kwame Darko',
                'parent_phone' => '+233244123474',
                'parent_email' => 'kwame.darko@email.com',
                'emergency_contact' => 'Mrs. Akua Darko',
                'emergency_phone' => '+233244123475',
                'blood_group' => 'O-',
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