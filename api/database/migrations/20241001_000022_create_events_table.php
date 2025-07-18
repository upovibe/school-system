<?php

class Migration_20241001000022createeventstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                description LONGTEXT,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                category VARCHAR(100) DEFAULT 'general',
                status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
                location VARCHAR(255),
                banner_image VARCHAR(255),
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_slug (slug),
                INDEX idx_start_date (start_date),
                INDEX idx_end_date (end_date),
                INDEX idx_category (category),
                INDEX idx_status (status),
                INDEX idx_active (is_active)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS events");
    }
}
?> 