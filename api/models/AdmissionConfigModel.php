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
        'required_documents',
        'student_info_fields',
        'parent_guardian_fields',
        'academic_background_fields',
        'admission_details_fields',
        'health_info_fields',
        'document_upload_fields',
        'health_info_enabled',
        'parent_email_required',
        'parent_occupation_required'
    ];

    // Fields that should be cast to specific types
    protected static $casts = [
        'school_types' => 'json',
        'enabled_levels' => 'json',
        'level_classes' => 'json',
        'shs_programmes' => 'json',
        'required_documents' => 'json',
        'student_info_fields' => 'json',
        'parent_guardian_fields' => 'json',
        'academic_background_fields' => 'json',
        'admission_details_fields' => 'json',
        'health_info_fields' => 'json',
        'document_upload_fields' => 'json',
        'health_info_enabled' => 'boolean',
        'parent_email_required' => 'boolean',
        'parent_occupation_required' => 'boolean',
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
        
        if (!in_array($fieldColumn, ['student_info_fields', 'parent_guardian_fields', 'academic_background_fields', 'admission_details_fields', 'health_info_fields', 'document_upload_fields'])) {
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
        return array_filter($requiredDocs, function($doc) use ($level) {
            return in_array($level, $doc['levels'] ?? []);
        });
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
        if (!in_array($fieldColumn, ['student_info_fields', 'parent_guardian_fields', 'academic_background_fields', 'admission_details_fields', 'health_info_fields', 'document_upload_fields'])) {
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
}
?>
