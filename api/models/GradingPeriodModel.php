<?php
// api/models/GradingPeriodModel.php - Model for grading_periods table

require_once __DIR__ . '/../core/BaseModel.php';

class GradingPeriodModel extends BaseModel {
    protected static $table = 'grading_periods';
    
    protected static $fillable = [
        'name', 'academic_year_id', 'start_date', 'end_date', 
        'is_active', 'description', 'created_by'
    ];
    
    protected static $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'created_by' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get active grading period
     */
    public function getActivePeriod() {
        $sql = "SELECT * FROM grading_periods WHERE is_active = 1 ORDER BY start_date DESC LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get all grading periods with creator info
     */
    public function getAllPeriodsWithCreator() {
        $sql = "
            SELECT 
                gp.*,
                u.name as creator_name,
                u.email as creator_email,
                ay.year_code AS academic_year,
                ay.display_name as academic_year_display_name
            FROM grading_periods gp
            LEFT JOIN users u ON gp.created_by = u.id
            LEFT JOIN academic_years ay ON gp.academic_year_id = ay.id
            ORDER BY ay.start_date DESC, gp.start_date DESC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get grading period by ID with creator info
     */
    public function getPeriodWithCreator($id) {
        $sql = "
            SELECT 
                gp.*,
                u.name as creator_name,
                u.email as creator_email
            FROM grading_periods gp
            LEFT JOIN users u ON gp.created_by = u.id
            WHERE gp.id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get periods by academic year
     */
    public function getPeriodsByAcademicYear($academicYearId) {
        $sql = "
            SELECT * FROM grading_periods 
            WHERE academic_year_id = ? 
            ORDER BY start_date ASC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$academicYearId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get current academic year periods
     */
    public function getCurrentAcademicYearPeriods() {
        try {
            // Get the current academic year from the database
            $sql = "SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $currentYear = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($currentYear) {
                return $this->getPeriodsByAcademicYear($currentYear['id']);
            } else {
                // Fallback: get the most recent active academic year
                $sql = "SELECT id FROM academic_years WHERE is_active = 1 ORDER BY start_date DESC LIMIT 1";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
                $activeYear = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($activeYear) {
                    return $this->getPeriodsByAcademicYear($activeYear['id']);
                } else {
                    return [];
                }
            }
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Get available academic years
     */
    public function getAvailableAcademicYears() {
        $sql = "
            SELECT id, year_code, display_name, start_date, end_date, is_active, is_current
            FROM academic_years 
            ORDER BY start_date DESC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Deactivate all periods
     */
    public function deactivateAllPeriods() {
        $sql = "UPDATE grading_periods SET is_active = 0";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute();
    }

    /**
     * Activate a specific period
     */
    public function activatePeriod($periodId) {
        // First deactivate all periods
        $this->deactivateAllPeriods();
        
        // Then activate the specified period
        $sql = "UPDATE grading_periods SET is_active = 1 WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$periodId]);
    }

    /**
     * Check if period is currently active
     */
    public function isPeriodActive($periodId) {
        $sql = "SELECT is_active FROM grading_periods WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$periodId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result && $result['is_active'] == 1;
    }

    /**
     * Get periods that are currently running (between start and end dates)
     */
    public function getCurrentRunningPeriods() {
        $currentDate = date('Y-m-d');
        $sql = "
            SELECT * FROM grading_periods 
            WHERE start_date <= ? AND end_date >= ?
            ORDER BY start_date ASC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$currentDate, $currentDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get upcoming periods
     */
    public function getUpcomingPeriods() {
        $currentDate = date('Y-m-d');
        $sql = "
            SELECT * FROM grading_periods 
            WHERE start_date > ?
            ORDER BY start_date ASC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$currentDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get completed periods
     */
    public function getCompletedPeriods() {
        $currentDate = date('Y-m-d');
        $sql = "
            SELECT * FROM grading_periods 
            WHERE end_date < ?
            ORDER BY end_date DESC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$currentDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Validate period dates
     */
    public function validatePeriodDates($startDate, $endDate) {
        if (strtotime($startDate) >= strtotime($endDate)) {
            return false; // Start date must be before end date
        }
        return true;
    }

    /**
     * Check for overlapping periods
     */
    public function hasOverlappingPeriods($startDate, $endDate, $excludeId = null) {
        $sql = "
            SELECT COUNT(*) as count 
            FROM grading_periods 
            WHERE (
                (start_date <= ? AND end_date >= ?) OR
                (start_date <= ? AND end_date >= ?) OR
                (start_date >= ? AND end_date <= ?)
            )
        ";
        
        if ($excludeId) {
            $sql .= " AND id != ?";
        }
        
        $stmt = $this->pdo->prepare($sql);
        $params = [$startDate, $startDate, $endDate, $endDate, $startDate, $endDate];
        
        if ($excludeId) {
            $params[] = $excludeId;
        }
        
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }

    /**
     * Get period statistics
     */
    public function getPeriodStatistics($periodId) {
        $sql = "
            SELECT 
                COUNT(*) as total_grades,
                AVG(final_percentage) as average_percentage,
                MIN(final_percentage) as lowest_grade,
                MAX(final_percentage) as highest_grade
            FROM student_grades 
            WHERE grading_period_id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$periodId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
