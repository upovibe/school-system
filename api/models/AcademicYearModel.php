<?php
// api/models/AcademicYearModel.php - Model for academic_years table

require_once __DIR__ . '/../core/BaseModel.php';

class AcademicYearModel extends BaseModel {
    protected static $table = 'academic_years';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_active'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Get active academic year
     */
    public function getActiveYear() {
        $sql = "SELECT * FROM academic_years WHERE is_active = 1 LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Set academic year as active
     */
    public function setActive($id) {
        // First, deactivate all academic years
        $this->pdo->exec("UPDATE academic_years SET is_active = 0");
        
        // Then activate the specified one
        $sql = "UPDATE academic_years SET is_active = 1 WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id]);
    }
    
    /**
     * Get academic year with terms
     */
    public function getWithTerms($id) {
        $sql = "SELECT ay.*, 
                       GROUP_CONCAT(t.id) as term_ids,
                       GROUP_CONCAT(t.name) as term_names,
                       GROUP_CONCAT(t.number) as term_numbers
                FROM academic_years ay
                LEFT JOIN terms t ON ay.id = t.academic_year_id
                WHERE ay.id = ?
                GROUP BY ay.id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?> 