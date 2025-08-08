<?php
// api/models/TeacherModel.php - Model for teachers table

require_once __DIR__ . '/../core/BaseModel.php';

class TeacherModel extends BaseModel {
    protected static $table = 'teachers';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'employee_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'date_of_birth',
        'gender',
        'qualification',
        'specialization',
        'hire_date',
        'salary',
        'password',
        'status',
        'class_id'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'user_id' => 'integer',
        'date_of_birth' => 'date',
        'hire_date' => 'date',
        'salary' => 'float',
        'class_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find teacher by employee ID
     */
    public function findByEmployeeId($employeeId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE employee_id = ?
            ");
            $stmt->execute([$employeeId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error finding teacher by employee ID: ' . $e->getMessage());
        }
    }
    
    /**
     * Find teacher by user ID
     */
    public function findByUserId($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error finding teacher by user ID: ' . $e->getMessage());
        }
    }
    
    /**
     * Get active teachers only
     */
    public function getActiveTeachers() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT t.*, u.name, u.email, u.status as user_status,
                       c.name as class_name, c.section as class_section
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN classes c ON t.class_id = c.id
                WHERE t.status = 'active' AND u.status = 'active'
                ORDER BY u.name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active teachers: ' . $e->getMessage());
        }
    }
    
    /**
     * Get teachers with user information
     */
    public function getTeachersWithUserInfo() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT t.*, u.name, u.email, u.status as user_status,
                       c.name as class_name, c.section as class_section
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN classes c ON t.class_id = c.id
                ORDER BY u.name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching teachers with user info: ' . $e->getMessage());
        }
    }
    
    /**
     * Search teachers by name, email, employee ID, or specialization
     */
    public function searchTeachers($query, $limit = null) {
        try {
            $sql = "
                SELECT t.*, u.name, u.email, u.status as user_status,
                       c.name as class_name, c.section as class_section
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN classes c ON t.class_id = c.id
                WHERE (u.name LIKE ? OR u.email LIKE ? OR t.employee_id LIKE ? OR t.specialization LIKE ?)
                ORDER BY u.name ASC
            ";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $searchTerm = "%{$query}%";
            $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error searching teachers: ' . $e->getMessage());
        }
    }
    
    /**
     * Get teachers with assignment counts
     */
    public function getTeachersWithAssignmentCounts() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT t.*, u.name, u.email, u.status as user_status, 
                       c.name as class_name, c.section as class_section,
                       COUNT(ta.id) as assignment_count
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN classes c ON t.class_id = c.id
                LEFT JOIN teacher_assignments ta ON t.id = ta.teacher_id
                GROUP BY t.id
                ORDER BY u.name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching teachers with assignment counts: ' . $e->getMessage());
        }
    }
    
    /**
     * Get available specializations
     */
    public function getAvailableSpecializations() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT specialization 
                FROM {$this->getTableName()} 
                WHERE specialization IS NOT NULL AND specialization != ''
                ORDER BY specialization ASC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            throw new Exception('Error fetching available specializations: ' . $e->getMessage());
        }
    }
    
    /**
     * Get teachers by specialization
     */
    public function getTeachersBySpecialization($specialization) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT t.*, u.name, u.email, u.status as user_status,
                       c.name as class_name, c.section as class_section
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN classes c ON t.class_id = c.id
                WHERE t.specialization = ? AND t.status = 'active' AND u.status = 'active'
                ORDER BY u.name ASC
            ");
            $stmt->execute([$specialization]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching teachers by specialization: ' . $e->getMessage());
        }
    }
    
    /**
     * Get teacher statistics
     */
    public function getTeacherStatistics() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) as total_teachers,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_teachers,
                    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_teachers,
                    COUNT(CASE WHEN hire_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN 1 END) as new_teachers,
                    COUNT(CASE WHEN class_id IS NOT NULL THEN 1 END) as class_teachers
                FROM {$this->getTableName()}
            ");
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching teacher statistics: ' . $e->getMessage());
        }
    }

    /**
     * Check if employee_id already exists
     */
    public function employeeIdExists($employeeId, $excludeId = null) {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->getTableName()} WHERE employee_id = ?";
            $params = [$employeeId];
            
            if ($excludeId) {
                $sql .= " AND id != ?";
                $params[] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception('Error checking employee ID: ' . $e->getMessage());
        }
    }

    /**
     * Check if email already exists
     */
    public function emailExists($email, $excludeId = null) {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->getTableName()} WHERE email = ?";
            $params = [$email];
            
            if ($excludeId) {
                $sql .= " AND id != ?";
                $params[] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception('Error checking email: ' . $e->getMessage());
        }
    }

    /**
     * Check if class is already assigned to another teacher
     */
    public function isClassAssigned($classId, $excludeTeacherId = null) {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->getTableName()} WHERE class_id = ?";
            $params = [$classId];
            
            if ($excludeTeacherId) {
                $sql .= " AND id != ?";
                $params[] = $excludeTeacherId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception('Error checking class assignment: ' . $e->getMessage());
        }
    }

    /**
     * Get class teachers (teachers assigned to classes)
     */
    public function getClassTeachers() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT t.*, u.name, u.email, u.status as user_status,
                       c.name as class_name, c.section as class_section,
                       c.academic_year, c.capacity
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN classes c ON t.class_id = c.id
                WHERE t.class_id IS NOT NULL AND t.status = 'active'
                ORDER BY c.name ASC, c.section ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching class teachers: ' . $e->getMessage());
        }
    }

    /**
     * Get available classes (classes without assigned teachers)
     */
    public function getAvailableClasses() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT c.* 
                FROM classes c
                LEFT JOIN teachers t ON c.id = t.class_id
                WHERE t.class_id IS NULL AND c.status = 'active'
                ORDER BY c.name ASC, c.section ASC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching available classes: ' . $e->getMessage());
        }
    }

    /**
     * Create teacher with user account and role assignment
     */
    public function createTeacherWithUser($data) {
        try {
            $this->pdo->beginTransaction();

            // Hash the password
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Set default values
            $data['status'] = $data['status'] ?? 'active';
            $data['created_at'] = date('Y-m-d H:i:s');
            $data['updated_at'] = date('Y-m-d H:i:s');

            // Prepare teacher data for insertion
            $teacherData = [
                'employee_id' => $data['employee_id'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'qualification' => $data['qualification'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'hire_date' => $data['hire_date'],
                'salary' => $data['salary'] ?? 0,
                'password' => $data['password'],
                'status' => $data['status'],
                'class_id' => $data['class_id'] ?? null,
                'created_at' => $data['created_at'],
                'updated_at' => $data['updated_at']
            ];

            // Insert teacher record
            $teacherSql = "INSERT INTO teachers (
                employee_id, first_name, last_name, email, phone, address,
                date_of_birth, gender, qualification, specialization, hire_date,
                salary, password, status, class_id, created_at, updated_at
            ) VALUES (
                :employee_id, :first_name, :last_name, :email, :phone, :address,
                :date_of_birth, :gender, :qualification, :specialization, :hire_date,
                :salary, :password, :status, :class_id, :created_at, :updated_at
            )";

            $teacherStmt = $this->pdo->prepare($teacherSql);
            $teacherStmt->execute($teacherData);
            $teacherId = $this->pdo->lastInsertId();

            // Get teacher role ID
            $roleSql = "SELECT id FROM roles WHERE name = 'teacher' LIMIT 1";
            $roleStmt = $this->pdo->prepare($roleSql);
            $roleStmt->execute();
            $role = $roleStmt->fetch(PDO::FETCH_ASSOC);

            if (!$role) {
                throw new Exception('Teacher role not found in roles table');
            }

            // Create user account with teacher role
            $userData = [
                'name' => $data['first_name'] . ' ' . $data['last_name'],
                'email' => $data['email'],
                'password' => $data['password'], // Already hashed
                'phone' => $data['phone'] ?? null,
                'role_id' => $role['id'],
                'gender' => $data['gender'] ?? null,
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $userSql = "INSERT INTO users (
                name, email, password, phone, role_id, gender,
                status, created_at, updated_at
            ) VALUES (
                :name, :email, :password, :phone, :role_id, :gender,
                :status, :created_at, :updated_at
            )";

            $userStmt = $this->pdo->prepare($userSql);
            $userStmt->execute($userData);
            $userId = $this->pdo->lastInsertId();

            // Update teacher record with user_id
            $updateSql = "UPDATE teachers SET user_id = ? WHERE id = ?";
            $updateStmt = $this->pdo->prepare($updateSql);
            $updateStmt->execute([$userId, $teacherId]);

            $this->pdo->commit();

            return [
                'teacher_id' => $teacherId,
                'user_id' => $userId,
                'teacher_data' => $data
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new Exception('Error creating teacher with user account: ' . $e->getMessage());
        }
    }

    /**
     * Update teacher and corresponding user account
     */
    public function updateTeacherWithUser($id, $data) {
        try {
            $this->pdo->beginTransaction();

            // Get current teacher data to find user_id
            $teacherSql = "SELECT user_id FROM teachers WHERE id = ?";
            $teacherStmt = $this->pdo->prepare($teacherSql);
            $teacherStmt->execute([$id]);
            $currentTeacher = $teacherStmt->fetch(PDO::FETCH_ASSOC);

            if (!$currentTeacher) {
                throw new Exception('Teacher not found');
            }

            $data['updated_at'] = date('Y-m-d H:i:s');
            
            // If password is provided, hash it
            if (isset($data['password']) && !empty($data['password'])) {
                $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            } else {
                unset($data['password']); // Don't update password if not provided
            }

            // Update teacher record
            $setClause = [];
            $params = [];
            
            foreach ($data as $key => $value) {
                $setClause[] = "$key = :$key";
                $params[":$key"] = $value;
            }
            
            $params[':id'] = $id;

            $updateTeacherSql = "UPDATE teachers SET " . implode(', ', $setClause) . " WHERE id = :id";
            $updateTeacherStmt = $this->pdo->prepare($updateTeacherSql);
            $updateTeacherStmt->execute($params);

            // Update corresponding user account
            $userData = [
                'name' => ($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? ''),
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'gender' => $data['gender'] ?? null,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            // Add password to user update if provided
            if (isset($data['password'])) {
                $userData['password'] = $data['password'];
            }

            $userSetClause = [];
            $userParams = [];
            
            foreach ($userData as $key => $value) {
                if ($value !== null) {
                    $userSetClause[] = "$key = :$key";
                    $userParams[":$key"] = $value;
                }
            }
            
            $userParams[':user_id'] = $currentTeacher['user_id'];

            $updateUserSql = "UPDATE users SET " . implode(', ', $userSetClause) . " WHERE id = :user_id";
            $updateUserStmt = $this->pdo->prepare($updateUserSql);
            $updateUserStmt->execute($userParams);

            $this->pdo->commit();

            return true;

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new Exception('Error updating teacher with user account: ' . $e->getMessage());
        }
    }

    /**
     * Get teacher assignments with class, subject, and student details (grouped by class)
     */
    public function getTeacherAssignments($teacherId, $filters = []) {
        try {
            $where = 'WHERE ta.teacher_id = ?';
            $params = [$teacherId];
            if (!empty($filters['class_id'])) { $where .= ' AND ta.class_id = ?'; $params[] = $filters['class_id']; }
            if (!empty($filters['subject_id'])) { $where .= ' AND ta.subject_id = ?'; $params[] = $filters['subject_id']; }

            $sql = "
                SELECT 
                    ta.id,
                    ta.created_at,
                    c.id as class_id,
                    c.name as class_name,
                    c.section as class_section,
                    c.academic_year as class_academic_year,
                    c.capacity as class_capacity,
                    c.status as class_status,
                    s.id as subject_id,
                    s.name as subject_name,
                    s.code as subject_code,
                    s.category as subject_category,
                    s.description as subject_description
                FROM teacher_assignments ta
                JOIN classes c ON ta.class_id = c.id
                JOIN subjects s ON ta.subject_id = s.id
                $where
                ORDER BY c.name ASC, c.section ASC, s.name ASC
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Group results by class
            $groupedResults = [];
            foreach ($results as $result) {
                $classId = $result['class_id'];
                
                // If this class hasn't been added yet, create the class entry
                if (!isset($groupedResults[$classId])) {
                    $groupedResults[$classId] = [
                        'class_id' => $result['class_id'],
                        'class_name' => $result['class_name'],
                        'class_section' => $result['class_section'],
                        'class_academic_year' => $result['class_academic_year'],
                        'class_capacity' => $result['class_capacity'],
                        'class_status' => $result['class_status'],
                        'subjects' => [],
                        'students' => []
                    ];
                }
                
                // Add the subject to this class
                $groupedResults[$classId]['subjects'][] = [
                    'subject_id' => $result['subject_id'],
                    'subject_name' => $result['subject_name'],
                    'subject_code' => $result['subject_code'],
                    'subject_category' => $result['subject_category'],
                    'subject_description' => $result['subject_description']
                ];
            }
            
            // Get students for each class
            foreach ($groupedResults as $classId => &$classData) {
                $studentStmt = $this->pdo->prepare("
                    SELECT 
                        s.id,
                        s.student_id,
                        s.first_name,
                        s.last_name,
                        s.gender,
                        s.date_of_birth,
                        s.address,
                        s.phone,
                        s.email,
                        s.status,
                        s.created_at,
                        s.updated_at,
                        u.name as user_name,
                        u.email as user_email,
                        u.status as user_status
                    FROM students s
                    LEFT JOIN users u ON s.user_id = u.id
                    WHERE s.current_class_id = ?
                    ORDER BY s.first_name ASC, s.last_name ASC
                ");
                $studentStmt->execute([$classId]);
                $students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Apply casts to each student
                foreach ($students as &$student) {
                    $student = $this->applyCasts($student);
                }
                
                $classData['students'] = $students;
            }
            
            // Convert to indexed array and apply casts
            $finalResults = [];
            foreach ($groupedResults as $classData) {
                $classData = $this->applyCasts($classData);
                $finalResults[] = $classData;
            }
            
            return $finalResults;
        } catch (PDOException $e) {
            throw new Exception('Error fetching teacher assignments: ' . $e->getMessage());
        }
    }

    /**
     * Get teacher subjects (unique subjects assigned to teacher)
     */
    public function getTeacherSubjects($teacherId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT
                    s.id,
                    s.name,
                    s.code,
                    s.category,
                    s.description,
                    COUNT(ta.id) as assignment_count
                FROM teacher_assignments ta
                JOIN subjects s ON ta.subject_id = s.id
                WHERE ta.teacher_id = ?
                GROUP BY s.id, s.name, s.code, s.category, s.description
                ORDER BY s.name ASC
            ");
            $stmt->execute([$teacherId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching teacher subjects: ' . $e->getMessage());
        }
    }

    /**
     * Get teacher classes (unique classes assigned to teacher)
     */
    public function getTeacherClasses($teacherId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT
                    c.id,
                    c.name,
                    c.section,
                    c.academic_year,
                    c.capacity,
                    c.status,
                    COUNT(ta.id) as assignment_count
                FROM teacher_assignments ta
                JOIN classes c ON ta.class_id = c.id
                WHERE ta.teacher_id = ?
                GROUP BY c.id, c.name, c.section, c.academic_year, c.capacity, c.status
                ORDER BY c.name ASC, c.section ASC
            ");
            $stmt->execute([$teacherId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching teacher classes: ' . $e->getMessage());
        }
    }
}
?> 