<?php

class Migration_20241001000026createteamstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS teams (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                profile_image VARCHAR(500),
                position VARCHAR(255) NOT NULL,
                department ENUM('Administration', 'Teaching', 'Support Staff', 'Management', 'IT', 'Finance', 'Human Resources', 'Maintenance', 'Security', 'Other') NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_department (department),
                INDEX idx_active (is_active),
                INDEX idx_created_at (created_at)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS teams");
    }
}
?> 