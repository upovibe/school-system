<?php

class Migration_20241001000033createteacherstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS teachers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                team_id INT NOT NULL,
                user_id INT NOT NULL,
                employee_id VARCHAR(20) UNIQUE NOT NULL,
                qualification VARCHAR(100),
                specialization TEXT,
                hire_date DATE,
                salary DECIMAL(10,2),
                status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_team_user (team_id, user_id),
                INDEX idx_team_id (team_id),
                INDEX idx_user_id (user_id),
                INDEX idx_employee_id (employee_id),
                INDEX idx_status (status),
                INDEX idx_hire_date (hire_date)
            )
        ");
        
        // Create a trigger to automatically update user role to 'teacher' when assigned
        $this->pdo->exec("
            CREATE TRIGGER IF NOT EXISTS update_user_role_to_teacher
            AFTER INSERT ON teachers
            FOR EACH ROW
            BEGIN
                UPDATE users 
                SET role_id = (SELECT id FROM roles WHERE name = 'teacher' LIMIT 1)
                WHERE id = NEW.user_id;
            END
        ");
        
        // Create a trigger to revert user role when teacher is deleted
        $this->pdo->exec("
            CREATE TRIGGER IF NOT EXISTS revert_user_role_on_teacher_delete
            AFTER DELETE ON teachers
            FOR EACH ROW
            BEGIN
                UPDATE users 
                SET role_id = (SELECT id FROM roles WHERE name = 'student' LIMIT 1)
                WHERE id = OLD.user_id;
            END
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TRIGGER IF EXISTS update_user_role_to_teacher");
        $this->pdo->exec("DROP TRIGGER IF EXISTS revert_user_role_on_teacher_delete");
        $this->pdo->exec("DROP TABLE IF EXISTS teachers");
    }
}
?> 