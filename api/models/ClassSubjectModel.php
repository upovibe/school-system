<?php
// api/models/ClassSubjectModel.php - Model for class_subjects table

require_once __DIR__ . '/../core/BaseModel.php';

class ClassSubjectModel extends BaseModel {
    protected static $table = 'class_subjects';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'class_id',
        'subject_id'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'id' => 'integer',
        'class_id' => 'integer',
        'subject_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find class subject by unique combination
     */
    public function findByUniqueKey($classId, $subjectId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE class_id = ? AND subject_id = ?
            ");
            $stmt->execute([$classId, $subjectId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error finding class subject by unique key: ' . $e->getMessage());
        }
    }
    
    /**
     * Get class subjects with class and subject details
     */
    public function getWithDetails($filters = []) {
        try {
            $sql = "
                SELECT cs.*, 
                       c.name as class_name, c.section as class_section,
                       s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} cs
                LEFT JOIN classes c ON cs.class_id = c.id
                LEFT JOIN subjects s ON cs.subject_id = s.id
                WHERE 1=1
            ";
            
            $params = [];
            
            if (!empty($filters['class_id'])) {
                $sql .= " AND cs.class_id = ?";
                $params[] = $filters['class_id'];
            }
            
            if (!empty($filters['subject_id'])) {
                $sql .= " AND cs.subject_id = ?";
                $params[] = $filters['subject_id'];
            }
            

            

            
            $sql .= " ORDER BY c.name ASC, c.section ASC, s.name ASC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching class subjects with details: ' . $e->getMessage());
        }
    }
    
    /**
     * Get class subjects by class ID
     */
    public function getByClassId($classId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT cs.*, 
                       s.name as subject_name, s.code as subject_code, s.category as subject_category
                FROM {$this->getTableName()} cs
                LEFT JOIN subjects s ON cs.subject_id = s.id
                WHERE cs.class_id = ?
                ORDER BY s.name ASC
            ");
            $stmt->execute([$classId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching class subjects by class ID: ' . $e->getMessage());
        }
    }
    
    /**
     * Get class subjects by subject ID
     */
    public function getBySubjectId($subjectId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT cs.*, 
                       c.name as class_name, c.section as class_section
                FROM {$this->getTableName()} cs
                LEFT JOIN classes c ON cs.class_id = c.id
                WHERE cs.subject_id = ?
                ORDER BY c.name ASC, c.section ASC
            ");
            $stmt->execute([$subjectId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching class subjects by subject ID: ' . $e->getMessage());
        }
    }
    

    
    /**
     * Search class subjects
     */
    public function searchClassSubjects($query, $limit = null) {
        try {
            $sql = "
                SELECT cs.*, 
                       c.name as class_name, c.section as class_section,
                       s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} cs
                LEFT JOIN classes c ON cs.class_id = c.id
                LEFT JOIN subjects s ON cs.subject_id = s.id
                WHERE (c.name LIKE ? OR c.section LIKE ? OR s.name LIKE ? OR s.code LIKE ?)
                ORDER BY c.name ASC, c.section ASC, s.name ASC
            ";
            
            if ($limit) {
                $sql .= " LIMIT ?";
            }
            
            $searchTerm = "%{$query}%";
            $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
            
            if ($limit) {
                $params[] = $limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error searching class subjects: ' . $e->getMessage());
        }
    }
    

    
    /**
     * Delete class subject by class ID and subject ID
     */
    public function deleteByClassAndSubject($classId, $subjectId) {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM {$this->getTableName()} 
                WHERE class_id = ? AND subject_id = ?
            ");
            $stmt->execute([$classId, $subjectId]);
            
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw new Exception('Error deleting class subject: ' . $e->getMessage());
        }
    }

    /**
     * Find all class subjects for a specific class
     */
    public function findByClass($classId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT cs.*, 
                       c.name as class_name, c.section as class_section,
                       s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} cs
                LEFT JOIN classes c ON cs.class_id = c.id
                LEFT JOIN subjects s ON cs.subject_id = s.id
                WHERE cs.class_id = ?
                ORDER BY s.name ASC
            ");
            $stmt->execute([$classId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching class subjects by class ID: ' . $e->getMessage());
        }
    }

    /**
     * Delete all class subjects for a specific class
     */
    public function deleteByClass($classId) {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM {$this->getTableName()} 
                WHERE class_id = ?
            ");
            $stmt->execute([$classId]);
            
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw new Exception('Error deleting class subjects by class: ' . $e->getMessage());
        }
    }

    /**
     * Get statistics
     */
    public function getStatistics() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) as total_assignments,
                    COUNT(DISTINCT class_id) as total_classes,
                    COUNT(DISTINCT subject_id) as total_subjects
                FROM {$this->getTableName()}
            ");
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching statistics: ' . $e->getMessage());
        }
    }
}
?> 