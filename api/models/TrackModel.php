<?php
// api/models/TrackModel.php - Model for tracks table

require_once __DIR__ . '/../core/BaseModel.php';

class TrackModel extends BaseModel {
    protected static $table = 'tracks';
    
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
     * Find track by name
     */
    public function findByName($name) {
        $sql = "SELECT * FROM tracks WHERE name = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$name]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all tracks ordered by name
     */
    public function getAllOrdered() {
        $sql = "SELECT * FROM tracks ORDER BY name ASC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?> 