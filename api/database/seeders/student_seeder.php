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
        echo "📝 Seeding 5 students...\n";
        
        $students = [
            [
                'user_id' => null, // Will be linked to user later
                'student_id' => 'S001',
                'first_name' => 'Kwame',
                'last_name' => 'Asante',
                'email' => 'kwame.asante@student.school.com',
                'phone' => '+233244123461',
                'address' => '123 Accra Street, Accra, Ghana',
                'date_of_birth' => '2008-05-15',
                'gender' => 'male',
                'admission_date' => '2020-09-01',
                'current_class_id' => null, // Will be assigned after classes are created
                'student_type' => 'Day',
                'parent_name' => 'Mr. Kwesi Asante',
                'parent_phone' => '+233244123466',
                'parent_email' => 'kwesi.asante@parent.school.com',
                'emergency_contact' => 'Mrs. Akua Asante',
                'emergency_phone' => '+233244123467',
                'blood_group' => 'O+',
                'medical_conditions' => 'None',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            [
                'user_id' => null,
                'student_id' => 'S002',
                'first_name' => 'Ama',
                'last_name' => 'Osei',
                'email' => 'ama.osei@student.school.com',
                'phone' => '+233244123462',
                'address' => '456 Kumasi Road, Kumasi, Ghana',
                'date_of_birth' => '2009-03-22',
                'gender' => 'female',
                'admission_date' => '2020-09-01',
                'current_class_id' => null,
                'student_type' => 'Boarding',
                'parent_name' => 'Mrs. Akua Osei',
                'parent_phone' => '+233244123468',
                'parent_email' => 'akua.osei@parent.school.com',
                'emergency_contact' => 'Mr. Kofi Osei',
                'emergency_phone' => '+233244123469',
                'blood_group' => 'A+',
                'medical_conditions' => 'Mild asthma - inhaler required',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            [
                'user_id' => null,
                'student_id' => 'S003',
                'first_name' => 'Kofi',
                'last_name' => 'Mensah',
                'email' => 'kofi.mensah@student.school.com',
                'phone' => '+233244123463',
                'address' => '789 Cape Coast Avenue, Cape Coast, Ghana',
                'date_of_birth' => '2008-11-08',
                'gender' => 'male',
                'admission_date' => '2020-09-01',
                'current_class_id' => null,
                'student_type' => 'Day',
                'parent_name' => 'Mr. Kofi Mensah',
                'parent_phone' => '+233244123470',
                'parent_email' => 'kofi.mensah@parent.school.com',
                'emergency_contact' => 'Mrs. Grace Mensah',
                'emergency_phone' => '+233244123471',
                'blood_group' => 'B+',
                'medical_conditions' => 'None',
                'password' => password_hash('student123', PASSWORD_DEFAULT),
                'status' => 'active'
            ],
            [
                'user_id' => null,
                'student_id' => 'S004',
                'first_name' => 'Abena',
                'last_name' => 'Addo',
                'email' => 'abena.addo@student.school.com',
                'phone' => '+233244123464',
                'address' => '321 Tamale Street, Tamale, Ghana',
                'date_of_birth' => '2009-07-12',
                'gender' => 'female',
                'admission_date' => '2020-09-01',
                'current_class_id' => null,
                'student_type' => 'Boarding',
                'parent_name' => 'Mrs. Grace Addo',
                'parent_phone' => '+233244123472',
                'parent_email' => 'grace.addo@parent.school.com',
                'emergency_contact' => 'Mr. Daniel Addo',
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
                'email' => 'yaw.darko@student.school.com',
                'phone' => '+233244123465',
                'address' => '654 Sekondi Road, Sekondi, Ghana',
                'date_of_birth' => '2008-09-30',
                'gender' => 'male',
                'admission_date' => '2020-09-01',
                'current_class_id' => null,
                'student_type' => 'Day',
                'parent_name' => 'Mr. Yaw Darko',
                'parent_phone' => '+233244123474',
                'parent_email' => 'yaw.darko@parent.school.com',
                'emergency_contact' => 'Mrs. Mary Darko',
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