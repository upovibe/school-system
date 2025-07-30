<?php
// api/models/ClassSubjectModel.php - Model for class_subjects table

require_once __DIR__ . '/../core/BaseModel.php';

class ClassSubjectModel extends BaseModel {
    protected static $table = 'class_subjects';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'class_id',
        'subject_id',
        'academic_year',
        'term',
        'teaching_hours'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'id' => 'integer',
        'class_id' => 'integer',
        'subject_id' => 'integer',
        'teaching_hours' => 'integer',
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
    public function findByUniqueKey($classId, $subjectId, $academicYear) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE class_id = ? AND subject_id = ? AND academic_year = ?
            ");
            $stmt->execute([$classId, $subjectId, $academicYear]);
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
            
            if (!empty($filters['academic_year'])) {
                $sql .= " AND cs.academic_year = ?";
                $params[] = $filters['academic_year'];
            }
            
            if (!empty($filters['term'])) {
                $sql .= " AND cs.term = ?";
                $params[] = $filters['term'];
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
                       s.name as subject_name, s.code as subject_code
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
     * Get class subjects by academic year
     */
    public function getByAcademicYear($academicYear) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT cs.*, 
                       c.name as class_name, c.section as class_section,
                       s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} cs
                LEFT JOIN classes c ON cs.class_id = c.id
                LEFT JOIN subjects s ON cs.subject_id = s.id
                WHERE cs.academic_year = ?
                ORDER BY c.name ASC, c.section ASC, s.name ASC
            ");
            $stmt->execute([$academicYear]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching class subjects by academic year: ' . $e->getMessage());
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
     * Get available academic years
     */
    public function getAvailableAcademicYears() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT academic_year 
                FROM {$this->getTableName()} 
                ORDER BY academic_year DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            throw new Exception('Error fetching available academic years: ' . $e->getMessage());
        }
    }
    
    /**
     * Get available terms
     */
    public function getAvailableTerms() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT term 
                FROM {$this->getTableName()} 
                ORDER BY term ASC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            throw new Exception('Error fetching available terms: ' . $e->getMessage());
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
                    COUNT(DISTINCT subject_id) as total_subjects,
                    COUNT(DISTINCT academic_year) as total_academic_years
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