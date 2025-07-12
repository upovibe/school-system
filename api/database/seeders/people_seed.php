<?php
// api/database/seeders/people_seed.php - People and departments seeder

class PeopleSeed {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Starting people and departments seeding...\n\n";
        
        $this->seedDepartments();
        $this->seedSamplePeople();
        
        echo "\n✅ People and departments seeding completed!\n";
    }
    
    private function seedDepartments() {
        echo "📝 Seeding departments...\n";
        
        $departments = [
            [
                'name' => 'Mathematics',
                'description' => 'Mathematics and Statistics Department'
            ],
            [
                'name' => 'Science',
                'description' => 'Science Department (Physics, Chemistry, Biology)'
            ],
            [
                'name' => 'English',
                'description' => 'English Language and Literature Department'
            ],
            [
                'name' => 'Social Studies',
                'description' => 'Social Studies and History Department'
            ],
            [
                'name' => 'Physical Education',
                'description' => 'Physical Education and Sports Department'
            ],
            [
                'name' => 'Arts',
                'description' => 'Arts and Creative Arts Department'
            ],
            [
                'name' => 'Administration',
                'description' => 'School Administration Department'
            ]
        ];
        
        $insertStmt = $this->pdo->prepare('
            INSERT INTO departments (name, description, created_at, updated_at) 
            VALUES (?, ?, ?, ?)
        ');
        
        $checkStmt = $this->pdo->prepare('SELECT id FROM departments WHERE name = ?');
        $inserted = 0;
        
        foreach ($departments as $dept) {
            // Check if department already exists
            $checkStmt->execute([$dept['name']]);
            if ($checkStmt->fetch()) {
                echo "  ⏭️  Department '{$dept['name']}' already exists, skipping...\n";
                continue;
            }
            
            $insertStmt->execute([
                $dept['name'],
                $dept['description'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            $inserted++;
        }
        
        echo "✅ Seeded " . $inserted . " new departments\n";
    }
    
    private function seedSamplePeople() {
        echo "📝 Seeding sample people...\n";
        
        // Get department IDs
        $deptStmt = $this->pdo->prepare('SELECT id, name FROM departments');
        $deptStmt->execute();
        $departments = $deptStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Sample teachers
        $teachers = [
            [
                'name' => 'John Smith',
                'email' => 'john.smith@school.com',
                'phone' => '+233201234567',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'role_id' => 2, // teacher
                'gender' => 'male',
                'department_id' => $this->getDeptIdByName($departments, 'Mathematics'),
                'hire_date' => '2020-09-01',
                'qualification' => 'MSc Mathematics',
                'specialization' => 'Advanced Calculus'
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah.johnson@school.com',
                'phone' => '+233201234568',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'role_id' => 2, // teacher
                'gender' => 'female',
                'department_id' => $this->getDeptIdByName($departments, 'Science'),
                'hire_date' => '2019-08-15',
                'qualification' => 'PhD Chemistry',
                'specialization' => 'Organic Chemistry'
            ],
            [
                'name' => 'Michael Brown',
                'email' => 'michael.brown@school.com',
                'phone' => '+233201234569',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'role_id' => 2, // teacher
                'gender' => 'male',
                'department_id' => $this->getDeptIdByName($departments, 'English'),
                'hire_date' => '2021-01-10',
                'qualification' => 'MA English Literature',
                'specialization' => 'Shakespeare Studies'
            ]
        ];
        
        // Sample students
        $students = [
            [
                'name' => 'Emma Wilson',
                'email' => 'emma.wilson@student.school.com',
                'phone' => '+233201234570',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'role_id' => 3, // student
                'gender' => 'female',
                'admission_number' => 'STU2024001',
                'enrollment_date' => '2024-09-01',
                'guardian_name' => 'Robert Wilson',
                'guardian_phone' => '+233201234571'
            ],
            [
                'name' => 'David Thompson',
                'email' => 'david.thompson@student.school.com',
                'phone' => '+233201234572',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'role_id' => 3, // student
                'gender' => 'male',
                'admission_number' => 'STU2024002',
                'enrollment_date' => '2024-09-01',
                'guardian_name' => 'Mary Thompson',
                'guardian_phone' => '+233201234573'
            ]
        ];
        
        // Sample parents
        $parents = [
            [
                'name' => 'Robert Wilson',
                'email' => 'robert.wilson@email.com',
                'phone' => '+233201234571',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'role_id' => 4, // parent
                'gender' => 'male',
                'occupation' => 'Engineer',
                'workplace' => 'Tech Solutions Ltd',
                'relationship_to_student' => 'father'
            ],
            [
                'name' => 'Mary Thompson',
                'email' => 'mary.thompson@email.com',
                'phone' => '+233201234573',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'role_id' => 4, // parent
                'gender' => 'female',
                'occupation' => 'Doctor',
                'workplace' => 'City Hospital',
                'relationship_to_student' => 'mother'
            ]
        ];
        
        // Sample staff
        $staff = [
            [
                'name' => 'Lisa Anderson',
                'email' => 'lisa.anderson@school.com',
                'phone' => '+233201234574',
                'password' => password_hash('password123', PASSWORD_DEFAULT),
                'role_id' => 5, // staff
                'gender' => 'female',
                'position' => 'Administrative Assistant',
                'department' => 'Administration',
                'hire_date' => '2022-03-15'
            ]
        ];
        
        // Insert users and role-specific data
        $this->insertTeachers($teachers);
        $this->insertStudents($students);
        $this->insertParents($parents);
        $this->insertStaff($staff);
        
        // Link parents to students
        $this->linkParentsToStudents();
    }
    
    private function getDeptIdByName($departments, $name) {
        foreach ($departments as $dept) {
            if ($dept['name'] === $name) {
                return $dept['id'];
            }
        }
        return null;
    }
    
    private function insertTeachers($teachers) {
        echo "  👨‍🏫 Inserting teachers...\n";
        
        $userStmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, role_id, gender, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $teacherStmt = $this->pdo->prepare('
            INSERT INTO teachers (user_id, department_id, hire_date, qualification, specialization, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        
        $inserted = 0;
        
        foreach ($teachers as $teacher) {
            // Insert user
            $userStmt->execute([
                $teacher['name'],
                $teacher['email'],
                $teacher['phone'],
                $teacher['password'],
                $teacher['role_id'],
                $teacher['gender'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            
            $userId = $this->pdo->lastInsertId();
            
            // Insert teacher
            $teacherStmt->execute([
                $userId,
                $teacher['department_id'],
                $teacher['hire_date'],
                $teacher['qualification'],
                $teacher['specialization'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            
            $inserted++;
        }
        
        echo "    ✅ Inserted " . $inserted . " teachers\n";
    }
    
    private function insertStudents($students) {
        echo "  👨‍🎓 Inserting students...\n";
        
        $userStmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, role_id, gender, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $studentStmt = $this->pdo->prepare('
            INSERT INTO students (user_id, admission_number, enrollment_date, guardian_name, guardian_phone, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        
        $inserted = 0;
        
        foreach ($students as $student) {
            // Insert user
            $userStmt->execute([
                $student['name'],
                $student['email'],
                $student['phone'],
                $student['password'],
                $student['role_id'],
                $student['gender'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            
            $userId = $this->pdo->lastInsertId();
            
            // Insert student
            $studentStmt->execute([
                $userId,
                $student['admission_number'],
                $student['enrollment_date'],
                $student['guardian_name'],
                $student['guardian_phone'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            
            $inserted++;
        }
        
        echo "    ✅ Inserted " . $inserted . " students\n";
    }
    
    private function insertParents($parents) {
        echo "  👨‍👩‍👧‍👦 Inserting parents...\n";
        
        $userStmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, role_id, gender, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $parentStmt = $this->pdo->prepare('
            INSERT INTO parents (user_id, occupation, workplace, relationship_to_student, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        
        $inserted = 0;
        
        foreach ($parents as $parent) {
            // Insert user
            $userStmt->execute([
                $parent['name'],
                $parent['email'],
                $parent['phone'],
                $parent['password'],
                $parent['role_id'],
                $parent['gender'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            
            $userId = $this->pdo->lastInsertId();
            
            // Insert parent
            $parentStmt->execute([
                $userId,
                $parent['occupation'],
                $parent['workplace'],
                $parent['relationship_to_student'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            
            $inserted++;
        }
        
        echo "    ✅ Inserted " . $inserted . " parents\n";
    }
    
    private function insertStaff($staff) {
        echo "  👨‍💼 Inserting staff...\n";
        
        $userStmt = $this->pdo->prepare('
            INSERT INTO users (name, email, phone, password, role_id, gender, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $staffStmt = $this->pdo->prepare('
            INSERT INTO staff (user_id, position, department, hire_date, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        
        $inserted = 0;
        
        foreach ($staff as $staffMember) {
            // Insert user
            $userStmt->execute([
                $staffMember['name'],
                $staffMember['email'],
                $staffMember['phone'],
                $staffMember['password'],
                $staffMember['role_id'],
                $staffMember['gender'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            
            $userId = $this->pdo->lastInsertId();
            
            // Insert staff
            $staffStmt->execute([
                $userId,
                $staffMember['position'],
                $staffMember['department'],
                $staffMember['hire_date'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            
            $inserted++;
        }
        
        echo "    ✅ Inserted " . $inserted . " staff members\n";
    }
    
    private function linkParentsToStudents() {
        echo "  🔗 Linking parents to students...\n";
        
        // Get parent and student IDs
        $parentStmt = $this->pdo->prepare('
            SELECT p.id, u.name, p.relationship_to_student 
            FROM parents p 
            JOIN users u ON p.user_id = u.id
        ');
        $parentStmt->execute();
        $parents = $parentStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $studentStmt = $this->pdo->prepare('
            SELECT s.id, u.name, s.guardian_name 
            FROM students s 
            JOIN users u ON s.user_id = u.id
        ');
        $studentStmt->execute();
        $students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $linkStmt = $this->pdo->prepare('
            INSERT INTO parent_student (parent_id, student_id, relationship, is_primary_contact, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        
        $linked = 0;
        
        foreach ($parents as $parent) {
            foreach ($students as $student) {
                // Simple matching logic - in real app you'd have more sophisticated matching
                if (strpos($parent['name'], 'Wilson') !== false && strpos($student['name'], 'Emma') !== false) {
                    $linkStmt->execute([
                        $parent['id'],
                        $student['id'],
                        $parent['relationship_to_student'],
                        true,
                        date('Y-m-d H:i:s'),
                        date('Y-m-d H:i:s')
                    ]);
                    $linked++;
                } elseif (strpos($parent['name'], 'Thompson') !== false && strpos($student['name'], 'David') !== false) {
                    $linkStmt->execute([
                        $parent['id'],
                        $student['id'],
                        $parent['relationship_to_student'],
                        true,
                        date('Y-m-d H:i:s'),
                        date('Y-m-d H:i:s')
                    ]);
                    $linked++;
                }
            }
        }
        
        echo "    ✅ Linked " . $linked . " parent-student relationships\n";
    }
}
?> 