<?php
/**
 * Migration: Create grading_periods table
 * 
 * This table stores academic grading periods like terms, semesters, etc.
 */

class Migration_20241001000042creategradingperiodstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
        CREATE TABLE grading_periods (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            academic_year_id INT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            is_active BOOLEAN DEFAULT FALSE,
            description TEXT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
            INDEX idx_academic_year_id (academic_year_id),
            INDEX idx_is_active (is_active),
            INDEX idx_start_date (start_date),
            INDEX idx_end_date (end_date),
            INDEX idx_created_by (created_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $this->pdo->exec($sql);
    }

    public function down() {
        $sql = "DROP TABLE IF EXISTS grading_periods;";
        $this->pdo->exec($sql);
    }
}
?>
