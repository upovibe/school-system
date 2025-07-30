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
                user_id INT,
                employee_id VARCHAR(20) UNIQUE NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other'),
                qualification VARCHAR(100),
                specialization TEXT,
                hire_date DATE,
                salary DECIMAL(10,2),
                password VARCHAR(255) NOT NULL,
                status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_employee_id (employee_id),
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_hire_date (hire_date),
                INDEX idx_created_at (created_at)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS teachers");
    }
}
?> 