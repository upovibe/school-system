<?php
// api/database/migrations/20241001_000007_create_admission_config_table.php

class Migration_20241001000007createadmissionconfigtable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS admission_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                
                -- Basic Configuration
                academic_year_id INT NOT NULL,
                admission_status ENUM('open', 'closed') DEFAULT 'open',
                max_applications_per_ip_per_day INT DEFAULT 3,
                
                -- School Setup
                enabled_levels JSON,
                level_classes JSON,
                shs_programmes JSON,
                school_types JSON,
                
                -- Form Field Configuration (Sections A-F)
                student_info_fields JSON,
                parent_guardian_fields JSON,
                academic_background_fields JSON,
                health_info_fields JSON,
                document_upload_fields JSON,
                
                
                -- Document Requirements
                required_documents JSON,
                
                -- Additional Settings
                -- (All settings now controlled via JSON field configurations)
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Constraints & Indexes
                FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
                INDEX idx_academic_year_id (academic_year_id),
                INDEX idx_admission_status (admission_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // Insert default config (sample)
        $enabledLevels = json_encode(['primary', 'jhs', 'shs']);
        $levelClasses = json_encode([
            'primary' => ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
            'jhs' => ['JHS1', 'JHS2', 'JHS3'],
            'shs' => ['SHS1', 'SHS2', 'SHS3']
        ]);
        $shsProgrammes = json_encode(['General Science', 'Business', 'Arts', 'Technical', 'Home Economics']);
        $schoolTypes = json_encode(['day', 'boarding']);
        
        // Form field configurations
        $studentInfoFields = json_encode([
            ['name' => 'first_name', 'label' => 'First Name', 'required' => true, 'enabled' => true, 'type' => 'text'],
            ['name' => 'middle_name', 'label' => 'Middle Name', 'required' => false, 'enabled' => true, 'type' => 'text'],
            ['name' => 'last_name', 'label' => 'Last Name', 'required' => true, 'enabled' => true, 'type' => 'text'],
            ['name' => 'gender', 'label' => 'Gender', 'required' => true, 'enabled' => true, 'type' => 'select', 'options' => ['male', 'female']],
            ['name' => 'date_of_birth', 'label' => 'Date of Birth', 'required' => true, 'enabled' => true, 'type' => 'date'],
            ['name' => 'place_of_birth', 'label' => 'Place of Birth', 'required' => false, 'enabled' => true, 'type' => 'text'],
            ['name' => 'nationality', 'label' => 'Nationality', 'required' => true, 'enabled' => true, 'type' => 'text'],
            ['name' => 'religion', 'label' => 'Religion/Denomination', 'required' => false, 'enabled' => true, 'type' => 'text'],
            ['name' => 'passport_photo', 'label' => 'Passport Photo', 'required' => true, 'enabled' => true, 'type' => 'file']
        ]);
        
        $parentGuardianFields = json_encode([
            ['name' => 'parent_full_name', 'label' => 'Parent/Guardian Full Name', 'required' => true, 'enabled' => true, 'type' => 'text'],
            ['name' => 'relationship', 'label' => 'Relationship to Student', 'required' => true, 'enabled' => true, 'type' => 'select', 'options' => ['Father', 'Mother', 'Guardian', 'Other']],
            ['name' => 'phone_number', 'label' => 'Phone Number', 'required' => true, 'enabled' => true, 'type' => 'tel'],
            ['name' => 'email', 'label' => 'Email Address', 'required' => false, 'enabled' => true, 'type' => 'email'],
            ['name' => 'occupation', 'label' => 'Occupation', 'required' => false, 'enabled' => true, 'type' => 'text'],
            ['name' => 'residential_address', 'label' => 'Residential Address', 'required' => true, 'enabled' => true, 'type' => 'textarea'],
            ['name' => 'emergency_contact', 'label' => 'Emergency Contact', 'required' => true, 'enabled' => true, 'type' => 'text']
        ]);
        
        $academicBackgroundFields = json_encode([
            ['name' => 'previous_school', 'label' => 'Previous School Attended', 'required' => false, 'enabled' => true, 'type' => 'text'],
            ['name' => 'last_class_completed', 'label' => 'Last Class Completed', 'required' => false, 'enabled' => true, 'type' => 'text'],
            ['name' => 'report_card', 'label' => 'Report Card Upload', 'required' => false, 'enabled' => true, 'type' => 'file'],
            ['name' => 'bece_results', 'label' => 'BECE Results', 'required' => false, 'enabled' => true, 'type' => 'file', 'for_levels' => ['shs']],
            ['name' => 'transfer_letter', 'label' => 'Transfer Letter', 'required' => false, 'enabled' => true, 'type' => 'file']
        ]);
        
        
        $healthInfoFields = json_encode([
            ['name' => 'blood_group', 'label' => 'Blood Group', 'required' => false, 'enabled' => false, 'type' => 'select'],
            ['name' => 'allergies', 'label' => 'Allergies', 'required' => false, 'enabled' => false, 'type' => 'select_multiple'],
            ['name' => 'medical_conditions', 'label' => 'Medical Conditions', 'required' => false, 'enabled' => false, 'type' => 'select_multiple'],
            ['name' => 'immunization_card', 'label' => 'Immunization Card Upload', 'required' => false, 'enabled' => false, 'type' => 'file']
        ]);
        
        $documentUploadFields = json_encode([
            ['name' => 'birth_certificate', 'label' => 'Birth Certificate', 'required' => true, 'enabled' => true, 'type' => 'file'],
            ['name' => 'passport_photo_doc', 'label' => 'Passport Photo', 'required' => true, 'enabled' => true, 'type' => 'file'],
            ['name' => 'report_card_doc', 'label' => 'Report Card', 'required' => false, 'enabled' => true, 'type' => 'file'],
            ['name' => 'transfer_letter_doc', 'label' => 'Transfer Letter', 'required' => false, 'enabled' => true, 'type' => 'file'],
            ['name' => 'bece_results_doc', 'label' => 'BECE Results Slip', 'required' => false, 'enabled' => true, 'type' => 'file', 'for_levels' => ['shs']],
            ['name' => 'immunization_card_doc', 'label' => 'Immunization Card', 'required' => false, 'enabled' => true, 'type' => 'file']
        ]);
        $requiredDocuments = json_encode(['birth_certificate', 'passport_photo', 'report_card', 'transfer_letter', 'bece_results', 'immunization_card']);

        // Get the current active academic year ID
        $currentYearStmt = $this->pdo->query("SELECT id FROM academic_years WHERE is_current = 1 AND is_active = 1 LIMIT 1");
        $currentYear = $currentYearStmt->fetch(PDO::FETCH_ASSOC);
        $academicYearId = $currentYear ? $currentYear['id'] : null;

        // Only insert config if there's an active academic year
        if ($academicYearId) {
            $stmt = $this->pdo->prepare("
                INSERT INTO admission_config (
                    academic_year_id, school_types, enabled_levels, level_classes, shs_programmes, required_documents,
                    student_info_fields, parent_guardian_fields, academic_background_fields, health_info_fields, document_upload_fields
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $academicYearId,
                $schoolTypes,
                $enabledLevels,
                $levelClasses,
                $shsProgrammes,
                $requiredDocuments,
                $studentInfoFields,
                $parentGuardianFields,
                $academicBackgroundFields,
                $healthInfoFields,
                $documentUploadFields
            ]);
        }
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS admission_config");
    }
}
?>
