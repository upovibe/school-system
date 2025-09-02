<?php
// api/models/TimetableResourceModel.php - Model for timetable_resources table

require_once __DIR__ . '/../core/BaseModel.php';

class TimetableResourceModel extends BaseModel {
    protected static $table = 'timetable_resources';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'title',
        'class_id',
        'attachment_file',
        'created_by'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'id' => 'integer',
        'class_id' => 'integer',
        'created_by' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Get timetable resources for a specific class
     */
    public function getByClass($classId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT tr.*, c.name as class_name, c.section as class_section,
                       u.name as creator_name, u.email as creator_email
                FROM {$this->getTableName()} tr
                LEFT JOIN classes c ON tr.class_id = c.id
                LEFT JOIN users u ON tr.created_by = u.id
                WHERE tr.class_id = ?
                ORDER BY tr.created_at DESC
            ");
            $stmt->execute([$classId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching timetable resources by class: ' . $e->getMessage());
        }
    }
    
    /**
     * Get all timetable resources with class and creator information
     */
    public function getAllWithClassInfo() {
        try {
            $stmt = $this->pdo->query("
                SELECT tr.*, c.name as class_name, c.section as class_section,
                       u.name as creator_name, u.email as creator_email
                FROM {$this->getTableName()} tr
                LEFT JOIN classes c ON tr.class_id = c.id
                LEFT JOIN users u ON tr.created_by = u.id
                ORDER BY tr.created_at DESC
            ");
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching all timetable resources: ' . $e->getMessage());
        }
    }
    
    /**
     * Get timetable resource by ID with class and creator information
     */
    public function getByIdWithClassInfo($id) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT tr.*, c.name as class_name, c.section as class_section,
                       u.name as creator_name, u.email as creator_email
                FROM {$this->getTableName()} tr
                LEFT JOIN classes c ON tr.class_id = c.id
                LEFT JOIN users u ON tr.created_by = u.id
                WHERE tr.id = ?
            ");
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching timetable resource by ID: ' . $e->getMessage());
        }
    }
    
    /**
     * Get timetable resources by creator
     */
    public function getByCreator($creatorId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT tr.*, c.name as class_name, c.section as class_section
                FROM {$this->getTableName()} tr
                LEFT JOIN classes c ON tr.class_id = c.id
                WHERE tr.created_by = ?
                ORDER BY tr.created_at DESC
            ");
            $stmt->execute([$creatorId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching timetable resources by creator: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if a class already has a timetable resource
     */
    public function classHasResource($classId, $excludeId = null) {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->getTableName()} WHERE class_id = ?";
            $params = [$classId];
            
            if ($excludeId !== null) {
                $sql .= " AND id != ?";
                $params[] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $count = $stmt->fetchColumn();
            
            return $count > 0;
        } catch (PDOException $e) {
            throw new Exception('Error checking if class has resource: ' . $e->getMessage());
        }
    }
    
    /**
     * Find timetable resource by filename
     */
    public function findByFilename($filename) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT tr.*, c.name as class_name, c.section as class_section,
                       u.name as creator_name, u.email as creator_email
                FROM {$this->getTableName()} tr
                LEFT JOIN classes c ON tr.class_id = c.id
                LEFT JOIN users u ON tr.created_by = u.id
                WHERE tr.attachment_file LIKE ?
                LIMIT 1
            ");
            $stmt->execute(['%' . $filename]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error finding timetable resource by filename: ' . $e->getMessage());
        }
    }
    
}
?>
