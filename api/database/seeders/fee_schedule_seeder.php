<?php
// api/database/seeders/fee_schedule_seeder.php - Seeder for fee schedules

class FeeScheduleSeeder
{
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function run() {
        echo "🌱 Seeding fee schedules...\n";
        
        $this->seedFeeSchedules();
        
        echo "✅ Fee schedules seeded successfully!\n";
    }
    
    private function seedFeeSchedules() {
        echo "📝 Seeding fee schedules for Ghanaian education system...\n";
        
        // Get the current academic year ID (2024-2025)
        $academicYearId = $this->getCurrentAcademicYearId();
        if (!$academicYearId) {
            echo "❌ Error: Could not find academic year 2024-2025. Please run academic_year_seeder first.\n";
            return;
        }
        
        // Get all active classes for the current academic year
        $classes = $this->getActiveClasses($academicYearId);
        if (empty($classes)) {
            echo "❌ Error: No active classes found for academic year 2024-2025. Please run class_seeder first.\n";
            return;
        }
        
        $inserted = 0;
        foreach ($classes as $class) {
            $inserted += $this->seedClassFeeSchedules($class, $academicYearId);
        }
        
        echo "📊 Total fee schedules seeded: {$inserted}\n";
    }
    
    private function seedClassFeeSchedules($class, $academicYearId) {
        $inserted = 0;
        
        // Define terms for the academic year
        $terms = ['Term 1', 'Term 2', 'Term 3'];
        
        // Define student types
        $studentTypes = ['Day', 'Boarding'];
        
        // Base fees for different class levels (in Ghana Cedis)
        $baseFees = $this->getBaseFees($class['name']);
        
        foreach ($terms as $term) {
            foreach ($studentTypes as $studentType) {
                // Calculate fee based on class level and student type
                $totalFee = $this->calculateFee($baseFees, $studentType, $term);
                
                // Check if fee schedule already exists
                if (!$this->feeScheduleExists($class['id'], $term, $studentType)) {
                    $this->insertFeeSchedule($class['id'], $term, $studentType, $totalFee);
                    $inserted++;
                }
            }
        }
        
        echo "✅ Added {$inserted} fee schedules for {$class['name']} Section {$class['section']}\n";
        return $inserted;
    }
    
    private function getBaseFees($className) {
        // Base fees in Ghana Cedis for different class levels
        $fees = [
            'KG 1' => 500,
            'KG 2' => 500,
            'P 1' => 600,
            'P 2' => 600,
            'P 3' => 700,
            'P 4' => 700,
            'P 5' => 800,
            'P 6' => 800,
            'JHS 1' => 1000,
            'JHS 2' => 1000,
            'JHS 3' => 1200
        ];
        
        return $fees[$className] ?? 800; // Default fee if class not found
    }
    
    private function calculateFee($baseFee, $studentType, $term) {
        $fee = $baseFee;
        
        // Add boarding premium
        if ($studentType === 'Boarding') {
            $fee += 200; // Additional 200 GHS for boarding students
        }
        
        // Term-specific adjustments
        switch ($term) {
            case 'Term 1':
                $fee += 50; // Additional 50 GHS for first term (books, uniforms, etc.)
                break;
            case 'Term 2':
                // Base fee for second term
                break;
            case 'Term 3':
                $fee += 30; // Additional 30 GHS for third term (exam fees, etc.)
                break;
        }
        
        return $fee;
    }
    
    private function insertFeeSchedule($classId, $term, $studentType, $totalFee) {
        // Get the academic year string from the class
        $academicYear = $this->getClassAcademicYear($classId);
        if (!$academicYear) {
            echo "⚠️  Could not get academic year for class ID {$classId}\n";
            return false;
        }
        
        $stmt = $this->pdo->prepare('
            INSERT INTO fee_schedules (class_id, academic_year, term, student_type, total_fee, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
        ');
        
        $stmt->execute([
            $classId,
            $academicYear,
            $term,
            $studentType,
            $totalFee
        ]);
        
        return true;
    }
    
    private function feeScheduleExists($classId, $term, $studentType) {
        $stmt = $this->pdo->prepare('
            SELECT id FROM fee_schedules 
            WHERE class_id = ? AND term = ? AND student_type = ?
        ');
        $stmt->execute([$classId, $term, $studentType]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }
    
    private function getActiveClasses($academicYearId) {
        $stmt = $this->pdo->prepare('
            SELECT id, name, section, academic_year_id 
            FROM classes 
            WHERE academic_year_id = ? AND status = "active"
            ORDER BY name, section
        ');
        $stmt->execute([$academicYearId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getCurrentAcademicYearId() {
        $stmt = $this->pdo->prepare('SELECT id FROM academic_years WHERE year_code = ?');
        $stmt->execute(['2024-2025']);
        return $stmt->fetchColumn();
    }
    
    private function getClassAcademicYear($classId) {
        $stmt = $this->pdo->prepare('
            SELECT ay.year_code, ay.display_name
            FROM classes c 
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.id 
            WHERE c.id = ?
        ');
        $stmt->execute([$classId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return false;
        }
        
        // Return the full academic year format: "2024-2025 (Academic Year 2024-2025)"
        return $result['year_code'] . ' (' . $result['display_name'] . ')';
    }
}
?>
