<?php
// api/models/TeacherModel.php - Model for teachers table

require_once __DIR__ . '/../core/BaseModel.php';

class TeacherModel extends BaseModel {
    protected static $table = 'teachers';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'department_id',
        'hire_date',
        'bio',
        'qualification',
        'specialization'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'hire_date' => 'date'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find teacher by user ID
     */
    public static function findByUserId($userId) {
        return static::where('user_id', $userId)->first();
    }
    
    /**
     * Get teachers with user information
     */
    public function getWithUserInfo($teacherId = null) {
        $sql = "
            SELECT t.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image,
                   d.name as department_name
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN departments d ON t.department_id = d.id
        ";
        
        if ($teacherId) {
            $sql .= " WHERE t.id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$teacherId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $sql .= " ORDER BY u.name";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    /**
     * Get teacher by user ID with full information
     */
    public function getByUserId($userId) {
        $sql = "
            SELECT t.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image,
                   d.name as department_name
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN departments d ON t.department_id = d.id
            WHERE t.user_id = ?
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get teachers by department
     */
    public function getByDepartment($departmentId) {
        $sql = "
            SELECT t.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE t.department_id = ?
            ORDER BY u.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$departmentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?> 