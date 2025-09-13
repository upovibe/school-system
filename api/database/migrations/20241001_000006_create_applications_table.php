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
                
                -- Section A: Student Information
                student_first_name VARCHAR(100) NOT NULL,
                student_middle_name VARCHAR(100) DEFAULT NULL,
                student_last_name VARCHAR(100) NOT NULL,
                gender ENUM('male', 'female') DEFAULT NULL,
                date_of_birth DATE DEFAULT NULL,
                place_of_birth VARCHAR(100) DEFAULT NULL,
                nationality VARCHAR(50) DEFAULT NULL,
                religion VARCHAR(100) DEFAULT NULL,
                student_phone VARCHAR(20) DEFAULT NULL,
                email VARCHAR(150) DEFAULT NULL,
                
                -- Section B: Parent/Guardian Information
                parent_guardian_name VARCHAR(100) DEFAULT NULL,
                relationship VARCHAR(50) DEFAULT NULL,
                parent_phone VARCHAR(20) DEFAULT NULL,
                parent_email VARCHAR(150) DEFAULT NULL,
                parent_occupation VARCHAR(100) DEFAULT NULL,
                residential_address TEXT DEFAULT NULL,
                emergency_contact_name VARCHAR(100) DEFAULT NULL,
                emergency_contact_phone VARCHAR(20) DEFAULT NULL,
                
                -- Section C: Academic Background
                previous_school VARCHAR(200) DEFAULT NULL,
                last_class_completed VARCHAR(50) DEFAULT NULL,
                
                -- Section D: Admission Details
                level_applied VARCHAR(50) NOT NULL,
                class_applied VARCHAR(50) NOT NULL,
                programme_applied VARCHAR(100) DEFAULT NULL,
                school_type VARCHAR(50) DEFAULT NULL,
                
                -- Section E: Health Information (JSON)
                health_info JSON DEFAULT NULL,
                
                -- Section F: Document Uploads (JSON)
                uploaded_documents JSON DEFAULT '[]',
                
                -- Application Management
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                admin_notes TEXT DEFAULT NULL,
                reviewed_by INT DEFAULT NULL,
                reviewed_at TIMESTAMP NULL DEFAULT NULL,
                
                -- Additional Data & Tracking
                additional_data JSON DEFAULT '{}',
                applicant_ip VARCHAR(45) DEFAULT NULL,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Indexes
                INDEX idx_status (status),
                INDEX idx_level (level_applied),
                INDEX idx_created_at (created_at),
                INDEX idx_applicant_ip (applicant_ip),
                INDEX idx_applicant_number (applicant_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS applications");
    }
}
?> 