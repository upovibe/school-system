<?php
// api/database/migrations/20241001_00006_create_applications_table.php

class Migration_20241001000006createapplicationstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                applicant_number VARCHAR(30) NOT NULL UNIQUE,
                
                -- Section A: Student Information (from student_info_fields)
                first_name VARCHAR(100) NOT NULL,
                middle_name VARCHAR(100) DEFAULT NULL,
                last_name VARCHAR(100) NOT NULL,
                gender ENUM('male', 'female') DEFAULT NULL,
                date_of_birth DATE DEFAULT NULL,
                place_of_birth VARCHAR(100) DEFAULT NULL,
                nationality VARCHAR(50) DEFAULT NULL,
                religion VARCHAR(100) DEFAULT NULL,
                student_phone VARCHAR(20) DEFAULT NULL,
                email VARCHAR(150) DEFAULT NULL,
                
                -- Section B: Parent/Guardian Information (from parent_guardian_fields)
                parent_full_name VARCHAR(100) DEFAULT NULL,
                relationship VARCHAR(50) DEFAULT NULL,
                phone_number VARCHAR(20) DEFAULT NULL,
                occupation VARCHAR(100) DEFAULT NULL,
                emergency_contact TEXT DEFAULT NULL,
                residential_address TEXT DEFAULT NULL,
                
                -- Section C: Academic Background (from academic_background_fields)
                previous_school VARCHAR(200) DEFAULT NULL,
                last_class_completed VARCHAR(50) DEFAULT NULL,
                
                -- Section D: School Setup (from enabled_levels, level_classes, etc.)
                level_applying VARCHAR(50) NOT NULL,
                class_applying VARCHAR(50) NOT NULL,
                academic_programme VARCHAR(100) DEFAULT NULL,
                school_type VARCHAR(50) DEFAULT NULL,
                
                -- Section E: Health Information (from health_info_fields - stored as JSON)
                health_info JSON DEFAULT NULL,
                
                -- Application Management
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                
                -- Additional Data & Tracking
                applicant_ip VARCHAR(45) DEFAULT NULL,
                academic_year_id INT DEFAULT NULL,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Indexes
                INDEX idx_status (status),
                INDEX idx_level (level_applying),
                INDEX idx_created_at (created_at),
                INDEX idx_applicant_ip (applicant_ip),
                INDEX idx_applicant_number (applicant_number),
                INDEX idx_academic_year (academic_year_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS applications");
    }
}
?> 