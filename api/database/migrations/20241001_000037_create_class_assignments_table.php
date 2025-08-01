<?php
/**
 * Migration: Create class_assignments table
 * 
 * This table stores assignments created by teachers for their classes
 */

class CreateClassAssignmentsTable {
    public function up($pdo) {
        $sql = "
        CREATE TABLE class_assignments (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            due_date DATETIME,
            total_points DECIMAL(5,2) DEFAULT 100.00,
            assignment_type ENUM('homework', 'quiz', 'project', 'exam', 'other') DEFAULT 'homework',
            status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
            attachment_file VARCHAR(255),
            teacher_id INT,
            class_id INT,
            subject_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            INDEX idx_teacher_id (teacher_id),
            INDEX idx_class_id (class_id),
            INDEX idx_subject_id (subject_id),
            INDEX idx_status (status),
            INDEX idx_due_date (due_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $pdo->exec($sql);
    }
    
    public function down($pdo) {
        $sql = "DROP TABLE IF EXISTS class_assignments;";
        $pdo->exec($sql);
    }
} 