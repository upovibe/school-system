<?php
/**
 * Migration: Create academic_year_copy_logs table
 * 
 * This table logs all academic year copying operations for audit purposes
 */

class Migration_20241001000062createacademicyearcopylogstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
        CREATE TABLE academic_year_copy_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            source_year_id INT NOT NULL,
            target_year_id INT NOT NULL,
            copied_classes INT DEFAULT 0,
            copied_grading_periods INT DEFAULT 0,
            copied_fee_schedules INT DEFAULT 0,
            copied_by INT,
            copy_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('success', 'partial', 'failed') DEFAULT 'success',
            notes TEXT,
            
            FOREIGN KEY (source_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
            FOREIGN KEY (target_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
            FOREIGN KEY (copied_by) REFERENCES users(id) ON DELETE SET NULL,
            
            INDEX idx_source_year (source_year_id),
            INDEX idx_target_year (target_year_id),
            INDEX idx_copy_date (copy_date),
            INDEX idx_status (status),
            INDEX idx_copied_by (copied_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $this->pdo->exec($sql);
    }

    public function down() {
        $sql = "DROP TABLE IF EXISTS academic_year_copy_logs;";
        $this->pdo->exec($sql);
    }
}
?>
