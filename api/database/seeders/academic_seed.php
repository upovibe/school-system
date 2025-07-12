<?php
// api/database/seeders/academic_seed.php - Academic structure seeder

class AcademicSeed {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Starting academic structure seeding...\n\n";
        
        $this->seedLevels();
        $this->seedTracks();
        $this->seedAcademicYears();
        $this->seedTerms();
        
        echo "\n✅ Academic structure seeding completed!\n";
    }
    
    private function seedLevels() {
        echo "📝 Seeding levels...\n";
        
        $levels = [
            // Kindergarten
            ['name' => 'KG1', 'order_index' => 1, 'stage' => 'kindergarten'],
            ['name' => 'KG2', 'order_index' => 2, 'stage' => 'kindergarten'],
            
            // Primary
            ['name' => 'Primary 1', 'order_index' => 3, 'stage' => 'primary'],
            ['name' => 'Primary 2', 'order_index' => 4, 'stage' => 'primary'],
            ['name' => 'Primary 3', 'order_index' => 5, 'stage' => 'primary'],
            ['name' => 'Primary 4', 'order_index' => 6, 'stage' => 'primary'],
            ['name' => 'Primary 5', 'order_index' => 7, 'stage' => 'primary'],
            ['name' => 'Primary 6', 'order_index' => 8, 'stage' => 'primary'],
            
            // JHS
            ['name' => 'JHS 1', 'order_index' => 9, 'stage' => 'jhs'],
            ['name' => 'JHS 2', 'order_index' => 10, 'stage' => 'jhs'],
            ['name' => 'JHS 3', 'order_index' => 11, 'stage' => 'jhs'],
            
            // SHS
            ['name' => 'SHS 1', 'order_index' => 12, 'stage' => 'shs'],
            ['name' => 'SHS 2', 'order_index' => 13, 'stage' => 'shs'],
            ['name' => 'SHS 3', 'order_index' => 14, 'stage' => 'shs']
        ];
        
        $insertStmt = $this->pdo->prepare('
            INSERT INTO levels (name, order_index, stage, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?)
        ');
        
        $checkStmt = $this->pdo->prepare('SELECT id FROM levels WHERE name = ?');
        $inserted = 0;
        
        foreach ($levels as $level) {
            // Check if level already exists
            $checkStmt->execute([$level['name']]);
            if ($checkStmt->fetch()) {
                echo "  ⏭️  Level '{$level['name']}' already exists, skipping...\n";
                continue;
            }
            
            $insertStmt->execute([
                $level['name'],
                $level['order_index'],
                $level['stage'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            $inserted++;
        }
        
        echo "✅ Seeded " . $inserted . " new levels\n";
    }
    
    private function seedTracks() {
        echo "📝 Seeding tracks...\n";
        
        $tracks = [
            [
                'name' => 'Single Track',
                'description' => 'Traditional single track system'
            ],
            [
                'name' => 'Green',
                'description' => 'Green track for double-track system'
            ],
            [
                'name' => 'Gold',
                'description' => 'Gold track for double-track system'
            ]
        ];
        
        $insertStmt = $this->pdo->prepare('
            INSERT INTO tracks (name, description, created_at, updated_at) 
            VALUES (?, ?, ?, ?)
        ');
        
        $checkStmt = $this->pdo->prepare('SELECT id FROM tracks WHERE name = ?');
        $inserted = 0;
        
        foreach ($tracks as $track) {
            // Check if track already exists
            $checkStmt->execute([$track['name']]);
            if ($checkStmt->fetch()) {
                echo "  ⏭️  Track '{$track['name']}' already exists, skipping...\n";
                continue;
            }
            
            $insertStmt->execute([
                $track['name'],
                $track['description'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            $inserted++;
        }
        
        echo "✅ Seeded " . $inserted . " new tracks\n";
    }
    
    private function seedAcademicYears() {
        echo "📝 Seeding academic years...\n";
        
        $academicYears = [
            [
                'name' => '2024/2025',
                'start_date' => '2024-09-01',
                'end_date' => '2025-07-31',
                'is_active' => 1
            ],
            [
                'name' => '2025/2026',
                'start_date' => '2025-09-01',
                'end_date' => '2026-07-31',
                'is_active' => 0
            ]
        ];
        
        $insertStmt = $this->pdo->prepare('
            INSERT INTO academic_years (name, start_date, end_date, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        
        $checkStmt = $this->pdo->prepare('SELECT id FROM academic_years WHERE name = ?');
        $inserted = 0;
        
        foreach ($academicYears as $year) {
            // Check if academic year already exists
            $checkStmt->execute([$year['name']]);
            if ($checkStmt->fetch()) {
                echo "  ⏭️  Academic year '{$year['name']}' already exists, skipping...\n";
                continue;
            }
            
            $insertStmt->execute([
                $year['name'],
                $year['start_date'],
                $year['end_date'],
                $year['is_active'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            $inserted++;
        }
        
        echo "✅ Seeded " . $inserted . " new academic years\n";
    }
    
    private function seedTerms() {
        echo "📝 Seeding terms...\n";
        
        // Get the active academic year
        $stmt = $this->pdo->prepare('SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1');
        $stmt->execute();
        $academicYear = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$academicYear) {
            echo "⚠️  No active academic year found. Skipping terms.\n";
            return;
        }
        
        $terms = [
            [
                'academic_year_id' => $academicYear['id'],
                'number' => 1,
                'name' => 'First Term',
                'start_date' => '2024-09-01',
                'end_date' => '2024-12-20',
                'break_start' => '2024-12-21',
                'break_end' => '2025-01-05',
                'is_active' => 0
            ],
            [
                'academic_year_id' => $academicYear['id'],
                'number' => 2,
                'name' => 'Second Term',
                'start_date' => '2025-01-06',
                'end_date' => '2025-04-15',
                'break_start' => '2025-04-16',
                'break_end' => '2025-04-30',
                'is_active' => 0
            ],
            [
                'academic_year_id' => $academicYear['id'],
                'number' => 3,
                'name' => 'Third Term',
                'start_date' => '2025-05-01',
                'end_date' => '2025-07-31',
                'break_start' => null,
                'break_end' => null,
                'is_active' => 0
            ]
        ];
        
        $insertStmt = $this->pdo->prepare('
            INSERT INTO terms (academic_year_id, number, name, start_date, end_date, break_start, break_end, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $checkStmt = $this->pdo->prepare('SELECT id FROM terms WHERE academic_year_id = ? AND number = ?');
        $inserted = 0;
        
        foreach ($terms as $term) {
            // Check if term already exists for this academic year and number
            $checkStmt->execute([$term['academic_year_id'], $term['number']]);
            if ($checkStmt->fetch()) {
                echo "  ⏭️  Term {$term['number']} for academic year already exists, skipping...\n";
                continue;
            }
            
            $insertStmt->execute([
                $term['academic_year_id'],
                $term['number'],
                $term['name'],
                $term['start_date'],
                $term['end_date'],
                $term['break_start'],
                $term['break_end'],
                $term['is_active'],
                date('Y-m-d H:i:s'),
                date('Y-m-d H:i:s')
            ]);
            $inserted++;
        }
        
        echo "✅ Seeded " . $inserted . " new terms\n";
    }
}
?> 