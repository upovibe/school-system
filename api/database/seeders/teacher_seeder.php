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
        echo "📝 Seeding teachers for all classes...\n";
        
        // Get available classes to assign class teachers
        $classes = $this->getAvailableClasses();
        if (empty($classes)) {
            echo "❌ Error: No classes found. Please run class_seeder first.\n";
            return;
        }
        
        $teachers = [
            // KG 1 Teachers (Two Female Teachers)
            [
                'user_id' => null,
                'employee_id' => 'T250811001',
                'first_name' => 'Akosua',
                'last_name' => 'Asante',
                'email' => 'akosua.asante@school.com',
                'phone' => '+233244123701',
                'address' => '123 Kindergarten Street, Accra, Ghana',
                'date_of_birth' => '1985-03-15',
                'gender' => 'female',
                'qualification' => 'Diploma in Early Childhood Education',
                'specialization' => 'Early Childhood Development, Play-based Learning',
                'hire_date' => '2020-09-01',
                'salary' => 6500.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 1 // KG 1 class teacher
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811002',
                'first_name' => 'Adwoa',
                'last_name' => 'Mensah',
                'email' => 'adwoa.mensah.kg1@school.com',
                'phone' => '+233244123702',
                'address' => '124 Kindergarten Avenue, Accra, Ghana',
                'date_of_birth' => '1986-08-20',
                'gender' => 'female',
                'qualification' => 'Certificate in Child Development',
                'specialization' => 'Language Development, Storytelling',
                'hire_date' => '2021-09-01',
                'salary' => 6300.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 1 // KG 1 second teacher
            ],
            
            // KG 2 Teachers (Two Female Teachers)
            [
                'user_id' => null,
                'employee_id' => 'T250811003',
                'first_name' => 'Efua',
                'last_name' => 'Boateng',
                'email' => 'efua.boateng@school.com',
                'phone' => '+233244123703',
                'address' => '456 Early Learning Avenue, Kumasi, Ghana',
                'date_of_birth' => '1987-07-22',
                'gender' => 'female',
                'qualification' => 'Certificate in Child Development',
                'specialization' => 'Kindergarten Education, Creative Arts',
                'hire_date' => '2021-01-15',
                'salary' => 6200.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 2 // KG 2 class teacher
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811004',
                'first_name' => 'Abena',
                'last_name' => 'Adjei',
                'email' => 'abena.adjei.kg2@school.com',
                'phone' => '+233244123704',
                'address' => '457 Early Learning Road, Kumasi, Ghana',
                'date_of_birth' => '1988-11-10',
                'gender' => 'female',
                'qualification' => 'Diploma in Early Childhood Education',
                'specialization' => 'Numeracy, Motor Skills Development',
                'hire_date' => '2022-01-15',
                'salary' => 6400.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 2 // KG 2 second teacher
            ],
            
            // Primary Teachers (Mixed)
            [
                'user_id' => null,
                'employee_id' => 'T250811005',
                'first_name' => 'Adwoa',
                'last_name' => 'Mensah',
                'email' => 'adwoa.mensah@school.com',
                'phone' => '+233244123705',
                'address' => '789 Primary Street, Cape Coast, Ghana',
                'date_of_birth' => '1983-11-10',
                'gender' => 'female',
                'qualification' => 'BEd in Primary Education',
                'specialization' => 'Primary Education, English Language',
                'hire_date' => '2019-09-01',
                'salary' => 7000.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 3 // P 1 class teacher
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811006',
                'first_name' => 'Kofi',
                'last_name' => 'Owusu',
                'email' => 'kofi.owusu@school.com',
                'phone' => '+233244123706',
                'address' => '321 Primary Avenue, Takoradi, Ghana',
                'date_of_birth' => '1986-05-18',
                'gender' => 'male',
                'qualification' => 'BSc in Mathematics Education',
                'specialization' => 'Mathematics, Science',
                'hire_date' => '2020-01-15',
                'salary' => 7200.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 4 // P 2 class teacher
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811007',
                'first_name' => 'Abena',
                'last_name' => 'Adjei',
                'email' => 'abena.adjei@school.com',
                'phone' => '+233244123707',
                'address' => '654 Primary Road, Tamale, Ghana',
                'date_of_birth' => '1984-09-25',
                'gender' => 'female',
                'qualification' => 'BEd in Primary Education',
                'specialization' => 'Primary Education, Social Studies',
                'hire_date' => '2021-09-01',
                'salary' => 6800.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 5 // P 3 class teacher
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811008',
                'first_name' => 'Kwame',
                'last_name' => 'Appiah',
                'email' => 'kwame.appiah@school.com',
                'phone' => '+233244123708',
                'address' => '987 Primary Lane, Koforidua, Ghana',
                'date_of_birth' => '1982-12-03',
                'gender' => 'male',
                'qualification' => 'BSc in Science Education',
                'specialization' => 'Science, Mathematics',
                'hire_date' => '2018-09-01',
                'salary' => 7500.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 6 // P 4 class teacher
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811009',
                'first_name' => 'Afia',
                'last_name' => 'Darko',
                'email' => 'afia.darko@school.com',
                'phone' => '+233244123709',
                'address' => '147 Primary Close, Sunyani, Ghana',
                'date_of_birth' => '1988-04-12',
                'gender' => 'female',
                'qualification' => 'BEd in Primary Education',
                'specialization' => 'Primary Education, Creative Arts',
                'hire_date' => '2022-01-15',
                'salary' => 6600.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 7 // P 5 class teacher
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811010',
                'first_name' => 'Yaw',
                'last_name' => 'Frimpong',
                'email' => 'yaw.frimpong@school.com',
                'phone' => '+233244123710',
                'address' => '258 Primary Way, Ho, Ghana',
                'date_of_birth' => '1985-08-20',
                'gender' => 'male',
                'qualification' => 'BSc in Mathematics Education',
                'specialization' => 'Mathematics, ICT',
                'hire_date' => '2020-09-01',
                'salary' => 7100.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 8 // P 6 class teacher
            ],
            
            // JHS Teachers
            [
                'user_id' => null,
                'employee_id' => 'T250811011',
                'first_name' => 'Akua',
                'last_name' => 'Gyasi',
                'email' => 'akua.gyasi@school.com',
                'phone' => '+233244123711',
                'address' => '369 JHS Street, Bolgatanga, Ghana',
                'date_of_birth' => '1983-06-14',
                'gender' => 'female',
                'qualification' => 'MSc in Education',
                'specialization' => 'English Language, Literature',
                'hire_date' => '2019-09-01',
                'salary' => 8000.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 9 // JHS 1 class teacher
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811012',
                'first_name' => 'Kojo',
                'last_name' => 'Hammond',
                'email' => 'kojo.hammond@school.com',
                'phone' => '+233244123712',
                'address' => '741 JHS Avenue, Wa, Ghana',
                'date_of_birth' => '1981-10-08',
                'gender' => 'male',
                'qualification' => 'MSc in Mathematics',
                'specialization' => 'Mathematics, Integrated Science',
                'hire_date' => '2017-09-01',
                'salary' => 8200.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 10 // JHS 2 class teacher
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811013',
                'first_name' => 'Aba',
                'last_name' => 'Johnson',
                'email' => 'aba.johnson@school.com',
                'phone' => '+233244123713',
                'address' => '852 JHS Road, Techiman, Ghana',
                'date_of_birth' => '1984-02-28',
                'gender' => 'female',
                'qualification' => 'MEd in Educational Leadership',
                'specialization' => 'Social Studies, Career Technology',
                'hire_date' => '2018-09-01',
                'salary' => 8500.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => 11 // JHS 3 class teacher
            ],
            
            // Subject Teachers (No class responsibility)
            [
                'user_id' => null,
                'employee_id' => 'T250811014',
                'first_name' => 'Kweku',
                'last_name' => 'Kwarteng',
                'email' => 'kweku.kwarteng@school.com',
                'phone' => '+233244123714',
                'address' => '963 Subject Street, Kintampo, Ghana',
                'date_of_birth' => '1987-01-15',
                'gender' => 'male',
                'qualification' => 'BSc in Physical Education',
                'specialization' => 'Physical Education, Sports',
                'hire_date' => '2021-09-01',
                'salary' => 6800.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => null // Subject teacher only
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811015',
                'first_name' => 'Yaa',
                'last_name' => 'Lartey',
                'email' => 'yaa.lartey@school.com',
                'phone' => '+233244123715',
                'address' => '174 Subject Avenue, Nkawkaw, Ghana',
                'date_of_birth' => '1986-11-22',
                'gender' => 'female',
                'qualification' => 'BA in French',
                'specialization' => 'French Language, Foreign Languages',
                'hire_date' => '2020-09-01',
                'salary' => 7000.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => null // Subject teacher only
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811016',
                'first_name' => 'Nana',
                'last_name' => 'Nkrumah',
                'email' => 'nana.nkrumah@school.com',
                'phone' => '+233244123716',
                'address' => '285 Subject Road, Mampong, Ghana',
                'date_of_birth' => '1989-05-30',
                'gender' => 'male',
                'qualification' => 'BSc in Computer Science',
                'specialization' => 'ICT, Computing',
                'hire_date' => '2022-01-15',
                'salary' => 7500.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => null // Subject teacher only
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811017',
                'first_name' => 'Dr. Kwame',
                'last_name' => 'Osei',
                'email' => 'kwame.osei.science@school.com',
                'phone' => '+233244123717',
                'address' => '396 Science Avenue, Konongo, Ghana',
                'date_of_birth' => '1980-12-15',
                'gender' => 'male',
                'qualification' => 'PhD in Chemistry',
                'specialization' => 'Integrated Science, Chemistry, Physics',
                'hire_date' => '2018-09-01',
                'salary' => 9000.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => null // Science subject teacher only
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811018',
                'first_name' => 'Dr. Abena',
                'last_name' => 'Kwarteng',
                'email' => 'abena.kwarteng.math@school.com',
                'phone' => '+233244123718',
                'address' => '507 Mathematics Street, Nkawkaw, Ghana',
                'date_of_birth' => '1982-06-08',
                'gender' => 'female',
                'qualification' => 'PhD in Mathematics',
                'specialization' => 'Mathematics, Statistics, Applied Mathematics',
                'hire_date' => '2019-01-15',
                'salary' => 8800.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => null // Mathematics subject teacher only
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811019',
                'first_name' => 'Ama',
                'last_name' => 'Osei',
                'email' => 'ama.osei.french.lower@school.com',
                'phone' => '+233244123719',
                'address' => '618 French Lower Street, Konongo, Ghana',
                'date_of_birth' => '1984-09-12',
                'gender' => 'female',
                'qualification' => 'BA in French Language',
                'specialization' => 'French Language, Early Childhood French',
                'hire_date' => '2020-09-01',
                'salary' => 7200.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => null // French teacher for KG1-P3 only
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811020',
                'first_name' => 'Kwame',
                'last_name' => 'Mensah',
                'email' => 'kwame.mensah.english.lower@school.com',
                'phone' => '+233244123720',
                'address' => '729 English Lower Avenue, Nkawkaw, Ghana',
                'date_of_birth' => '1983-04-25',
                'gender' => 'male',
                'qualification' => 'BEd in English Language',
                'specialization' => 'English Language, Early Literacy',
                'hire_date' => '2021-01-15',
                'salary' => 7100.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => null // English teacher for KG1-P3 only
            ],
            [
                'user_id' => null,
                'employee_id' => 'T250811021',
                'first_name' => 'Efua',
                'last_name' => 'Gyasi',
                'email' => 'efua.gyasi.twi.lower@school.com',
                'phone' => '+233244123721',
                'address' => '830 Twi Lower Road, Mampong, Ghana',
                'date_of_birth' => '1985-11-18',
                'gender' => 'female',
                'qualification' => 'BA in Ghanaian Languages',
                'specialization' => 'Twi Language, Ghanaian Language Education',
                'hire_date' => '2020-09-01',
                'salary' => 7000.00,
                'password' => password_hash('teacher123', PASSWORD_DEFAULT),
                'status' => 'active',
                'class_id' => null // Twi teacher for KG1-P3 only
            ]
        ];
        
        foreach ($teachers as $teacher) {
            $this->seedTeacher($teacher);
        }
        
        echo "📊 Total teachers seeded: " . count($teachers) . "\n";
    }
    
    private function getAvailableClasses() {
        $stmt = $this->pdo->prepare('SELECT id, name FROM classes WHERE status = "active" ORDER BY id');
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
        
        // Check if user already exists or create one
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$teacherData['email']]);
        $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

        $userId = null;
        if ($existingUser) {
            $userId = $existingUser['id'];
            echo "🔗 Linking teacher to existing user: {$teacherData['email']}\n";
        } else {
            $userId = $this->createUserForTeacher($teacherData);
            if (!$userId) {
                echo "❌ Failed to create user for teacher {$teacherData['employee_id']}\n";
                return;
            }
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
            $userId,
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
    
    private function createUserForTeacher($teacherData) {
        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE name = ?');
        $stmt->execute(['teacher']);
        $teacherRole = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$teacherRole) {
            echo "❌ Teacher role not found. Please run role_seeder first.\n";
            return null;
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, password_changed, role_id, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');

        $fullName = $teacherData['first_name'] . ' ' . $teacherData['last_name'];

        $stmt->execute([
            $fullName,
            $teacherData['email'],
            $teacherData['phone'],
            $teacherData['password'],
            true, // password_changed
            $teacherRole['id'],
            'active'
        ]);

        $userId = $this->pdo->lastInsertId();
        echo "👤 Created user account for: {$fullName} ({$teacherData['email']})\n";

        return $userId;
    }
}
?> 