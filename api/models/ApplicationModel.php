<?php
// api/models/ApplicationModel.php - Model for applications table

require_once __DIR__ . '/../core/BaseModel.php';

class ApplicationModel extends BaseModel {
    protected static $table = 'applications';

    // Fields that can be mass assigned
    protected static $fillable = [
        'applicant_number',
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

    // Override create to auto-generate applicant_number
    public function create($data) {
        // Generate unique applicant_number if not provided
        if (empty($data['applicant_number'])) {
            $data['applicant_number'] = self::generateApplicantNumber($this->pdo);
        }
        return parent::create($data);
    }

    // Generate a unique applicant number like 202400001
    protected static function generateApplicantNumber($pdo) {
        $year = date('Y');
        do {
            $unique = $year . str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM applications WHERE applicant_number = ?');
            $stmt->execute([$unique]);
            $exists = $stmt->fetchColumn() > 0;
        } while ($exists);
        return $unique;
    }
}
?> 