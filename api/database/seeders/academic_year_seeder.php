<?php

/**
 * Academic Year Seeder
 * 
 * Seeds the academic_years table with sample data
 */

class AcademicYearSeeder {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function run() {
        echo "🌱 Seeding academic years...\n";

        // Check if academic years already exist
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM academic_years");
        $count = $stmt->fetchColumn();

        if ($count > 0) {
            echo "⚠️  Academic years already exist, skipping...\n";
            return;
        }

        // Sample academic year data
        $academicYears = [
            [
                'year_code' => '2023-2024',
                'display_name' => 'Academic Year 2023-2024',
                'start_date' => '2023-09-01',
                'end_date' => '2024-08-31',
                'is_active' => 1,
                'is_current' => 0,
                'status' => 'active'
            ],
            [
                'year_code' => '2024-2025',
                'display_name' => 'Academic Year 2024-2025',
                'start_date' => '2024-09-01',
                'end_date' => '2025-08-31',
                'is_active' => 1,
                'is_current' => 1,
                'status' => 'active'
            ],
            [
                'year_code' => '2025-2026',
                'display_name' => 'Academic Year 2025-2026',
                'start_date' => '2025-09-01',
                'end_date' => '2026-08-31',
                'is_active' => 1,
                'is_current' => 0,
                'status' => 'active'
            ]
        ];

        $inserted = 0;
        foreach ($academicYears as $yearData) {
            try {
                $sql = "INSERT INTO academic_years (year_code, display_name, start_date, end_date, is_active, is_current, status, created_at, updated_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
                
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $yearData['year_code'],
                    $yearData['display_name'],
                    $yearData['start_date'],
                    $yearData['end_date'],
                    $yearData['is_active'],
                    $yearData['is_current'],
                    $yearData['status']
                ]);

                $inserted++;
                echo "✅ Added academic year: {$yearData['year_code']}\n";
            } catch (Exception $e) {
                echo "❌ Error adding academic year {$yearData['year_code']}: " . $e->getMessage() . "\n";
            }
        }

        echo "🎉 Academic year seeding completed! Added {$inserted} academic years.\n";
    }
}
