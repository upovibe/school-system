<?php

class Migration_20250101000002createhousestable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        // Create houses table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS houses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_name (name)
            )
        ");

        // Create house_teachers junction table for many-to-many relationship
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS house_teachers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                house_id INT NOT NULL,
                teacher_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
                UNIQUE KEY unique_house_teacher (house_id, teacher_id),
                INDEX idx_house_id (house_id),
                INDEX idx_teacher_id (teacher_id)
            )
        ");
    }

    public function down() {
        // Drop house_teachers junction table
        $this->pdo->exec("DROP TABLE IF EXISTS house_teachers");
        
        // Drop houses table
        $this->pdo->exec("DROP TABLE IF EXISTS houses");
    }
}
?>
