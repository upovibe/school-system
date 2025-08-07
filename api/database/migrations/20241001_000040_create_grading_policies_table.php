<?php
/**
 * Migration: Create grading_policies table
 * 
 * This table stores school grading policies with dynamic grade boundaries
 */

class Migration_20241001000040creategradingpoliciestable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
        CREATE TABLE grading_policies (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            subject_id INT NOT NULL, -- Subject-specific policy
            is_active BOOLEAN DEFAULT TRUE,
            
            -- Maximum Scores (Subject-specific)
            assignment_max_score INT DEFAULT 60,
            exam_max_score INT DEFAULT 40,
            
            -- Dynamic Grade Boundaries (JSON) - Subject-specific
            grade_boundaries JSON NOT NULL,
            
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE KEY unique_subject_policy (subject_id), -- One policy per subject
            INDEX idx_subject_id (subject_id),
            INDEX idx_is_active (is_active),
            INDEX idx_created_by (created_by),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $this->pdo->exec($sql);
    }

    public function down() {
        $sql = "DROP TABLE IF EXISTS grading_policies;";
        $this->pdo->exec($sql);
    }
}
?>
