<?php
// api/controllers/PublicStatsController.php - Public statistics for community display

class PublicStatsController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Get public community statistics (no auth required)
     */
    public function getCommunityStats() {
        try {
            // Get student count (active students only)
            $studentSql = "SELECT COUNT(*) as count FROM students WHERE status = 'active'";
            $studentStmt = $this->pdo->prepare($studentSql);
            $studentStmt->execute();
            $studentCount = $studentStmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Get teacher count (active teachers only)
            $teacherSql = "SELECT COUNT(*) as count FROM teachers WHERE status = 'active'";
            $teacherStmt = $this->pdo->prepare($teacherSql);
            $teacherStmt->execute();
            $teacherCount = $teacherStmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Get family count (total of everyone: students + teachers + admin + cashier)
            $familyCount = $studentCount + $teacherCount;
            
            // Add admin and cashier users
            $adminCashierSql = "SELECT COUNT(*) as count FROM users u 
                               INNER JOIN roles r ON u.role_id = r.id 
                               WHERE r.name IN ('admin', 'cashier') AND u.status = 'active'";
            $adminCashierStmt = $this->pdo->prepare($adminCashierSql);
            $adminCashierStmt->execute();
            $adminCashierCount = $adminCashierStmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            $familyCount += $adminCashierCount;

            $stats = [
                'students' => (int)$studentCount,
                'teachers' => (int)$teacherCount,
                'families' => (int)$familyCount
            ];
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $stats,
                'message' => 'Community statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving community statistics: ' . $e->getMessage()
            ]);
        }
    }
}
?>
