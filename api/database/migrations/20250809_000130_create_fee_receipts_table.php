<?php

class Migration_20250809000130createfeereceiptstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $sql = "CREATE TABLE IF NOT EXISTS fee_receipts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            payment_id INT NOT NULL,
            receipt_number VARCHAR(50) NOT NULL,
            printed_on DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_receipt_number (receipt_number),
            INDEX idx_payment (payment_id),
            CONSTRAINT fk_fee_receipts_payment FOREIGN KEY (payment_id) REFERENCES fee_payments(id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

        $this->pdo->exec($sql);
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS fee_receipts");
    }
}


