<?php

class Migration_20241001000012createteacherstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS teachers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                department_id INT DEFAULT NULL,
                hire_date DATE NOT NULL,
                bio TEXT,
                qualification VARCHAR(255) DEFAULT NULL,
                specialization VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
                UNIQUE KEY unique_teacher_user (user_id)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS teachers");
    }
}
?> 