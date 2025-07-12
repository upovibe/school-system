<?php
// api/models/ParentModel.php - Model for parents table

require_once __DIR__ . '/../core/BaseModel.php';

class ParentModel extends BaseModel {
    protected static $table = 'parents';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'occupation',
        'workplace',
        'relationship_to_student'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find parent by user ID
     */
    public static function findByUserId($userId) {
        return static::where('user_id', $userId)->first();
    }
    
    /**
     * Get parents with user information
     */
    public function getWithUserInfo($parentId = null) {
        $sql = "
            SELECT p.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM parents p
            JOIN users u ON p.user_id = u.id
        ";
        
        if ($parentId) {
            $sql .= " WHERE p.id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$parentId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $sql .= " ORDER BY u.name";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    /**
     * Get parent by user ID with full information
     */
    public function getByUserId($userId) {
        $sql = "
            SELECT p.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM parents p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get students for a parent
     */
    public function getStudents($parentId) {
        $sql = "
            SELECT s.*, 
                   u.name, u.email, u.phone, u.gender,
                   ps.relationship, ps.is_primary_contact
            FROM parent_student ps
            JOIN students s ON ps.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE ps.parent_id = ?
            ORDER BY u.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$parentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Link parent to student
     */
    public function linkToStudent($parentId, $studentId, $relationship = null, $isPrimaryContact = false) {
        $sql = "
            INSERT INTO parent_student (parent_id, student_id, relationship, is_primary_contact)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            relationship = VALUES(relationship),
            is_primary_contact = VALUES(is_primary_contact)
        ";
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$parentId, $studentId, $relationship, $isPrimaryContact]);
    }
    
    /**
     * Unlink parent from student
     */
    public function unlinkFromStudent($parentId, $studentId) {
        $sql = "DELETE FROM parent_student WHERE parent_id = ? AND student_id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$parentId, $studentId]);
    }
}
?> 