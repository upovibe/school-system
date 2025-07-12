<?php

class Migration_20241001000000createrolestable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");

        // Insert default roles
        $this->pdo->exec("
            INSERT INTO roles (name, description) VALUES 
            ('admin', 'System administrator with full access'),
            ('teacher', 'Teacher with class and grade management access'),
            ('student', 'Student with limited access to own data'),
            ('parent', 'Parent with access to child information'),
            ('staff', 'Staff member with administrative access')
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS roles");
    }
}
?> 