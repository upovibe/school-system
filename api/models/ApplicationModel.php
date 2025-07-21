<?php
// api/models/ApplicationModel.php - Model for applications table

require_once __DIR__ . '/../core/BaseModel.php';

class ApplicationModel extends BaseModel {
    protected static $table = 'applications';

    // Fields that can be mass assigned
    protected static $fillable = [
        'student_first_name',
        'student_last_name',
        'father_name',
        'mother_name',
        'guardian_name',
        'parent_phone',
        'student_phone',
        'email',
        'grade'
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

    // Add custom methods for ApplicationModel here as needed
}
?> 