<?php

class Migration_20241001000037removeparentstaffroles {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        // First, get the role IDs for parent and staff
        $stmt = $this->pdo->prepare("SELECT id FROM roles WHERE name IN ('parent', 'staff')");
        $stmt->execute();
        $rolesToRemove = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($rolesToRemove)) {
            // Remove users who have parent or staff roles
            $placeholders = str_repeat('?,', count($rolesToRemove) - 1) . '?';
            $stmt = $this->pdo->prepare("DELETE FROM users WHERE role_id IN ($placeholders)");
            $stmt->execute($rolesToRemove);
            
            // Remove the parent and staff roles
            $stmt = $this->pdo->prepare("DELETE FROM roles WHERE name IN ('parent', 'staff')");
            $stmt->execute();
        }
    }

    public function down() {
        // Recreate the parent and staff roles (but this will not restore deleted users)
        $this->pdo->exec("
            INSERT IGNORE INTO roles (name, description) VALUES 
            ('parent', 'Parent with access to child information'),
            ('staff', 'Staff member with administrative access')
        ");
    }
}
?>
