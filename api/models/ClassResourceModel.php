<?php
// api/models/ClassResourceModel.php - Model for class_resources table

require_once __DIR__ . '/../core/BaseModel.php';

class ClassResourceModel extends BaseModel {
    protected static $table = 'class_resources';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'title',
        'class_id',
        'attachment_file'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'id' => 'integer',
        'class_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Get resources for a specific class
     */
    public function getByClass($classId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT cr.*, c.name as class_name, c.section as class_section
                FROM {$this->getTableName()} cr
                LEFT JOIN classes c ON cr.class_id = c.id
                WHERE cr.class_id = ?
                ORDER BY cr.created_at DESC
            ");
            $stmt->execute([$classId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching resources by class: ' . $e->getMessage());
        }
    }
}
?>
