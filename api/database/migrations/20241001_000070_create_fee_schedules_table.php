<?php

class Migration_20241001000070createfeeschedulestable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "CREATE TABLE IF NOT EXISTS fee_schedules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            academic_year VARCHAR(50) NOT NULL,
            term VARCHAR(20) NOT NULL,
            student_type VARCHAR(20) NOT NULL DEFAULT 'Day',
            total_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            notes TEXT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_class_year_term_type (class_id, academic_year, term, student_type),
            INDEX idx_class (class_id),
            INDEX idx_academic_year (academic_year),
            CONSTRAINT fk_fee_schedules_class FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

        $this->pdo->exec($sql);
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS fee_schedules");
    }
}


