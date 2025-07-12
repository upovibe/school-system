<?php

class Migration_20241001000013createstudentstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                admission_number VARCHAR(50) UNIQUE NOT NULL,
                current_class_id INT DEFAULT NULL,
                enrollment_date DATE NOT NULL,
                guardian_name VARCHAR(255) DEFAULT NULL,
                guardian_phone VARCHAR(20) DEFAULT NULL,
                guardian_email VARCHAR(255) DEFAULT NULL,
                address TEXT,
                emergency_contact VARCHAR(255) DEFAULT NULL,
                emergency_phone VARCHAR(20) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_user (user_id)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS students");
    }
}
?> 