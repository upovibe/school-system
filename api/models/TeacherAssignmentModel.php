<?php
// api/models/TeacherAssignmentModel.php - Model for teacher_assignments table

require_once __DIR__ . '/../core/BaseModel.php';

class TeacherAssignmentModel extends BaseModel {
    protected static $table = 'teacher_assignments';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'teacher_id',
        'class_id',
        'subject_id',
        'status'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'id' => 'integer',
        'teacher_id' => 'integer',
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
     * Find teacher assignment by unique combination
     */
    public function findByUniqueKey($teacherId, $classId, $subjectId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE teacher_id = ? AND class_id = ? AND subject_id = ?
            ");
            $stmt->execute([$teacherId, $classId, $subjectId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error finding teacher assignment by unique key: ' . $e->getMessage());
        }
    }

    /**
     * Get teacher assignments with teacher, class, and subject details
     */
    public function getWithDetails($filters = []) {
        try {
            $sql = "
                SELECT ta.*, 
                       t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.employee_id,
                       c.name as class_name, c.section as class_section,
                       s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} ta
                LEFT JOIN teachers t ON ta.teacher_id = t.id
                LEFT JOIN classes c ON ta.class_id = c.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                WHERE 1=1
            ";
            
            $params = [];
            
            if (!empty($filters['teacher_id'])) {
                $sql .= " AND ta.teacher_id = ?";
                $params[] = $filters['teacher_id'];
            }
            if (!empty($filters['class_id'])) {
                $sql .= " AND ta.class_id = ?";
                $params[] = $filters['class_id'];
            }
            if (!empty($filters['subject_id'])) {
                $sql .= " AND ta.subject_id = ?";
                $params[] = $filters['subject_id'];
            }
            if (!empty($filters['status'])) {
                $sql .= " AND ta.status = ?";
                $params[] = $filters['status'];
            }
            $sql .= " ORDER BY t.last_name ASC, c.name ASC, c.section ASC, s.name ASC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching teacher assignments with details: ' . $e->getMessage());
        }
    }

    /**
     * Get assignments by teacher ID
     */
    public function getByTeacherId($teacherId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ta.*, c.name as class_name, c.section as class_section, s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} ta
                LEFT JOIN classes c ON ta.class_id = c.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                WHERE ta.teacher_id = ?
                ORDER BY c.name ASC, c.section ASC, s.name ASC
            ");
            $stmt->execute([$teacherId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching assignments by teacher ID: ' . $e->getMessage());
        }
    }

    /**
     * Get assignments by class ID
     */
    public function getByClassId($classId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ta.*, t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.employee_id, s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} ta
                LEFT JOIN teachers t ON ta.teacher_id = t.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                WHERE ta.class_id = ?
                ORDER BY t.last_name ASC, s.name ASC
            ");
            $stmt->execute([$classId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching assignments by class ID: ' . $e->getMessage());
        }
    }

    /**
     * Get assignments by subject ID
     */
    public function getBySubjectId($subjectId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ta.*, t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.employee_id, c.name as class_name, c.section as class_section
                FROM {$this->getTableName()} ta
                LEFT JOIN teachers t ON ta.teacher_id = t.id
                LEFT JOIN classes c ON ta.class_id = c.id
                WHERE ta.subject_id = ?
                ORDER BY t.last_name ASC, c.name ASC, c.section ASC
            ");
            $stmt->execute([$subjectId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching assignments by subject ID: ' . $e->getMessage());
        }
    }

    /**
     * Search teacher assignments
     */
    public function searchAssignments($query, $limit = null) {
        try {
            $sql = "
                SELECT ta.*, t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.employee_id,
                       c.name as class_name, c.section as class_section,
                       s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} ta
                LEFT JOIN teachers t ON ta.teacher_id = t.id
                LEFT JOIN classes c ON ta.class_id = c.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                WHERE (t.first_name LIKE ? OR t.last_name LIKE ? OR t.employee_id LIKE ? OR c.name LIKE ? OR c.section LIKE ? OR s.name LIKE ? OR s.code LIKE ?)
                ORDER BY t.last_name ASC, c.name ASC, c.section ASC, s.name ASC
            ";
            if ($limit) {
                $sql .= " LIMIT ?";
            }
            $searchTerm = "%{$query}%";
            $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm];
            if ($limit) {
                $params[] = $limit;
            }
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error searching teacher assignments: ' . $e->getMessage());
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
                    COUNT(DISTINCT teacher_id) as total_teachers,
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

    /**
     * Get assignments by teacher and class
     */
    public function getByTeacherAndClass($teacherId, $classId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ta.*, 
                       t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.employee_id,
                       c.name as class_name, c.section as class_section,
                       s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} ta
                LEFT JOIN teachers t ON ta.teacher_id = t.id
                LEFT JOIN classes c ON ta.class_id = c.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                WHERE ta.teacher_id = ? AND ta.class_id = ?
                ORDER BY s.name ASC
            ");
            $stmt->execute([$teacherId, $classId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching assignments by teacher and class: ' . $e->getMessage());
        }
    }

    /**
     * Delete assignments by teacher and class
     */
    public function deleteByTeacherAndClass($teacherId, $classId) {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM {$this->getTableName()} 
                WHERE teacher_id = ? AND class_id = ?
            ");
            $stmt->execute([$teacherId, $classId]);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw new Exception('Error deleting assignments by teacher and class: ' . $e->getMessage());
        }
    }

    /**
     * Get assignment by teacher, class, and subject
     */
    public function getByTeacherClassAndSubject($teacherId, $classId, $subjectId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT ta.*, 
                       t.first_name as teacher_first_name, t.last_name as teacher_last_name, t.employee_id,
                       c.name as class_name, c.section as class_section,
                       s.name as subject_name, s.code as subject_code
                FROM {$this->getTableName()} ta
                LEFT JOIN teachers t ON ta.teacher_id = t.id
                LEFT JOIN classes c ON ta.class_id = c.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                WHERE ta.teacher_id = ? AND ta.class_id = ? AND ta.subject_id = ?
            ");
            $stmt->execute([$teacherId, $classId, $subjectId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $result = $this->applyCasts($result);
            }
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching assignment by teacher, class, and subject: ' . $e->getMessage());
        }
    }

    /**
     * Delete assignment by teacher, class, and subject
     */
    public function deleteByTeacherClassAndSubject($teacherId, $classId, $subjectId) {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM {$this->getTableName()} 
                WHERE teacher_id = ? AND class_id = ? AND subject_id = ?
            ");
            $stmt->execute([$teacherId, $classId, $subjectId]);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw new Exception('Error deleting assignment by teacher, class, and subject: ' . $e->getMessage());
        }
    }
}
?>