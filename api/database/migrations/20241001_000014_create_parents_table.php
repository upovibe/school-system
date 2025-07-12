<?php

class Migration_20241001000014createparentstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS parents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                occupation VARCHAR(255) DEFAULT NULL,
                workplace VARCHAR(255) DEFAULT NULL,
                relationship_to_student ENUM('father', 'mother', 'guardian', 'other') DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_parent_user (user_id)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS parents");
    }
}
?> 