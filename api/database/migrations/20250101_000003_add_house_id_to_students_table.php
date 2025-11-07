<?php

class Migration_20250101000003addhouseidtostudentstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        // Check if house_id column already exists
        $checkColumn = $this->pdo->query("SHOW COLUMNS FROM students LIKE 'house_id'");
        if ($checkColumn->rowCount() > 0) {
            echo "⚠️  Column 'house_id' already exists in students table, skipping...\n";
            return;
        }

        // Add house_id column to students table
        $this->pdo->exec("
            ALTER TABLE students 
            ADD COLUMN house_id INT NULL AFTER student_type,
            ADD FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE SET NULL,
            ADD INDEX idx_house_id (house_id)
        ");
    }

    public function down() {
        // Remove house_id column and its foreign key
        $this->pdo->exec("
            ALTER TABLE students 
            DROP FOREIGN KEY students_ibfk_3,
            DROP INDEX idx_house_id,
            DROP COLUMN house_id
        ");
    }
}
?>
