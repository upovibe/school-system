<?php

class Migration_20241001000036insertdefaultroles {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        // Insert default roles if they don't exist
        $this->pdo->exec("
            INSERT IGNORE INTO roles (name, description) VALUES 
            ('admin', 'System administrator with full access'),
            ('teacher', 'Teacher with class and grade management access'),
            ('student', 'Student with limited access to own data'),
            ('parent', 'Parent with access to child information'),
            ('staff', 'Staff member with administrative access')
        ");
    }

    public function down() {
        // Remove the inserted roles
        $this->pdo->exec("
            DELETE FROM roles WHERE name IN ('admin', 'teacher', 'student', 'parent', 'staff')
        ");
    }
}
?> 