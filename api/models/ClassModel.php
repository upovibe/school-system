<?php
// api/models/ClassModel.php - Model for classes table

require_once __DIR__ . '/../core/BaseModel.php';

class ClassModel extends BaseModel {
    protected static $table = 'classes';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'section',
        'academic_year_id',
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
     * Get all classes with optional class teacher information (teacher assigned via teachers.class_id)
     */
    public function getAllWithClassTeacher() {
        try {
            $stmt = $this->pdo->prepare("\n                SELECT \n                    c.*, \n                    CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')) AS class_teacher_name,\n                    t.email AS class_teacher_email,\n                    t.gender AS class_teacher_gender\n                FROM {$this->getTableName()} c\n                LEFT JOIN teachers t ON t.class_id = c.id AND t.status = 'active'\n                ORDER BY c.name ASC, c.section ASC\n            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }

            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching classes with class teacher: ' . $e->getMessage());
        }
    }
    
    /**
     * Find class by name, section and academic year
     */
    public function findByUniqueKey($name, $section, $academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE name = ? AND section = ? AND academic_year_id = ?
            ");
            $stmt->execute([$name, $section, $academicYearId]);
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
     * Get classes by academic year ID
     */
    public function getClassesByAcademicYear($academicYearId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT c.*, ay.year_code, ay.display_name as academic_year_name
                FROM {$this->getTableName()} c
                JOIN academic_years ay ON c.academic_year_id = ay.id
                WHERE c.academic_year_id = ? 
                ORDER BY c.name ASC, c.section ASC
            ");
            $stmt->execute([$academicYearId]);
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
                SELECT c.*, ay.year_code, ay.display_name as academic_year_name
                FROM {$this->getTableName()} c
                JOIN academic_years ay ON c.academic_year_id = ay.id
                WHERE (c.name LIKE ? OR c.section LIKE ? OR ay.year_code LIKE ? OR ay.display_name LIKE ?)
                ORDER BY c.name ASC, c.section ASC
            ";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $searchTerm = "%{$query}%";
            $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
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
                SELECT id, year_code, display_name, start_date, end_date, is_active, is_current
                FROM academic_years 
                ORDER BY start_date DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
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