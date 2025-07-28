<?php

class Migration_20241001000035createstudentstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                student_id VARCHAR(20) UNIQUE NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other'),
                admission_date DATE,
                current_class_id INT,
                parent_name VARCHAR(100),
                parent_phone VARCHAR(20),
                parent_email VARCHAR(255),
                emergency_contact VARCHAR(100),
                emergency_phone VARCHAR(20),
                blood_group VARCHAR(5),
                medical_conditions TEXT,
                status ENUM('active', 'inactive', 'graduated', 'transferred') DEFAULT 'active',
                profile_image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (current_class_id) REFERENCES classes(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_student_id (student_id),
                INDEX idx_current_class_id (current_class_id),
                INDEX idx_admission_date (admission_date),
                INDEX idx_status (status),
                INDEX idx_parent_email (parent_email),
                INDEX idx_created_at (created_at)
            )
        ");
        
        // Create a trigger to automatically update user role to 'student' when assigned
        $this->pdo->exec("
            CREATE TRIGGER IF NOT EXISTS update_user_role_to_student
            AFTER INSERT ON students
            FOR EACH ROW
            BEGIN
                UPDATE users 
                SET role_id = (SELECT id FROM roles WHERE name = 'student' LIMIT 1)
                WHERE id = NEW.user_id;
            END
        ");
        
        // Create a trigger to revert user role when student is deleted
        $this->pdo->exec("
            CREATE TRIGGER IF NOT EXISTS revert_user_role_on_student_delete
            AFTER DELETE ON students
            FOR EACH ROW
            BEGIN
                UPDATE users 
                SET role_id = (SELECT id FROM roles WHERE name = 'student' LIMIT 1)
                WHERE id = OLD.user_id;
            END
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TRIGGER IF EXISTS update_user_role_to_student");
        $this->pdo->exec("DROP TRIGGER IF EXISTS revert_user_role_on_student_delete");
        $this->pdo->exec("DROP TABLE IF EXISTS students");
    }
}
?> 