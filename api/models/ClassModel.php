<?php
// api/models/ClassModel.php - Model for classes table

require_once __DIR__ . '/../core/BaseModel.php';

class ClassModel extends BaseModel {
    protected static $table = 'classes';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'section',
        'academic_year',
        'capacity',
        'status'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'capacity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find class by name, section and academic year
     */
    public function findByUniqueKey($name, $section, $academicYear) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE name = ? AND section = ? AND academic_year = ?
            ");
            $stmt->execute([$name, $section, $academicYear]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error finding class by unique key: ' . $e->getMessage());
        }
    }

    /**
     * Find class by name and section (to check uniqueness within same class name)
     */
    public function findByNameAndSection($name, $section) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE UPPER(REPLACE(TRIM(name), ' ', '')) = UPPER(REPLACE(TRIM(?), ' ', ''))
                  AND UPPER(TRIM(section)) = UPPER(TRIM(?))
            ");
            $stmt->execute([$name, $section]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error finding class by name and section: ' . $e->getMessage());
        }
    }
    
    /**
     * Get active classes only
     */
    public function getActiveClasses() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE status = 'active' 
                ORDER BY name ASC, section ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active classes: ' . $e->getMessage());
        }
    }
    
    /**
     * Get classes by academic year
     */
    public function getClassesByAcademicYear($academicYear) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE academic_year = ? 
                ORDER BY name ASC, section ASC
            ");
            $stmt->execute([$academicYear]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching classes by academic year: ' . $e->getMessage());
        }
    }
    
    /**
     * Search classes by name, section, or academic year
     */
    public function searchClasses($query, $limit = null) {
        try {
            $sql = "
                SELECT * FROM {$this->getTableName()} 
                WHERE (name LIKE ? OR section LIKE ? OR academic_year LIKE ?)
                ORDER BY name ASC, section ASC
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
            throw new Exception('Error searching classes: ' . $e->getMessage());
        }
    }
    
    /**
     * Get classes with student counts
     */
    public function getClassesWithStudentCounts() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT c.*, COUNT(s.id) as student_count
                FROM {$this->getTableName()} c
                LEFT JOIN students s ON c.id = s.current_class_id
                GROUP BY c.id
                ORDER BY c.name ASC, c.section ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching classes with student counts: ' . $e->getMessage());
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
     * Get available sections
     */
    public function getAvailableSections() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT section 
                FROM {$this->getTableName()} 
                ORDER BY section ASC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            throw new Exception('Error fetching available sections: ' . $e->getMessage());
        }
    }
}
?> 