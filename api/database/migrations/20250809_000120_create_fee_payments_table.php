<?php

class Migration_20250809000120createfeepaymentstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "CREATE TABLE IF NOT EXISTS fee_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_id INT NOT NULL,
            student_id INT NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            method VARCHAR(50) NULL,
            reference VARCHAR(100) NULL,
            paid_on DATETIME NOT NULL,
            received_by INT NULL,
            notes TEXT NULL,
            status VARCHAR(20) NULL DEFAULT 'posted',
            voided_at DATETIME NULL,
            voided_by INT NULL,
            void_reason TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_invoice (invoice_id),
            INDEX idx_student (student_id),
            CONSTRAINT fk_fee_payments_invoice FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_fee_payments_student FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE RESTRICT,
            CONSTRAINT fk_fee_payments_user FOREIGN KEY (received_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
            CONSTRAINT fk_fee_payments_void_user FOREIGN KEY (voided_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

        $this->pdo->exec($sql);
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS fee_payments");
    }
}


