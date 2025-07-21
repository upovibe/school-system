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
                student_first_name VARCHAR(100) NOT NULL,
                student_last_name VARCHAR(100) NOT NULL,
                father_name VARCHAR(100) DEFAULT NULL,
                mother_name VARCHAR(100) DEFAULT NULL,
                guardian_name VARCHAR(100) DEFAULT NULL,
                parent_phone VARCHAR(20) DEFAULT NULL,
                student_phone VARCHAR(20) DEFAULT NULL,
                email VARCHAR(150) DEFAULT NULL,
                grade VARCHAR(50) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS applications");
    }
}
?> 