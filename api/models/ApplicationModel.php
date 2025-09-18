<?php
// api/models/ApplicationModel.php - Model for applications table

require_once __DIR__ . '/../core/BaseModel.php';

class ApplicationModel extends BaseModel {
    protected static $table = 'applications';

    // Fields that can be mass assigned
    protected static $fillable = [
        'applicant_number',
        // Section A: Student Information
        'student_first_name',
        'student_middle_name',
        'student_last_name',
        'gender',
        'date_of_birth',
        'place_of_birth',
        'nationality',
        'religion',
        'student_phone',
        'email',
        // Section B: Parent/Guardian Information
        'parent_guardian_name',
        'relationship',
        'parent_phone',
        'parent_email',
        'parent_occupation',
        'emergency_contact',
        'residential_address',
        // Section C: Academic Background
        'previous_school',
        'last_class_completed',
        // Section D: Admission Details
        'level_applied',
        'class_applied',
        'programme_applied',
        'school_type',
        // Section E: Health Information
        'health_info',
        // Application Management
        'status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
        // Additional Data & Tracking
        'additional_data',
        'applicant_ip'
    ];

    // Fields that should be cast to specific types
    protected static $casts = [
        'date_of_birth' => 'date',
        'health_info' => 'json',
        'additional_data' => 'json',
        'reviewed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }

    // Add custom methods for ApplicationModel here as needed

    // Override create to auto-generate applicant_number and set IP
    public function create($data) {
        // Generate unique applicant_number if not provided
        if (empty($data['applicant_number'])) {
            $data['applicant_number'] = self::generateApplicantNumber($this->pdo);
        }
        
        // Set applicant IP if not provided
        if (empty($data['applicant_ip'])) {
            $data['applicant_ip'] = $_SERVER['REMOTE_ADDR'] ?? null;
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

    // Get applications by status
    public function getByStatus($status) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM applications 
            WHERE status = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$status]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get applications by level
    public function getByLevel($level) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM applications 
            WHERE level_applied = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$level]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get applications with pagination
    public function getPaginated($page = 1, $limit = 20, $filters = []) {
        $offset = ($page - 1) * $limit;
        $whereClause = '';
        $params = [];
        
        if (!empty($filters['status'])) {
            $whereClause .= ' AND status = ?';
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['level'])) {
            $whereClause .= ' AND level_applied = ?';
            $params[] = $filters['level'];
        }
        
        if (!empty($filters['date_from'])) {
            $whereClause .= ' AND DATE(created_at) >= ?';
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $whereClause .= ' AND DATE(created_at) <= ?';
            $params[] = $filters['date_to'];
        }
        
        $sql = "SELECT * FROM applications WHERE 1=1 {$whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Update application status
    public function updateStatus($id, $status, $adminNotes = null, $reviewedBy = null) {
        $stmt = $this->pdo->prepare("
            UPDATE applications 
            SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW()
            WHERE id = ?
        ");
        return $stmt->execute([$status, $adminNotes, $reviewedBy, $id]);
    }

    // Get application statistics
    public function getStatistics() {
        $stmt = $this->pdo->query("
            SELECT 
                COUNT(*) as total_applications,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                COUNT(DISTINCT level_applied) as levels_applied,
                COUNT(DISTINCT DATE(created_at)) as application_days
            FROM applications
        ");
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Check if IP has exceeded daily limit
    public function checkIPLimit($ip, $maxPerDay = 3) {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as count 
            FROM applications 
            WHERE applicant_ip = ? AND DATE(created_at) = CURDATE()
        ");
        $stmt->execute([$ip]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] < $maxPerDay;
    }

    // Get applications by date range
    public function getByDateRange($startDate, $endDate) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM applications 
            WHERE DATE(created_at) BETWEEN ? AND ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$startDate, $endDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?> 