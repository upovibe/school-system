<?php
// api/models/SubjectModel.php - Model for subjects table

require_once __DIR__ . '/../core/BaseModel.php';

class SubjectModel extends BaseModel {
    protected static $table = 'subjects';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'code',
        'description',
        'status'
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
     * Find subject by code
     */
    public function findByCode($code) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE code = ?
            ");
            $stmt->execute([$code]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error finding subject by code: ' . $e->getMessage());
        }
    }
    
    /**
     * Get active subjects only
     */
    public function getActiveSubjects() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE status = 'active' 
                ORDER BY name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active subjects: ' . $e->getMessage());
        }
    }
    
    /**
     * Search subjects by name or code
     */
    public function searchSubjects($query, $limit = null) {
        try {
            $sql = "
                SELECT * FROM {$this->getTableName()} 
                WHERE (name LIKE ? OR code LIKE ? OR description LIKE ?)
                ORDER BY name ASC
            ";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $searchTerm = "%{$query}%";
            $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error searching subjects: ' . $e->getMessage());
        }
    }
    
    /**
     * Get subjects with class assignment counts
     */
    public function getSubjectsWithClassCounts() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT s.*, COUNT(cs.id) as class_count
                FROM {$this->getTableName()} s
                LEFT JOIN class_subjects cs ON s.id = cs.subject_id
                GROUP BY s.id
                ORDER BY s.name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching subjects with class counts: ' . $e->getMessage());
        }
    }
}
?> 