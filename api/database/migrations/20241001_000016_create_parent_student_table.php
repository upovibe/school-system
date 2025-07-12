<?php

class Migration_20241001000016createparentstudenttable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS parent_student (
                id INT AUTO_INCREMENT PRIMARY KEY,
                parent_id INT NOT NULL,
                student_id INT NOT NULL,
                relationship ENUM('father', 'mother', 'guardian', 'other') DEFAULT NULL,
                is_primary_contact BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                UNIQUE KEY unique_parent_student (parent_id, student_id)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS parent_student");
    }
}
?> 