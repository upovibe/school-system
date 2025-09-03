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
        echo "📝 Seeding 15+ students per class...\n";
        
        // Get available classes
        $classes = $this->getAvailableClasses();
        if (empty($classes)) {
            echo "❌ Error: No classes found. Please run class_seeder first.\n";
            return;
        }
        
        $totalStudents = 0;
        $currentId = 1;
        
        // Get the highest existing student ID to avoid conflicts
        $stmt = $this->pdo->prepare('SELECT MAX(CAST(SUBSTRING(student_id, 10) AS UNSIGNED)) as max_id FROM students WHERE student_id LIKE "STU250811%"');
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result && $result['max_id']) {
            $currentId = $result['max_id'] + 1;
            echo "📊 Starting student ID generation from: STU250811" . str_pad($currentId, 3, '0', STR_PAD_LEFT) . "\n";
        }
        
        // Common data that can be reused
        $commonPassword = password_hash('student123', PASSWORD_DEFAULT);
        $bloodGroups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
        $genders = ['male', 'female'];
        $studentTypes = ['Day', 'Boarding'];
        
        // Ghanaian first names
        $maleNames = ['Kwame', 'Kofi', 'Yaw', 'Kwaku', 'Nana', 'Kweku', 'Kojo', 'Kodwo', 'Kwabena', 'Kwadwo', 'Kwasi', 'Kwaku', 'Kofi', 'Kweku', 'Kojo'];
        $femaleNames = ['Ama', 'Akosua', 'Efua', 'Adwoa', 'Abena', 'Akua', 'Yaa', 'Afia', 'Aba', 'Akua', 'Efua', 'Adwoa', 'Abena', 'Akosua', 'Ama'];
        
        // Ghanaian last names
        $lastNames = ['Asante', 'Boateng', 'Mensah', 'Owusu', 'Adjei', 'Appiah', 'Darko', 'Frimpong', 'Gyasi', 'Hammond', 'Johnson', 'Kwarteng', 'Lartey', 'Nkrumah', 'Osei'];
        
        // Ghanaian cities
        $cities = ['Accra', 'Kumasi', 'Cape Coast', 'Takoradi', 'Tamale', 'Koforidua', 'Sunyani', 'Ho', 'Bolgatanga', 'Wa', 'Techiman', 'Kintampo', 'Nkawkaw', 'Mampong', 'Konongo'];
        
                        // Define custom student counts for each class
        $classStudentCounts = [
            'KG 1' => 14,
            'KG 2' => 16,
            'P 1' => 18,
            'P 2' => 20,
            'P 3' => 17,
            'P 4' => 19,
            'P 5' => 15,
            'P 6' => 13,
            'JHS 1' => 18,
            'JHS 2' => 20,
            'JHS 3' => 16
        ];

        foreach ($classes as $class) {
            $studentCount = $classStudentCounts[$class['name']] ?? 15; // Default to 15 if not specified
            echo "📚 Creating {$studentCount} students for {$class['name']} (ID: {$class['id']})...\n";
            $classStudents = $this->generateStudentsForClass($class['name'], $class['id'], $currentId, $studentCount, $commonPassword, $bloodGroups, $genders, $studentTypes, $maleNames, $femaleNames, $lastNames, $cities);
            
            foreach ($classStudents as $student) {
                $this->seedStudent($student);
                $totalStudents++;
            }
            
            $currentId += count($classStudents);
            echo "✅ Added " . count($classStudents) . " students to {$class['name']} (ID: {$class['id']})\n";
        }
        
        echo "📊 Total students seeded: {$totalStudents}\n";
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
        
        // Check if user already exists
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$studentData['email']]);
        $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $userId = null;
        if ($existingUser) {
            $userId = $existingUser['id'];
            echo "🔗 Linking student to existing user: {$studentData['email']}\n";
        } else {
            // Create user account for the student
            $userId = $this->createUserForStudent($studentData);
            if (!$userId) {
                echo "❌ Failed to create user for student {$studentData['student_id']}\n";
                return;
            }
        }
        
        // Use the class ID that was passed directly
        $classId = $studentData['class_id'];
        echo "🔍 Using class ID {$classId} for class '{$studentData['class_name']}'\n";
        
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
            $userId,
            $studentData['student_id'],
            $studentData['first_name'],
            $studentData['last_name'],
            $studentData['email'],
            $studentData['phone'],
            $studentData['address'],
            $studentData['date_of_birth'],
            $studentData['gender'],
            $studentData['admission_date'],
            $classId,
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
        
        echo "✅ Added student: {$studentData['first_name']} {$studentData['last_name']} ({$studentData['student_id']}) - {$studentData['class_name']}\n";
    }
    
    private function createUserForStudent($studentData) {
        // Get student role ID
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['student']);
        $studentRole = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$studentRole) {
            echo "❌ Student role not found. Please run role_seeder first.\n";
            return null;
        }
        
        // Create user account
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, password_changed, role_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        
        $fullName = $studentData['first_name'] . ' ' . $studentData['last_name'];
        
        $stmt->execute([
            $fullName,
            $studentData['email'],
            $studentData['phone'],
            $studentData['password'],
            true, // password_changed
            $studentRole['id'],
            'active'
        ]);
        
        $userId = $this->pdo->lastInsertId();
        echo "👤 Created user account for: {$fullName} ({$studentData['email']})\n";
        
        return $userId;
    }
    
    private function getAvailableClasses() {
        $stmt = $this->pdo->prepare('SELECT id, name FROM classes WHERE status = "active" ORDER BY id');
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getClassIdByName($className) {
        $stmt = $this->pdo->prepare('SELECT id FROM classes WHERE name = ? AND status = "active" ORDER BY id LIMIT 1');
        $stmt->execute([$className]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : null;
    }
    
    private function generateStudentsForClass($className, $classId, $startId, $studentCount, $password, $bloodGroups, $genders, $studentTypes, $maleNames, $femaleNames, $lastNames, $cities) {
        $students = [];
        $studentsPerClass = $studentCount; // Use the specified student count
        
        // Determine age range based on class
        $ageRanges = $this->getAgeRangeForClass($className);
        
        for ($i = 0; $i < $studentsPerClass; $i++) {
            $studentId = 'STU250811' . str_pad($startId + $i, 3, '0', STR_PAD_LEFT);
            $gender = $genders[array_rand($genders)];
            $firstName = $gender === 'male' ? $maleNames[array_rand($maleNames)] : $femaleNames[array_rand($femaleNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $city = $cities[array_rand($cities)];
            
            // Generate birth date within appropriate age range
            $birthYear = rand($ageRanges['min'], $ageRanges['max']);
            $birthMonth = rand(1, 12);
            $birthDay = rand(1, 28); // Safe day for all months
            $dateOfBirth = sprintf('%04d-%02d-%02d', $birthYear, $birthMonth, $birthDay);
            
            // Generate phone numbers (reusing pattern but with different numbers)
            $phoneBase = 233244123000 + ($startId + $i);
            $parentPhoneBase = 233244123500 + ($startId + $i);
            $emergencyPhoneBase = 233244123600 + ($startId + $i);
            
            $students[] = [
                'user_id' => null,
                'student_id' => $studentId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => strtolower($firstName . '.' . $lastName . $i . '@school.com'),
                'phone' => '+' . $phoneBase,
                'address' => rand(100, 999) . ' ' . $city . ' Street, ' . $city . ', Ghana',
                'date_of_birth' => $dateOfBirth,
                'gender' => $gender,
                'admission_date' => '2024-09-01',
                'class_name' => $className,
                'class_id' => $classId, // Use the passed class ID directly
                'student_type' => $studentTypes[array_rand($studentTypes)],
                'parent_name' => 'Mr./Mrs. ' . $lastName,
                'parent_phone' => '+' . $parentPhoneBase,
                'parent_email' => 'parent.' . strtolower($lastName) . $i . '@email.com',
                'emergency_contact' => 'Emergency Contact ' . $lastName,
                'emergency_phone' => '+' . $emergencyPhoneBase,
                'blood_group' => $bloodGroups[array_rand($bloodGroups)],
                'medical_conditions' => 'None',
                'password' => $password, // Reusing the same password
                'status' => 'active'
            ];
        }
        
        return $students;
    }
    
    private function getAgeRangeForClass($className) {
        $ageRanges = [
            'KG 1' => ['min' => 2020, 'max' => 2021], // 3-4 years old
            'KG 2' => ['min' => 2019, 'max' => 2020], // 4-5 years old
            'P 1' => ['min' => 2018, 'max' => 2019],  // 5-6 years old
            'P 2' => ['min' => 2017, 'max' => 2018],  // 6-7 years old
            'P 3' => ['min' => 2016, 'max' => 2017],  // 7-8 years old
            'P 4' => ['min' => 2015, 'max' => 2016],  // 8-9 years old
            'P 5' => ['min' => 2014, 'max' => 2015],  // 9-10 years old
            'P 6' => ['min' => 2013, 'max' => 2014],  // 10-11 years old
            'JHS 1' => ['min' => 2012, 'max' => 2013], // 11-12 years old
            'JHS 2' => ['min' => 2011, 'max' => 2012], // 12-13 years old
            'JHS 3' => ['min' => 2010, 'max' => 2011], // 13-14 years old
        ];
        
        return $ageRanges[$className] ?? ['min' => 2010, 'max' => 2011];
    }
}
?> 