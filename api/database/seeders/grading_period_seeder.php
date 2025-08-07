<?php
// api/database/seeders/grading_period_seeder.php - Seeder for grading periods

class GradingPeriodSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "📅 Seeding grading periods...\n";
        
        // Get the first admin user or create a default one
        $adminUserId = $this->getAdminUserId();
        
        $periods = [
            [
                'name' => 'First Term',
                'academic_year' => '2024-2025',
                'start_date' => '2024-09-01',
                'end_date' => '2024-12-15',
                'is_active' => 1, // Use integer instead of boolean
                'description' => 'First term of the 2024-2025 academic year',
                'created_by' => $adminUserId
            ],
            [
                'name' => 'Second Term',
                'academic_year' => '2024-2025',
                'start_date' => '2025-01-15',
                'end_date' => '2025-04-15',
                'is_active' => 0, // Use integer instead of boolean
                'description' => 'Second term of the 2024-2025 academic year',
                'created_by' => $adminUserId
            ],
            [
                'name' => 'Third Term',
                'academic_year' => '2024-2025',
                'start_date' => '2025-05-01',
                'end_date' => '2025-07-31',
                'is_active' => 0, // Use integer instead of boolean
                'description' => 'Third term of the 2024-2025 academic year',
                'created_by' => $adminUserId
            ]
        ];
        
        foreach ($periods as $period) {
            $this->seedGradingPeriod($period);
        }
        
        echo "📊 Total grading periods seeded: " . count($periods) . "\n";
    }
    
    /**
     * Get admin user ID or create a default one
     */
    private function getAdminUserId() {
        // Try to get the first admin user (role_id = 1 is typically admin)
        $stmt = $this->pdo->prepare("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin' LIMIT 1");
        $stmt->execute();
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            return $admin['id'];
        }
        
        // Fallback: try to get user with role_id = 1 (assuming admin is role_id 1)
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE role_id = 1 LIMIT 1");
        $stmt->execute();
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            return $admin['id'];
        }
        
        // If no admin user exists, try to get any user
        $stmt = $this->pdo->prepare("SELECT id FROM users LIMIT 1");
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            return $user['id'];
        }
        
        // If no users exist, return null (will be handled by foreign key constraint)
        return null;
    }
    
    /**
     * Seed individual grading period
     */
    private function seedGradingPeriod($periodData) {
        // Check if period already exists
        $stmt = $this->pdo->prepare('SELECT id FROM grading_periods WHERE name = ? AND academic_year = ?');
        $stmt->execute([$periodData['name'], $periodData['academic_year']]);
        $existingPeriod = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingPeriod) {
            echo "⚠️  Grading period {$periodData['name']} for {$periodData['academic_year']} already exists\n";
            return;
        }
        
        // Check if created_by is null and handle it
        if ($periodData['created_by'] === null) {
            echo "⚠️  No user found for created_by. Skipping grading period {$periodData['name']}\n";
            return;
        }
        
        // Insert period
        $sql = "INSERT INTO grading_periods (name, academic_year, start_date, end_date, is_active, description, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $periodData['name'],
            $periodData['academic_year'],
            $periodData['start_date'],
            $periodData['end_date'],
            $periodData['is_active'],
            $periodData['description'],
            $periodData['created_by']
        ]);
        
        echo "✅ Grading period {$periodData['name']} seeded\n";
    }
}
?>
