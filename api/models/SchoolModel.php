<?php
// api/models/SchoolModel.php - Model for schools table

require_once __DIR__ . '/../core/BaseModel.php';

class SchoolModel extends BaseModel {
    protected static $table = 'schools';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'address',
        'code',
        'phone',
        'type'
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
     * Find school by code
     */
    public function findByCode($code) {
        $sql = "SELECT * FROM schools WHERE code = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$code]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get active schools
     */
    public function getActiveSchools() {
        $sql = "SELECT * FROM schools ORDER BY name ASC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get schools by type
     */
    public function getByType($type) {
        $sql = "SELECT * FROM schools WHERE type = ? ORDER BY name ASC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$type]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?> 