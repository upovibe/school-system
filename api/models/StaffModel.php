<?php
// api/models/StaffModel.php - Model for staff table

require_once __DIR__ . '/../core/BaseModel.php';

class StaffModel extends BaseModel {
    protected static $table = 'staff';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'position',
        'department',
        'hire_date',
        'bio'
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
     * Find staff by user ID
     */
    public static function findByUserId($userId) {
        return static::where('user_id', $userId)->first();
    }
    
    /**
     * Get staff with user information
     */
    public function getWithUserInfo($staffId = null) {
        $sql = "
            SELECT s.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM staff s
            JOIN users u ON s.user_id = u.id
        ";
        
        if ($staffId) {
            $sql .= " WHERE s.id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$staffId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $sql .= " ORDER BY u.name";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    /**
     * Get staff by user ID with full information
     */
    public function getByUserId($userId) {
        $sql = "
            SELECT s.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM staff s
            JOIN users u ON s.user_id = u.id
            WHERE s.user_id = ?
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get staff by department
     */
    public function getByDepartment($department) {
        $sql = "
            SELECT s.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM staff s
            JOIN users u ON s.user_id = u.id
            WHERE s.department = ?
            ORDER BY u.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$department]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get staff by position
     */
    public function getByPosition($position) {
        $sql = "
            SELECT s.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM staff s
            JOIN users u ON s.user_id = u.id
            WHERE s.position = ?
            ORDER BY u.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$position]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?> 