<?php

class Migration_20241001000074createannouncementstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content LONGTEXT NOT NULL,
                announcement_type ENUM('general', 'academic', 'event', 'reminder', 'emergency') DEFAULT 'general',
                priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
                target_audience ENUM('all', 'students', 'teachers', 'admin', 'cashier', 'specific_class') DEFAULT 'all',
                target_class_id INT NULL,
                is_active BOOLEAN DEFAULT 1,
                is_pinned BOOLEAN DEFAULT 0,
                expires_at TIMESTAMP NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_announcement_type (announcement_type),
                INDEX idx_priority (priority),
                INDEX idx_target_audience (target_audience),
                INDEX idx_target_class_id (target_class_id),
                INDEX idx_is_active (is_active),
                INDEX idx_is_pinned (is_pinned),
                INDEX idx_expires_at (expires_at),
                INDEX idx_created_by (created_by),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (target_class_id) REFERENCES classes(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS announcements");
    }
}
?>
