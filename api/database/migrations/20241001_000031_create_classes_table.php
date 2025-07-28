<?php

class Migration_20241001000031createclassestable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS classes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                section VARCHAR(10) NOT NULL,
                academic_year VARCHAR(20) NOT NULL,
                capacity INT DEFAULT 30,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_class_section_year (name, section, academic_year),
                INDEX idx_name (name),
                INDEX idx_academic_year (academic_year),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS classes");
    }
}
?> 