<?php

class Migration_20241001000034createteacherassignmentstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS teacher_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id INT NOT NULL,
                class_id INT NOT NULL,
                subject_id INT NOT NULL,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_teacher_class_subject (teacher_id, class_id, subject_id),
                INDEX idx_teacher (teacher_id),
                INDEX idx_class (class_id),
                INDEX idx_subject (subject_id),
                INDEX idx_status (status)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS teacher_assignments");
    }
}
?> 