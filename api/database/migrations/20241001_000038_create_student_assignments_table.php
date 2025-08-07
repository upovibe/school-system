<?php
/**
 * Migration: Create student_assignments table
 * 
 * This table stores student submissions for class homework assignments
 */

class Migration_20241001000038createstudentassignmentstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
        CREATE TABLE student_assignments (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_id INT,
            assignment_id INT,
            submission_text TEXT,
            submission_file VARCHAR(255),
            submitted_at DATETIME,
            grade DECIMAL(5,2),
            feedback TEXT,
            status ENUM('not_submitted', 'submitted', 'graded', 'late') DEFAULT 'not_submitted',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            archived_at TIMESTAMP NULL DEFAULT NULL,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (assignment_id) REFERENCES class_assignments(id) ON DELETE CASCADE,
            UNIQUE (student_id, assignment_id), -- A student can only submit to an assignment once
            INDEX idx_student_id (student_id),
            INDEX idx_assignment_id (assignment_id),
            INDEX idx_status (status),
            INDEX idx_submitted_at (submitted_at),
            INDEX idx_grade (grade),
            INDEX idx_created_at (created_at),
            INDEX idx_archived_at (archived_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $this->pdo->exec($sql);
    }

    public function down() {
        $sql = "DROP TABLE IF EXISTS student_assignments;";
        $this->pdo->exec($sql);
    }
}
?> 