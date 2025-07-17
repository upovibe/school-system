<?php

class Migration_20241001000020createpagestable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS pages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                content LONGTEXT,
                meta_description TEXT,
                meta_keywords TEXT,
                banner_image JSON DEFAULT NULL,
                category VARCHAR(100) DEFAULT 'general',
                is_active BOOLEAN DEFAULT 1,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_slug (slug),
                INDEX idx_category (category),
                INDEX idx_active (is_active),
                INDEX idx_sort_order (sort_order)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS pages");
    }
}
?> 