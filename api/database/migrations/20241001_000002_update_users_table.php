<?php

class Migration_20241001000002updateuserstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        // Add new columns to users table
        $this->pdo->exec("
            ALTER TABLE users 
            ADD COLUMN role_id INT DEFAULT 3,
            ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT NULL,
            ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL,
            ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active',
            ADD FOREIGN KEY (role_id) REFERENCES roles(id)
        ");
    }

    public function down() {
        $this->pdo->exec("
            ALTER TABLE users 
            DROP FOREIGN KEY users_ibfk_1,
            DROP COLUMN role_id,
            DROP COLUMN gender,
            DROP COLUMN profile_image,
            DROP COLUMN status
        ");
    }
}
?> 