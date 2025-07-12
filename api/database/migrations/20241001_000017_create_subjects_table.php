<?php

class Migration_20241001000017createsubjectstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
            CREATE TABLE subjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                level_id INT NOT NULL,
                department_id INT NOT NULL,
                is_core TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
                UNIQUE KEY unique_subject_level (name, level_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $this->pdo->exec($sql);
        echo "✅ Created subjects table\n";
    }
    
    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS subjects");
    }
}
?> 