<?php
// api/models/AcademicYearModel.php - Model for academic_years table

require_once __DIR__ . '/../core/BaseModel.php';

class AcademicYearModel extends BaseModel {
    protected static $table = 'academic_years';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'year_code',
        'display_name',
        'start_date',
        'end_date',
        'switch_date',
        'is_active',
        'is_current',
        'status',
        'archive_date'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'is_current' => 'boolean',
        'archive_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether to use timestamps
    protected static $timestamps = true;
    
    /**
     * Get current academic year
     */
    public function getCurrentAcademicYear() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE is_current = 1 AND status = 'active'
                LIMIT 1
            ");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return $this->applyCasts($result);
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception('Error getting current academic year: ' . $e->getMessage());
        }
    }
    
    /**
     * Get active academic years
     */
    public function getActiveAcademicYears() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE status = 'active'
                ORDER BY start_date DESC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error getting active academic years: ' . $e->getMessage());
        }
    }
    
    /**
     * Set academic year as current
     */
    public function setAsCurrent($id) {
        try {
            // First, remove current flag from all academic years
            $stmt = $this->pdo->prepare("
                UPDATE {$this->getTableName()} 
                SET is_current = 0, updated_at = NOW()
                WHERE is_current = 1
            ");
            $stmt->execute();
            
            // Then set the specified year as current
            $stmt = $this->pdo->prepare("
                UPDATE {$this->getTableName()} 
                SET is_current = 1, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            
            return true;
        } catch (PDOException $e) {
            throw new Exception('Error setting academic year as current: ' . $e->getMessage());
        }
    }
    
    /**
     * Archive an academic year (mark as archived and set archive date)
     */
    public function archiveAcademicYear($id) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE {$this->getTableName()} 
                SET status = 'archived', 
                    is_active = 0, 
                    is_current = 0,
                    archive_date = NOW(),
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            
            return true;
        } catch (PDOException $e) {
            throw new Exception('Error archiving academic year: ' . $e->getMessage());
        }
    }
    
    /**
     * Get academic years for dropdown/selection
     */
    public function getForSelection() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT id, year_code, display_name, is_current, status
                FROM {$this->getTableName()} 
                WHERE status IN ('active', 'inactive')
                ORDER BY start_date DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching academic years for selection: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if academic year exists
     */
    public function yearExists($yearCode) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count 
                FROM {$this->getTableName()} 
                WHERE year_code = ?
            ");
            $stmt->execute([$yearCode]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['count'] > 0;
        } catch (PDOException $e) {
            throw new Exception('Error checking if academic year exists: ' . $e->getMessage());
        }
    }
    
    /**
     * Get academic year by date range
     */
    public function getByDateRange($startDate, $endDate) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE start_date <= ? AND end_date >= ? AND status = 'active'
                ORDER BY start_date DESC
            ");
            $stmt->execute([$startDate, $endDate]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching academic year by date range: ' . $e->getMessage());
        }
    }
}
?>
