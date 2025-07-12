<?php
// api/models/DepartmentModel.php - Model for departments table

require_once __DIR__ . '/../core/BaseModel.php';

class DepartmentModel extends BaseModel {
    protected static $table = 'departments';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'description',
        'head_teacher_id'
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
     * Find department by name
     */
    public static function findByName($name) {
        return static::where('name', $name)->first();
    }
    
    /**
     * Get departments with head teacher information
     */
    public function getWithHeadTeacher() {
        $sql = "
            SELECT d.*, 
                   u.name as head_teacher_name,
                   u.email as head_teacher_email
            FROM departments d
            LEFT JOIN teachers t ON d.head_teacher_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY d.name
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get teachers by department
     */
    public function getTeachersByDepartment($departmentId) {
        $sql = "
            SELECT t.*, u.name, u.email, u.phone
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