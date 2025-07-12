<?php

class Migration_20241001000018createclassestable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
            CREATE TABLE classes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                level_id INT NOT NULL,
                section VARCHAR(50) NOT NULL,
                teacher_id INT,
                track_id INT,
                school_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
                FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE SET NULL,
                FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
                UNIQUE KEY unique_class_section (level_id, section, school_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $this->pdo->exec($sql);
        echo "✅ Created classes table\n";
    }
    
    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS classes");
    }
}
?> 