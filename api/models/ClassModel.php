<?php
// api/models/ClassModel.php

class ClassModel extends BaseModel {
    protected static $table = 'classes';
    protected static $primaryKey = 'id';
    protected static $fillable = [
        'level_id', 'section', 'teacher_id', 'track_id', 'school_id'
    ];
    
    public static function findByLevel($levelId) {
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM " . static::$table . " WHERE level_id = ?");
        $stmt->execute([$levelId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function findBySchool($schoolId) {
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM " . static::$table . " WHERE school_id = ?");
        $stmt->execute([$schoolId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function findByTeacher($teacherId) {
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM " . static::$table . " WHERE teacher_id = ?");
        $stmt->execute([$teacherId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function findByTrack($trackId) {
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM " . static::$table . " WHERE track_id = ?");
        $stmt->execute([$trackId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public static function findWithRelations($id) {
        global $pdo;
        $sql = "
            SELECT c.*, 
                   l.name as level_name,
                   t.name as teacher_name,
                   tr.name as track_name,
                   s.name as school_name
            FROM " . static::$table . " c
            LEFT JOIN levels l ON c.level_id = l.id
            LEFT JOIN teachers tch ON c.teacher_id = tch.id
            LEFT JOIN users t ON tch.user_id = t.id
            LEFT JOIN tracks tr ON c.track_id = tr.id
            LEFT JOIN schools s ON c.school_id = s.id
            WHERE c.id = ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public static function findWithSubjects($id) {
        global $pdo;
        $sql = "
            SELECT c.*, 
                   l.name as level_name,
                   t.name as teacher_name,
                   tr.name as track_name,
                   s.name as school_name,
                   GROUP_CONCAT(DISTINCT sub.name) as subjects
            FROM " . static::$table . " c
            LEFT JOIN levels l ON c.level_id = l.id
            LEFT JOIN teachers tch ON c.teacher_id = tch.id
            LEFT JOIN users t ON tch.user_id = t.id
            LEFT JOIN tracks tr ON c.track_id = tr.id
            LEFT JOIN schools s ON c.school_id = s.id
            LEFT JOIN class_subjects cs ON c.id = cs.class_id
            LEFT JOIN subjects sub ON cs.subject_id = sub.id
            WHERE c.id = ?
            GROUP BY c.id
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?> 