<?php

class Migration_20241001000009createtermstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS terms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                academic_year_id INT NOT NULL,
                number TINYINT NOT NULL,
                name VARCHAR(20),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                break_start DATE,
                break_end DATE,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS terms");
    }
}
?> 