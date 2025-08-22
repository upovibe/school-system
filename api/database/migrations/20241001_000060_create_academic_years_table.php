<?php
/**
 * Migration: Create academic_years table
 * 
 * This table stores academic year definitions and manages which year is current
 */

class Migration_20241001000060createacademicyearstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
        CREATE TABLE academic_years (
            id INT PRIMARY KEY AUTO_INCREMENT,
            year_code VARCHAR(20) NOT NULL UNIQUE,
            display_name VARCHAR(100) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            is_active BOOLEAN DEFAULT FALSE,
            is_current BOOLEAN DEFAULT FALSE,
            status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
            archive_date TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            INDEX idx_year_code (year_code),
            INDEX idx_is_active (is_active),
            INDEX idx_is_current (is_current),
            INDEX idx_status (status),
            INDEX idx_start_date (start_date),
            INDEX idx_end_date (end_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $this->pdo->exec($sql);
    }

    public function down() {
        $sql = "DROP TABLE IF EXISTS academic_years;";
        $this->pdo->exec($sql);
    }
}
?>
