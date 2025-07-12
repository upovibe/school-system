<?php
// api/models/LevelModel.php - Model for levels table

require_once __DIR__ . '/../core/BaseModel.php';

class LevelModel extends BaseModel {
    protected static $table = 'levels';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'order_index',
        'stage'
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
     * Get levels by stage
     */
    public function getByStage($stage) {
        $sql = "SELECT * FROM levels WHERE stage = ? ORDER BY order_index ASC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$stage]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all levels ordered by order_index
     */
    public function getAllOrdered() {
        $sql = "SELECT * FROM levels ORDER BY order_index ASC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Find level by name
     */
    public function findByName($name) {
        $sql = "SELECT * FROM levels WHERE name = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$name]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?> 