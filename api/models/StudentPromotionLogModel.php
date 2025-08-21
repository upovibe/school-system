<?php
// api/models/StudentPromotionLogModel.php - Model for student_promotion_logs table

require_once __DIR__ . '/../core/BaseModel.php';

class StudentPromotionLogModel extends BaseModel {
    protected static $table = 'student_promotion_logs';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'student_id',
        'from_class_id',
        'to_class_id',
        'promoted_by',
        'promotion_date',
        'notes'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'student_id' => 'integer',
        'from_class_id' => 'integer',
        'to_class_id' => 'integer',
        'promoted_by' => 'integer',
        'promotion_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Create a new promotion log entry
     * 
     * @param array $data
     * @return bool
     */
    public function create($data) {
        $sql = "INSERT INTO {$this->getTableName()} (
            student_id, from_class_id, to_class_id, promoted_by, 
            promotion_date, notes, created_at, updated_at
        ) VALUES (
            :student_id, :from_class_id, :to_class_id, :promoted_by, 
            :promotion_date, :notes, NOW(), NOW()
        )";
        
        $stmt = $this->pdo->prepare($sql);
        
        return $stmt->execute([
            'student_id' => $data['student_id'],
            'from_class_id' => $data['from_class_id'],
            'to_class_id' => $data['to_class_id'],
            'promoted_by' => $data['promoted_by'],
            'promotion_date' => $data['promotion_date'],
            'notes' => $data['notes']
        ]);
    }
    
    /**
     * Get promotion history for a student
     * 
     * @param int $studentId
     * @return array
     */
    public function getByStudentId($studentId) {
        $sql = "SELECT * FROM {$this->getTableName()} WHERE student_id = :student_id ORDER BY promotion_date DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['student_id' => $studentId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get promotion history for a class
     * 
     * @param int $classId
     * @return array
     */
    public function getByClassId($classId) {
        $sql = "SELECT * FROM {$this->getTableName()} WHERE from_class_id = :class_id OR to_class_id = :class_id ORDER BY promotion_date DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['class_id' => $classId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all promotion logs with pagination
     * 
     * @param int $page
     * @param int $limit
     * @return array
     */
    public function getAll($page = 1, $limit = 50) {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT * FROM {$this->getTableName()} ORDER BY promotion_date DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get promotion count for a student
     * 
     * @param int $studentId
     * @return int
     */
    public function getCountByStudentId($studentId) {
        $sql = "SELECT COUNT(*) FROM {$this->getTableName()} WHERE student_id = :student_id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['student_id' => $studentId]);
        
        return (int)$stmt->fetchColumn();
    }
}
?>
