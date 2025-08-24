<?php
// api/controllers/AcademicYearRecordController.php - Controller for viewing archived academic year records

require_once __DIR__ . '/../models/AcademicYearRecordModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class AcademicYearRecordController {
    private $pdo;
    private $academicYearRecordModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->academicYearRecordModel = new AcademicYearRecordModel($pdo);
    }

    /**
     * Get all archived records (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecords = $this->academicYearRecordModel->findAllWithUserInfo();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $archivedRecords,
                'message' => 'Archived records retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving archived records: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get archived records by academic year ID (admin only)
     */
    public function getByAcademicYear($academicYearId) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecords = $this->academicYearRecordModel->getByAcademicYear($academicYearId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $archivedRecords,
                'message' => 'Archived records for academic year retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving archived records: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get archived records by year code (admin only)
     */
    public function getByYearCode($yearCode) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecords = $this->academicYearRecordModel->getByYearCode($yearCode);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $archivedRecords,
                'message' => 'Archived records for year code retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving archived records: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a single archived record by ID (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecord = $this->academicYearRecordModel->findById($id);
            
            if (!$archivedRecord) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Archived record not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $archivedRecord,
                'message' => 'Archived record retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving archived record: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Export archived record data (admin only)
     */
    public function export($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecord = $this->academicYearRecordModel->findById($id);
            
            if (!$archivedRecord) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Archived record not found'
                ]);
                return;
            }

            // Decode the JSON data
            $recordData = json_decode($archivedRecord['record_data'], true);
            
            // Prepare export data
            $exportData = [
                'archive_info' => [
                    'id' => $archivedRecord['id'],
                    'year_code' => $archivedRecord['year_code'],
                    'archive_date' => $archivedRecord['archive_date'],
                    'total_records' => $archivedRecord['total_records'],
                    'notes' => $archivedRecord['notes']
                ],
                'data' => $recordData
            ];
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $exportData,
                'message' => 'Archived record exported successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error exporting archived record: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search archived records (admin only)
     */
    public function search() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $input = json_decode(file_get_contents('php://input'), true);
            
            $searchTerm = $input['search'] ?? '';
            $yearCode = $input['year_code'] ?? '';
            $recordType = $input['record_type'] ?? '';
            
            // Build search query
            $whereConditions = [];
            $params = [];
            
            if (!empty($searchTerm)) {
                $whereConditions[] = "notes LIKE ?";
                $params[] = "%$searchTerm%";
            }
            
            if (!empty($yearCode)) {
                $whereConditions[] = "year_code = ?";
                $params[] = $yearCode;
            }
            
            if (!empty($recordType)) {
                $whereConditions[] = "record_type = ?";
                $params[] = $recordType;
            }
            
            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
            
            $sql = "SELECT * FROM academic_year_records $whereClause ORDER BY archive_date DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $results,
                'message' => 'Search completed successfully',
                'total_results' => count($results)
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching archived records: ' . $e->getMessage()
            ]);
        }
    }
}
?>
