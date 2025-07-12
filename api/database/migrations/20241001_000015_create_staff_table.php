<?php

class Migration_20241001000015createstafftable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS staff (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                position VARCHAR(100) NOT NULL,
                department VARCHAR(100) DEFAULT NULL,
                hire_date DATE NOT NULL,
                bio TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_staff_user (user_id)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS staff");
    }
}
?> 