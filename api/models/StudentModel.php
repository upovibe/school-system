<?php
// api/models/StudentModel.php - Model for students table

require_once __DIR__ . '/../core/BaseModel.php';

class StudentModel extends BaseModel {
    protected static $table = 'students';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'student_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'date_of_birth',
        'gender',
        'admission_date',
        'current_class_id',
        'parent_name',
        'parent_phone',
        'parent_email',
        'emergency_contact',
        'emergency_phone',
        'blood_group',
        'medical_conditions',
        'password',
        'status',
        'profile_image'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'user_id' => 'integer',
        'date_of_birth' => 'date',
        'admission_date' => 'date',
        'current_class_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }

    /**
     * Find student by student ID
     */
    public function findByStudentId($studentId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE student_id = ?
            ");
            $stmt->execute([$studentId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error finding student by student ID: ' . $e->getMessage());
        }
    }

    /**
     * Get active students only
     */
    public function getActiveStudents() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT s.*, cs.name as class_name
                FROM {$this->getTableName()} s
                LEFT JOIN classes cs ON s.current_class_id = cs.id
                WHERE s.status = 'active'
                ORDER BY s.first_name ASC, s.last_name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
                        return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active students: ' . $e->getMessage());
        }
    }

    /**
     * Get students with class information
     */
    public function getStudentsWithClassInfo() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT s.*, c.name as class_name
                FROM {$this->getTableName()} s
                LEFT JOIN classes c ON s.current_class_id = c.id
                ORDER BY s.first_name ASC, s.last_name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching students with class info: ' . $e->getMessage());
        }
    }

    /**
     * Search students
     */
    public function searchStudents($query, $limit = null) {
        try {
            $sql = "
                SELECT s.*, c.name as class_name
                FROM {$this->getTableName()} s
                LEFT JOIN classes c ON s.current_class_id = c.id
                WHERE s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ?
                ORDER BY s.first_name ASC, s.last_name ASC
            ";
            
            if ($limit) {
                $sql .= " LIMIT ?";
            }
            
            $stmt = $this->pdo->prepare($sql);
            $searchTerm = "%{$query}%";
            $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
            
            if ($limit) {
                $params[] = $limit;
            }
            
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error searching students: ' . $e->getMessage());
        }
    }

    /**
     * Authenticate student login
     */
    public function authenticateStudent($studentId, $password) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE student_id = ? AND status = 'active'
            ");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($student && password_verify($password, $student['password'])) {
                // Remove password from response
                unset($student['password']);
                $student = $this->applyCasts($student);
                return $student;
            }
            
            return false;
        } catch (PDOException $e) {
            throw new Exception('Error authenticating student: ' . $e->getMessage());
        }
    }

    /**
     * Change student password
     */
    public function changePassword($studentId, $newPassword) {
        try {
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $stmt = $this->pdo->prepare("
                UPDATE {$this->getTableName()} 
                SET password = ?, updated_at = NOW() 
                WHERE student_id = ?
            ");
            $stmt->execute([$hashedPassword, $studentId]);
            
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw new Exception('Error changing password: ' . $e->getMessage());
        }
    }

    /**
     * Get students by class
     */
    public function getStudentsByClass($classId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT s.*, c.name as class_name, c.grade_level
                FROM {$this->getTableName()} s
                LEFT JOIN classes c ON s.current_class_id = c.id
                WHERE s.current_class_id = ? AND s.status = 'active'
                ORDER BY s.first_name ASC, s.last_name ASC
            ");
            $stmt->execute([$classId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching students by class: ' . $e->getMessage());
        }
    }

    /**
     * Check if student_id already exists
     */
    public function studentIdExists($studentId, $excludeId = null) {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->getTableName()} WHERE student_id = ?";
            $params = [$studentId];
            
            if ($excludeId) {
                $sql .= " AND id != ?";
                $params[] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception('Error checking student ID: ' . $e->getMessage());
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
     * Create student with user account and role assignment
     */
    public function createStudentWithUser($data) {
        try {
            $this->pdo->beginTransaction();

            // Hash the password
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Set default values
            $data['status'] = $data['status'] ?? 'active';
            $data['created_at'] = date('Y-m-d H:i:s');
            $data['updated_at'] = date('Y-m-d H:i:s');

            // Insert student record
            $studentSql = "INSERT INTO students (
                student_id, first_name, last_name, email, phone, address, 
                date_of_birth, gender, admission_date, current_class_id,
                parent_name, parent_phone, parent_email, emergency_contact,
                emergency_phone, blood_group, medical_conditions, password,
                status, created_at, updated_at
            ) VALUES (
                :student_id, :first_name, :last_name, :email, :phone, :address,
                :date_of_birth, :gender, :admission_date, :current_class_id,
                :parent_name, :parent_phone, :parent_email, :emergency_contact,
                :emergency_phone, :blood_group, :medical_conditions, :password,
                :status, :created_at, :updated_at
            )";

            $studentStmt = $this->pdo->prepare($studentSql);
            $studentStmt->execute($data);
            $studentId = $this->pdo->lastInsertId();

            // Get student role ID
            $roleSql = "SELECT id FROM roles WHERE name = 'student' LIMIT 1";
            $roleStmt = $this->pdo->prepare($roleSql);
            $roleStmt->execute();
            $role = $roleStmt->fetch(PDO::FETCH_ASSOC);

            if (!$role) {
                throw new Exception('Student role not found in roles table');
            }

            // Create user account with student role
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

            // Update student record with user_id
            $updateSql = "UPDATE students SET user_id = ? WHERE id = ?";
            $updateStmt = $this->pdo->prepare($updateSql);
            $updateStmt->execute([$userId, $studentId]);

            $this->pdo->commit();

            return [
                'student_id' => $studentId,
                'user_id' => $userId,
                'student_data' => $data
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new Exception('Error creating student with user account: ' . $e->getMessage());
        }
    }

    /**
     * Update student and corresponding user account
     */
    public function updateStudentWithUser($id, $data) {
        try {
            $this->pdo->beginTransaction();

            // Get current student data to find user_id
            $studentSql = "SELECT user_id FROM students WHERE id = ?";
            $studentStmt = $this->pdo->prepare($studentSql);
            $studentStmt->execute([$id]);
            $currentStudent = $studentStmt->fetch(PDO::FETCH_ASSOC);

            if (!$currentStudent) {
                throw new Exception('Student not found');
            }

            $data['updated_at'] = date('Y-m-d H:i:s');
            
            // If password is provided, hash it
            if (isset($data['password']) && !empty($data['password'])) {
                $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            } else {
                unset($data['password']); // Don't update password if not provided
            }

            // Update student record
            $setClause = [];
            $params = [];
            
            foreach ($data as $key => $value) {
                $setClause[] = "$key = :$key";
                $params[":$key"] = $value;
            }
            
            $params[':id'] = $id;

            $updateStudentSql = "UPDATE students SET " . implode(', ', $setClause) . " WHERE id = :id";
            $updateStudentStmt = $this->pdo->prepare($updateStudentSql);
            $updateStudentStmt->execute($params);

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
            
            $userParams[':user_id'] = $currentStudent['user_id'];

            $updateUserSql = "UPDATE users SET " . implode(', ', $userSetClause) . " WHERE id = :user_id";
            $updateUserStmt = $this->pdo->prepare($updateUserSql);
            $updateUserStmt->execute($userParams);

            $this->pdo->commit();

            return true;

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            throw new Exception('Error updating student with user account: ' . $e->getMessage());
        }
    }
}
?> 