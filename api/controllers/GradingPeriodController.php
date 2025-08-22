<?php
// api/controllers/GradingPeriodController.php - Controller for managing grading periods

require_once __DIR__ . '/../models/GradingPeriodModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class GradingPeriodController {
    private $pdo;
    private $gradingPeriodModel;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->gradingPeriodModel = new GradingPeriodModel($pdo);
    }
    
    /**
     * Get current academic year switch date (admin only)
     */
    public function getAcademicYearSwitchDate() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Get the current academic year from the database
            $sql = "SELECT start_date FROM academic_years WHERE is_current = 1 LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $currentYear = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($currentYear) {
                $switchDate = $currentYear['start_date'];
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'switch_date' => $switchDate,
                        'current_academic_year' => $this->getCurrentAcademicYearDisplay()
                    ],
                    'message' => 'Academic year switch date retrieved successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Current academic year not found'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving academic year switch date: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get all grading periods (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $periods = $this->gradingPeriodModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $periods,
                'message' => 'Grading periods retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving grading periods: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get a specific grading period (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $period = $this->gradingPeriodModel->findById($id);
            
            if (!$period) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grading period not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $period,
                'message' => 'Grading period retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving grading period: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create a new grading period (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Period name is required'
                ]);
                return;
            }

            // Always compute academic year ID on the server (ignore client input)
            $data['academic_year_id'] = $this->getCurrentAcademicYearId();

            if (empty($data['start_date'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Start date is required'
                ]);
                return;
            }

            if (empty($data['end_date'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'End date is required'
                ]);
                return;
            }
            
            // Validate date range
            $startDate = new DateTime($data['start_date']);
            $endDate = new DateTime($data['end_date']);
            
            if ($startDate >= $endDate) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'End date must be after start date'
                ]);
                return;
            }
            
            $periodData = [
                'name' => $data['name'],
                'academic_year_id' => $data['academic_year_id'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'description' => $data['description'] ?? '',
                'is_active' => $data['is_active'] ?? 1,
                'created_by' => $this->getCurrentUserId()
            ];
            
            $periodId = $this->gradingPeriodModel->create($periodData);
            
            // Log the action
            $this->logAction('grading_period_created', "Created grading period: {$data['name']}", [
                'period_id' => $periodId,
                'academic_year_id' => $data['academic_year_id']
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Grading period created successfully',
                'data' => ['id' => $periodId]
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating grading period: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Update an existing grading period (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if period exists
            $existingPeriod = $this->gradingPeriodModel->findById($id);
            if (!$existingPeriod) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grading period not found'
                ]);
                return;
            }
            
            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Period name is required'
                ]);
                return;
            }

            // Do not allow client to change academic year on update; keep original
            $data['academic_year_id'] = $existingPeriod['academic_year_id'];

            if (empty($data['start_date'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Start date is required'
                ]);
                return;
            }

            if (empty($data['end_date'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'End date is required'
                ]);
                return;
            }
            
            // Validate date range
            $startDate = new DateTime($data['start_date']);
            $endDate = new DateTime($data['end_date']);
            
            if ($startDate >= $endDate) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'End date must be after start date'
                ]);
                return;
            }
            
            $periodData = [
                'name' => $data['name'],
                'academic_year_id' => $data['academic_year_id'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'description' => $data['description'] ?? $existingPeriod['description'],
                'is_active' => $data['is_active'] ?? $existingPeriod['is_active']
            ];
            
            $this->gradingPeriodModel->update($id, $periodData);
            
            // Log the action
            $this->logAction('grading_period_updated', "Updated grading period: {$data['name']}", [
                'period_id' => $id,
                'academic_year_id' => $data['academic_year_id']
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Grading period updated successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating grading period: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete a grading period (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if period exists
            $period = $this->gradingPeriodModel->findById($id);
            if (!$period) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grading period not found'
                ]);
                return;
            }
            
            $this->gradingPeriodModel->delete($id);
            
            // Log the action
            $this->logAction('grading_period_deleted', "Deleted grading period: {$period['name']}", [
                'period_id' => $id,
                'academic_year_id' => $period['academic_year_id']
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Grading period deleted successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting grading period: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get the current academic year display name for API responses.
     * This is used to maintain backward compatibility in API responses.
     */
    private function getCurrentAcademicYearDisplay() {
        try {
            $sql = "SELECT year_code FROM academic_years WHERE is_current = 1 LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $currentYear = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($currentYear) {
                return $currentYear['year_code'];
            } else {
                // Fallback: get the most recent active academic year
                $sql = "SELECT year_code FROM academic_years WHERE is_active = 1 ORDER BY start_date DESC LIMIT 1";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
                $activeYear = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($activeYear) {
                    return $activeYear['year_code'];
                } else {
                    return 'No academic year found';
                }
            }
        } catch (Exception $e) {
            return 'Error getting academic year';
        }
    }

    /**
     * Get the current academic year ID from the database.
     * This is used to ensure consistency when creating new grading periods.
     */
    private function getCurrentAcademicYearId() {
        try {
            // Get the current academic year from the database
            $sql = "SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $currentYear = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($currentYear) {
                return $currentYear['id'];
            } else {
                // Fallback: get the most recent active academic year
                $sql = "SELECT id FROM academic_years WHERE is_active = 1 ORDER BY start_date DESC LIMIT 1";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
                $activeYear = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($activeYear) {
                    return $activeYear['id'];
                } else {
                    throw new Exception('No academic year found in the system');
                }
            }
        } catch (Exception $e) {
            throw new Exception('Error getting current academic year: ' . $e->getMessage());
        }
    }

    /**
     * Log action to user log
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            $logModel = new UserLogModel($this->pdo);
            $userId = $this->getCurrentUserId();
            
            $logModel->logAction($userId, $action, $description, $metadata);
        } catch (Exception $e) {
            // Silently fail logging
        }
    }
    
    /**
     * Get current user ID from session/token
     */
    private function getCurrentUserId() {
        try {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
                $parts = explode('.', $token);
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                return $payload['user_id'] ?? null;
            }
        } catch (Exception $e) {
            return null;
        }
        return null;
    }
}
?>
