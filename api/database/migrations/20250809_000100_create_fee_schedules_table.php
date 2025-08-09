<?php

class Migration_20250809_000100_create_fee_schedules_table {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "CREATE TABLE IF NOT EXISTS fee_schedules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            academic_year VARCHAR(20) NOT NULL,
            term VARCHAR(20) NOT NULL,
            total_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_class_year_term (class_id, academic_year, term),
            INDEX idx_class (class_id),
            CONSTRAINT fk_fee_schedules_class FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

        $this->pdo->exec($sql);
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS fee_schedules");
    }
}


