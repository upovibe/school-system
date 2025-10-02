<?php
// api/models/HouseModel.php - Model for houses table

require_once __DIR__ . '/../core/BaseModel.php';

class HouseModel extends BaseModel {
    protected static $table = 'houses';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'description'
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
     * Get all houses
     */
    public function getAllHouses() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
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
            throw new Exception('Error fetching houses: ' . $e->getMessage());
        }
    }

    /**
     * Get house with assigned teachers
     */
    public function getHouseWithTeachers($houseId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT h.*, 
                       COUNT(t.id) as teacher_count,
                       GROUP_CONCAT(
                           CONCAT(t.first_name, ' ', t.last_name) 
                           ORDER BY t.first_name, t.last_name 
                           SEPARATOR ', '
                       ) as teacher_names
                FROM {$this->getTableName()} h
                LEFT JOIN house_teachers ht ON h.id = ht.house_id
                LEFT JOIN teachers t ON ht.teacher_id = t.id
                WHERE h.id = ?
                GROUP BY h.id
            ");
            $stmt->execute([$houseId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result = $this->applyCasts($result);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching house with teachers: ' . $e->getMessage());
        }
    }

    /**
     * Get all houses with teacher counts
     */
    public function getAllWithTeacherCounts() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT h.*, 
                       COUNT(t.id) as teacher_count
                FROM {$this->getTableName()} h
                LEFT JOIN house_teachers ht ON h.id = ht.house_id
                LEFT JOIN teachers t ON ht.teacher_id = t.id
                GROUP BY h.id
                ORDER BY h.name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching houses with teacher counts: ' . $e->getMessage());
        }
    }

    /**
     * Get all houses with their assigned teachers
     */
    public function getAllWithTeachers() {
        try {
            // First get all houses with teacher counts
            $stmt = $this->pdo->prepare("
                SELECT h.*, 
                       COUNT(t.id) as teacher_count
                FROM {$this->getTableName()} h
                LEFT JOIN house_teachers ht ON h.id = ht.house_id
                LEFT JOIN teachers t ON ht.teacher_id = t.id
                GROUP BY h.id
                ORDER BY h.name ASC
            ");
            $stmt->execute();
            $houses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Then get teachers for each house
            foreach ($houses as &$house) {
                $teacherStmt = $this->pdo->prepare("
                    SELECT t.id, t.first_name, t.last_name, t.email, t.phone
                    FROM teachers t
                    JOIN house_teachers ht ON t.id = ht.teacher_id
                    WHERE ht.house_id = ?
                    ORDER BY t.first_name, t.last_name
                ");
                $teacherStmt->execute([$house['id']]);
                $teachers = $teacherStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Format teacher names
                $house['teachers'] = array_map(function($teacher) {
                    return [
                        'id' => $teacher['id'],
                        'name' => trim($teacher['first_name'] . ' ' . $teacher['last_name']),
                        'email' => $teacher['email'],
                        'phone' => $teacher['phone']
                    ];
                }, $teachers);
                
                // Apply casts
                $house = $this->applyCasts($house);
            }

            return $houses;
        } catch (PDOException $e) {
            throw new Exception('Error fetching houses with teachers: ' . $e->getMessage());
        }
    }

    /**
     * Get teachers assigned to a specific house
     */
    public function getHouseTeachers($houseId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT t.*, 
                       c.name as class_name,
                       c.section as class_section
                FROM teachers t
                INNER JOIN house_teachers ht ON t.id = ht.teacher_id
                LEFT JOIN classes c ON t.class_id = c.id
                WHERE ht.house_id = ?
                ORDER BY t.first_name, t.last_name
            ");
            $stmt->execute([$houseId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching house teachers: ' . $e->getMessage());
        }
    }

    /**
     * Check if house name already exists (excluding current house)
     */
    public function nameExists($name, $excludeId = null) {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->getTableName()} WHERE name = ?";
            $params = [$name];
            
            if ($excludeId) {
                $sql .= " AND id != ?";
                $params[] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception('Error checking house name: ' . $e->getMessage());
        }
    }

    /**
     * Get house statistics
     */
    public function getHouseStatistics() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    h.id,
                    h.name,
                    COUNT(t.id) as teacher_count,
                    COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_teachers,
                    COUNT(CASE WHEN t.status = 'inactive' THEN 1 END) as inactive_teachers
                FROM {$this->getTableName()} h
                LEFT JOIN house_teachers ht ON h.id = ht.house_id
                LEFT JOIN teachers t ON ht.teacher_id = t.id
                GROUP BY h.id, h.name
                ORDER BY h.name
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching house statistics: ' . $e->getMessage());
        }
    }

    /**
     * Assign teacher to house
     */
    public function assignTeacher($houseId, $teacherId) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO house_teachers (house_id, teacher_id) 
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE house_id = house_id
            ");
            return $stmt->execute([$houseId, $teacherId]);
        } catch (PDOException $e) {
            throw new Exception('Error assigning teacher to house: ' . $e->getMessage());
        }
    }

    /**
     * Remove teacher from house
     */
    public function removeTeacher($houseId, $teacherId) {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM house_teachers 
                WHERE house_id = ? AND teacher_id = ?
            ");
            return $stmt->execute([$houseId, $teacherId]);
        } catch (PDOException $e) {
            throw new Exception('Error removing teacher from house: ' . $e->getMessage());
        }
    }

    /**
     * Check if teacher is assigned to house
     */
    public function isTeacherAssigned($houseId, $teacherId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM house_teachers 
                WHERE house_id = ? AND teacher_id = ?
            ");
            $stmt->execute([$houseId, $teacherId]);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception('Error checking teacher assignment: ' . $e->getMessage());
        }
    }
}
?>
