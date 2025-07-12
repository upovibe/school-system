<?php
// api/models/ClassSubjectModel.php - Model for class_subjects table

require_once __DIR__ . '/../core/BaseModel.php';

class ClassSubjectModel extends BaseModel {
    protected static $table = 'class_subjects';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'class_id',
        'subject_id', 
        'teacher_id'
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
     * Find subjects by class
     */
    public static function findByClass($classId) {
        global $pdo;
        $sql = "
            SELECT cs.*, s.name as subject_name, s.is_core,
                   t.name as teacher_name, t.email as teacher_email
            FROM class_subjects cs
            LEFT JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN teachers tch ON cs.teacher_id = tch.id
            LEFT JOIN users t ON tch.user_id = t.id
            WHERE cs.class_id = ?
            ORDER BY s.name
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$classId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Find classes by subject
     */
    public static function findBySubject($subjectId) {
        global $pdo;
        $sql = "
            SELECT cs.*, c.section, l.name as level_name,
                   t.name as teacher_name, t.email as teacher_email
            FROM class_subjects cs
            LEFT JOIN classes c ON cs.class_id = c.id
            LEFT JOIN levels l ON c.level_id = l.id
            LEFT JOIN teachers tch ON cs.teacher_id = tch.id
            LEFT JOIN users t ON tch.user_id = t.id
            WHERE cs.subject_id = ?
            ORDER BY l.name, c.section
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$subjectId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Find assignments by teacher
     */
    public static function findByTeacher($teacherId) {
        global $pdo;
        $sql = "
            SELECT cs.*, s.name as subject_name, s.is_core,
                   c.section, l.name as level_name
            FROM class_subjects cs
            LEFT JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN classes c ON cs.class_id = c.id
            LEFT JOIN levels l ON c.level_id = l.id
            WHERE cs.teacher_id = ?
            ORDER BY l.name, c.section, s.name
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$teacherId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Check if class-subject assignment exists
     */
    public static function assignmentExists($classId, $subjectId) {
        global $pdo;
        $stmt = $pdo->prepare("SELECT id FROM " . static::$table . " WHERE class_id = ? AND subject_id = ?");
        $stmt->execute([$classId, $subjectId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }
}
?> 