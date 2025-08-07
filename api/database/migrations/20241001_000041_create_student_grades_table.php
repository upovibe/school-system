<?php
/**
 * Migration: Create student_grades table
 * 
 * This table stores student grades with calculated percentages and letter grades
 */

class Migration_20241001000041createstudentgradestable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "
        CREATE TABLE student_grades (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_id INT NOT NULL,
            class_id INT NOT NULL,
            subject_id INT NOT NULL, -- Specific subject grade
            grading_period_id INT NOT NULL,
            grading_policy_id INT NOT NULL, -- References school-wide policy
            
            -- Raw Scores (Teachers enter these)
            assignment_total DECIMAL(5,2) DEFAULT 0,
            assignment_max DECIMAL(5,2) DEFAULT 0,
            exam_total DECIMAL(5,2) DEFAULT 0,
            exam_max DECIMAL(5,2) DEFAULT 0,
            
            -- Calculated Scores (System calculates these)
            assignment_percentage DECIMAL(5,2) DEFAULT 0,
            exam_percentage DECIMAL(5,2) DEFAULT 0,
            final_percentage DECIMAL(5,2) DEFAULT 0,
            final_letter_grade VARCHAR(3),
            
            remarks TEXT,
            created_by INT,
            updated_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (grading_period_id) REFERENCES grading_periods(id) ON DELETE CASCADE,
            FOREIGN KEY (grading_policy_id) REFERENCES grading_policies(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
            
            UNIQUE KEY unique_grade (student_id, class_id, subject_id, grading_period_id),
            INDEX idx_student_id (student_id),
            INDEX idx_class_id (class_id),
            INDEX idx_subject_id (subject_id),
            INDEX idx_grading_period_id (grading_period_id),
            INDEX idx_grading_policy_id (grading_policy_id),
            INDEX idx_final_letter_grade (final_letter_grade),
            INDEX idx_created_by (created_by),
            INDEX idx_updated_by (updated_by),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $this->pdo->exec($sql);
    }

    public function down() {
        $sql = "DROP TABLE IF EXISTS student_grades;";
        $this->pdo->exec($sql);
    }
}
?>
