<?php

/**
 * Migration: Create student_promotion_logs table
 * 
 * This table tracks when students are promoted between classes
 */
class Migration_20241001000050createstudentpromotionlogstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS student_promotion_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                from_class_id INT NULL,
                to_class_id INT NOT NULL,
                promoted_by INT NULL,
                promotion_date DATETIME NOT NULL,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_student_id (student_id),
                INDEX idx_from_class_id (from_class_id),
                INDEX idx_to_class_id (to_class_id),
                INDEX idx_promoted_by (promoted_by),
                INDEX idx_promotion_date (promotion_date),
                
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (from_class_id) REFERENCES classes(id) ON DELETE SET NULL,
                FOREIGN KEY (to_class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (promoted_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS student_promotion_logs");
    }
}
?>
