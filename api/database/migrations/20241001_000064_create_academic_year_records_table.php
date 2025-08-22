<?php
/**
 * Migration: Create academic_year_records table
 * 
 * This table stores complete snapshots of academic year data when a year ends
 * Includes classes, students, teachers, subjects, grades, fees, etc.
 */

class Migration_20241001000064createacademicyearrecordstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
        CREATE TABLE academic_year_records (
            id INT PRIMARY KEY AUTO_INCREMENT,
            academic_year_id INT NOT NULL,
            year_code VARCHAR(20) NOT NULL,
            record_type ENUM('complete_year_snapshot', 'class_data', 'student_data', 'teacher_data', 'grade_data', 'fee_data') NOT NULL,
            record_data JSON NOT NULL,
            total_records INT DEFAULT 0,
            archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            archived_by INT NULL,
            notes TEXT,
            
            FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
            FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL,
            
            INDEX idx_academic_year_id (academic_year_id),
            INDEX idx_year_code (year_code),
            INDEX idx_record_type (record_type),
            INDEX idx_archive_date (archive_date),
            INDEX idx_archived_by (archived_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $this->pdo->exec($sql);
    }

    public function down() {
        $sql = "DROP TABLE IF EXISTS academic_year_records;";
        $this->pdo->exec($sql);
    }
}
?>
