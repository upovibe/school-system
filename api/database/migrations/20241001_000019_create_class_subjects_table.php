<?php

class Migration_20241001000019createclasssubjectstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
            CREATE TABLE class_subjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                subject_id INT NOT NULL,
                teacher_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
                UNIQUE KEY unique_class_subject (class_id, subject_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $this->pdo->exec($sql);
        echo "✅ Created class_subjects table\n";
    }
    
    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS class_subjects");
    }
}
?> 