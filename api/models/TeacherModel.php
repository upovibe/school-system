<?php
// api/models/TeacherModel.php - Model for teachers table

require_once __DIR__ . '/../core/BaseModel.php';

class TeacherModel extends BaseModel {
    protected static $table = 'teachers';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'team_id',
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
        'status'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'user_id' => 'integer',
        'team_id' => 'integer',
        'date_of_birth' => 'date',
        'hire_date' => 'date',
        'salary' => 'float',
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
                SELECT t.*, u.name, u.email, u.status as user_status
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
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
                SELECT t.*, u.name, u.email, u.status as user_status
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
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
                SELECT t.*, u.name, u.email, u.status as user_status
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
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
                SELECT t.*, u.name, u.email, u.status as user_status, COUNT(ta.id) as assignment_count
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
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
                SELECT t.*, u.name, u.email, u.status as user_status
                FROM {$this->getTableName()} t
                LEFT JOIN users u ON t.user_id = u.id
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
                    COUNT(CASE WHEN hire_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN 1 END) as new_teachers
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

            // Insert teacher record
            $teacherSql = "INSERT INTO teachers (
                employee_id, first_name, last_name, email, phone, address,
                date_of_birth, gender, qualification, specialization, hire_date,
                salary, password, status, created_at, updated_at
            ) VALUES (
                :employee_id, :first_name, :last_name, :email, :phone, :address,
                :date_of_birth, :gender, :qualification, :specialization, :hire_date,
                :salary, :password, :status, :created_at, :updated_at
            )";

            $teacherStmt = $this->pdo->prepare($teacherSql);
            $teacherStmt->execute($data);
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
}
?> 