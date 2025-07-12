<?php
// api/models/StudentModel.php - Model for students table

require_once __DIR__ . '/../core/BaseModel.php';

class StudentModel extends BaseModel {
    protected static $table = 'students';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'admission_number',
        'current_class_id',
        'enrollment_date',
        'guardian_name',
        'guardian_phone',
        'guardian_email',
        'address',
        'emergency_contact',
        'emergency_phone'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'enrollment_date' => 'date'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find student by user ID
     */
    public static function findByUserId($userId) {
        return static::where('user_id', $userId)->first();
    }
    
    /**
     * Find student by admission number
     */
    public static function findByAdmissionNumber($admissionNumber) {
        return static::where('admission_number', $admissionNumber)->first();
    }
    
    /**
     * Get students with user information
     */
    public function getWithUserInfo($studentId = null) {
        $sql = "
            SELECT s.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM students s
            JOIN users u ON s.user_id = u.id
        ";
        
        if ($studentId) {
            $sql .= " WHERE s.id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$studentId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $sql .= " ORDER BY u.name";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    /**
     * Get student by user ID with full information
     */
    public function getByUserId($userId) {
        $sql = "
            SELECT s.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.user_id = ?
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get student by admission number with full information
     */
    public function getByAdmissionNumber($admissionNumber) {
        $sql = "
            SELECT s.*, 
                   u.name, u.email, u.phone, u.gender, u.profile_image
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.admission_number = ?
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$admissionNumber]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get parents for a student
     */
    public function getParents($studentId) {
        $sql = "
            SELECT p.*, 
                   u.name, u.email, u.phone,
                   ps.relationship, ps.is_primary_contact
            FROM parent_student ps
            JOIN parents p ON ps.parent_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE ps.student_id = ?
            ORDER BY ps.is_primary_contact DESC, u.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?> 