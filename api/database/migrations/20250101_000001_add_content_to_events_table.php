<?php

class Migration_20250101000001addcontenttoeventstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            ALTER TABLE events 
            ADD COLUMN content LONGTEXT AFTER description
        ");
    }

    public function down() {
        $this->pdo->exec("
            ALTER TABLE events 
            DROP COLUMN content
        ");
    }
}
?>
