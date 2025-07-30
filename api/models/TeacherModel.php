<?php
// api/models/TeacherModel.php - Model for teachers table

require_once __DIR__ . '/../core/BaseModel.php';

class TeacherModel extends BaseModel {
    protected static $table = 'teachers';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'employee_id',
        'qualification',
        'specialization',
        'hire_date',
        'salary',
        'status'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'salary' => 'float',
        'hire_date' => 'date',
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
}
?> 