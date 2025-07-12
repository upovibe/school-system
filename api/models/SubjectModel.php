<?php
// api/models/SubjectModel.php

class SubjectModel extends BaseModel {
    protected static $table = 'subjects';
    protected static $primaryKey = 'id';
    protected static $fillable = [
        'name', 'level_id', 'department_id', 'is_core'
    ];
    
    public static function findByLevel($levelId) {
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM " . static::$table . " WHERE level_id = ?");
        $stmt->execute([$levelId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function findByDepartment($departmentId) {
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM " . static::$table . " WHERE department_id = ?");
        $stmt->execute([$departmentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function findCoreSubjects($levelId = null) {
        global $pdo;
        $sql = "SELECT * FROM " . static::$table . " WHERE is_core = 1";
        $params = [];
        
        if ($levelId) {
            $sql .= " AND level_id = ?";
            $params[] = $levelId;
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function findWithRelations($id) {
        global $pdo;
        $sql = "
            SELECT s.*, l.name as level_name, d.name as department_name
            FROM " . static::$table . " s
            LEFT JOIN levels l ON s.level_id = l.id
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE s.id = ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?> 