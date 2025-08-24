<?php

class Migration_20241001000071createfeeinvoicestable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "CREATE TABLE IF NOT EXISTS fee_invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            academic_year VARCHAR(100) NOT NULL,
            grading_period VARCHAR(100) NOT NULL,
            student_type VARCHAR(100) NOT NULL DEFAULT 'Day',
            invoice_number VARCHAR(50) NOT NULL,
            status ENUM('draft','open','paid') NOT NULL DEFAULT 'open',
            issue_date DATE NOT NULL,
            due_date DATE NULL,
            amount_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            notes TEXT NULL,
            schedule_id INT NULL,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_invoice_number (invoice_number),
            UNIQUE KEY uniq_student_year_grading_period (student_id, academic_year, grading_period),
            INDEX idx_student (student_id),
            INDEX idx_year_grading_period (academic_year, grading_period),
            CONSTRAINT fk_fee_invoices_student FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE RESTRICT,
            CONSTRAINT fk_fee_invoices_schedule FOREIGN KEY (schedule_id) REFERENCES fee_schedules(id) ON UPDATE CASCADE ON DELETE SET NULL,
            CONSTRAINT fk_fee_invoices_user FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

        $this->pdo->exec($sql);
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS fee_invoices");
    }
}


