<?php
// api/database/seeders/application_seeder.php

class ApplicationSeeder {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function run() {
        $stmt = $this->pdo->prepare("INSERT INTO applications (
            student_first_name, student_last_name, father_name, mother_name, guardian_name, parent_phone, student_phone, email, grade, created_at, updated_at
        ) VALUES (
            :student_first_name, :student_last_name, :father_name, :mother_name, :guardian_name, :parent_phone, :student_phone, :email, :grade, NOW(), NOW()
        )");
        $stmt->execute([
            'student_first_name' => 'John',
            'student_last_name' => 'Doe',
            'father_name' => 'Richard Doe',
            'mother_name' => 'Jane Doe',
            'guardian_name' => null,
            'parent_phone' => '+233-54-000-0000',
            'student_phone' => '+233-54-111-1111',
            'email' => 'johndoe@example.com',
            'grade' => 'Grade 5'
        ]);
    }
} 