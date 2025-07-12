<?php
// api/models/TermModel.php - Model for terms table

require_once __DIR__ . '/../core/BaseModel.php';

class TermModel extends BaseModel {
    protected static $table = 'terms';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'academic_year_id',
        'number',
        'name',
        'start_date',
        'end_date',
        'break_start',
        'break_end',
        'is_active'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'break_start' => 'date',
        'break_end' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Get terms by academic year
     */
    public function getByAcademicYear($academicYearId) {
        $sql = "SELECT * FROM terms WHERE academic_year_id = ? ORDER BY number ASC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$academicYearId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get active term
     */
    public function getActiveTerm() {
        $sql = "SELECT t.*, ay.name as academic_year_name 
                FROM terms t 
                JOIN academic_years ay ON t.academic_year_id = ay.id 
                WHERE t.is_active = 1 
                LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Set term as active
     */
    public function setActive($id) {
        // First, deactivate all terms
        $this->pdo->exec("UPDATE terms SET is_active = 0");
        
        // Then activate the specified one
        $sql = "UPDATE terms SET is_active = 1 WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id]);
    }
    
    /**
     * Get current term (based on date)
     */
    public function getCurrentTerm() {
        $sql = "SELECT t.*, ay.name as academic_year_name 
                FROM terms t 
                JOIN academic_years ay ON t.academic_year_id = ay.id 
                WHERE CURDATE() BETWEEN t.start_date AND t.end_date 
                LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?> 