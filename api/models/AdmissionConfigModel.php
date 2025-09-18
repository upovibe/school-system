<?php
// api/models/AdmissionConfigModel.php - Model for admission_config table

require_once __DIR__ . '/../core/BaseModel.php';

class AdmissionConfigModel extends BaseModel {
    protected static $table = 'admission_config';

    // Fields that can be mass assigned
    protected static $fillable = [
        'academic_year_id',
        'admission_status',
        'max_applications_per_ip_per_day',
        'school_types',
        'enabled_levels',
        'level_classes',
        'shs_programmes',
        'student_info_fields',
        'parent_guardian_fields',
        'academic_background_fields',
        'health_info_fields',
    ];

    // Fields that should be cast to specific types
    protected static $casts = [
        'school_types' => 'json',
        'enabled_levels' => 'json',
        'level_classes' => 'json',
        'shs_programmes' => 'json',
        'student_info_fields' => 'json',
        'parent_guardian_fields' => 'json',
        'academic_background_fields' => 'json',
        'health_info_fields' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }

    // Get current admission configuration
    public function getCurrentConfig() {
        $stmt = $this->pdo->prepare("
            SELECT ac.*, ay.year_code, ay.display_name as academic_year_name
            FROM admission_config ac
            JOIN academic_years ay ON ac.academic_year_id = ay.id
            WHERE ay.is_current = 1
            LIMIT 1
        ");
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Get configuration by academic year
    public function getConfigByYear($academicYearId) {
        $stmt = $this->pdo->prepare("
            SELECT ac.*, ay.year_code, ay.display_name as academic_year_name
            FROM admission_config ac
            JOIN academic_years ay ON ac.academic_year_id = ay.id
            WHERE ac.academic_year_id = ?
            LIMIT 1
        ");
        $stmt->execute([$academicYearId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Update form field configuration
    public function updateFormFields($academicYearId, $section, $fields) {
        $fieldColumn = $section . '_fields';
        
        if (!in_array($fieldColumn, ['student_info_fields', 'parent_guardian_fields', 'academic_background_fields', 'health_info_fields'])) {
            throw new InvalidArgumentException('Invalid section name');
        }

        $stmt = $this->pdo->prepare("
            UPDATE admission_config 
            SET {$fieldColumn} = ? 
            WHERE academic_year_id = ?
        ");
        return $stmt->execute([json_encode($fields), $academicYearId]);
    }

    // Get enabled levels for current academic year
    public function getEnabledLevels() {
        $config = $this->getCurrentConfig();
        return $config ? json_decode($config['enabled_levels'], true) : [];
    }

    // Get all available school levels
    public function getAllSchoolLevels() {
        return ['creche', 'nursery', 'kindergarten', 'primary', 'jhs', 'shs'];
    }

    // Get classes for a specific level
    public function getClassesForLevel($level) {
        $config = $this->getCurrentConfig();
        if (!$config) return [];
        
        $levelClasses = json_decode($config['level_classes'], true);
        return $levelClasses[$level] ?? [];
    }

    // Get SHS programmes
    public function getSHSProgrammes() {
        $config = $this->getCurrentConfig();
        return $config ? json_decode($config['shs_programmes'], true) : [];
    }

    // Get school types
    public function getSchoolTypes() {
        $config = $this->getCurrentConfig();
        return $config ? json_decode($config['school_types'], true) : [];
    }

    // Get required documents for a level
    public function getRequiredDocumentsForLevel($level) {
        $config = $this->getCurrentConfig();
        if (!$config) return [];
        
        $requiredDocs = json_decode($config['required_documents'], true);
        // Since required_documents is now a simple array of strings, return all documents
        // In the future, this could be enhanced to filter by level if needed
        return $requiredDocs ?? [];
    }

    // Check if admission is open
    public function isAdmissionOpen() {
        $config = $this->getCurrentConfig();
        return $config && $config['admission_status'] === 'open';
    }

    // Get form fields for a specific section
    public function getFormFields($section) {
        $config = $this->getCurrentConfig();
        if (!$config) return [];
        
        $fieldColumn = $section . '_fields';
        if (!in_array($fieldColumn, ['student_info_fields', 'parent_guardian_fields', 'academic_background_fields', 'health_info_fields'])) {
            return [];
        }
        
        return json_decode($config[$fieldColumn], true) ?? [];
    }

    // Get enabled form fields for a specific section
    public function getEnabledFormFields($section) {
        $fields = $this->getFormFields($section);
        return array_filter($fields, function($field) {
            return $field['enabled'] ?? false;
        });
    }

    // Validate form field configuration
    public function validateFieldConfig($fields) {
        $requiredKeys = ['name', 'label', 'required', 'enabled', 'type'];
        
        foreach ($fields as $field) {
            foreach ($requiredKeys as $key) {
                if (!array_key_exists($key, $field)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Check if health info is enabled (based on health_info_fields JSON)
     */
    public function isHealthInfoEnabled() {
        $healthFields = $this->health_info_fields ?? [];
        return !empty($healthFields) && is_array($healthFields);
    }

    /**
     * Check if parent email is required (based on parent_guardian_fields JSON)
     */
    public function isParentEmailRequired() {
        $parentFields = $this->parent_guardian_fields ?? [];
        foreach ($parentFields as $field) {
            if (isset($field['name']) && $field['name'] === 'email' && isset($field['required'])) {
                return $field['required'] === true;
            }
        }
        return false;
    }

    /**
     * Check if parent occupation is required (based on parent_guardian_fields JSON)
     */
    public function isParentOccupationRequired() {
        $parentFields = $this->parent_guardian_fields ?? [];
        foreach ($parentFields as $field) {
            if (isset($field['name']) && $field['name'] === 'occupation' && isset($field['required'])) {
                return $field['required'] === true;
            }
        }
        return false;
    }

    /**
     * Get admission configuration statistics
     */
    public function getStatistics() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) as total_configs,
                    SUM(CASE WHEN admission_status = 'open' THEN 1 ELSE 0 END) as open_configs,
                    SUM(CASE WHEN admission_status = 'closed' THEN 1 ELSE 0 END) as closed_configs
                FROM admission_config
            ");
            $stmt->execute();
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Get application counts by status
            $stmt = $this->pdo->prepare("
                SELECT 
                    status,
                    COUNT(*) as count
                FROM applications 
                GROUP BY status
            ");
            $stmt->execute();
            $applicationStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get applications by level
            $stmt = $this->pdo->prepare("
                SELECT 
                    level_applying_for,
                    COUNT(*) as count
                FROM applications 
                GROUP BY level_applying_for
            ");
            $stmt->execute();
            $levelStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                'config_stats' => $stats,
                'application_stats' => $applicationStats,
                'level_stats' => $levelStats
            ];
        } catch (Exception $e) {
            throw new Exception('Error retrieving statistics: ' . $e->getMessage());
        }
    }
}
?>
