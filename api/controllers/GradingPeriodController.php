<?php
// api/controllers/GradingPeriodController.php - Controller for managing grading periods

require_once __DIR__ . '/../models/GradingPeriodModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/SettingModel.php';
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
            
            $settingModel = new SettingModel($this->pdo);
            $switchDate = $settingModel->getAcademicYearSwitchDate();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'switch_date' => $switchDate,
                    'current_academic_year' => $this->getCurrentAcademicYear()
                ],
                'message' => 'Academic year switch date retrieved successfully'
            ]);
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

            // Always compute academic year on the server (ignore client input)
            $data['academic_year'] = $this->getCurrentAcademicYear();

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
                'academic_year' => $data['academic_year'],
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
                'academic_year' => $data['academic_year']
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
            $data['academic_year'] = $existingPeriod['academic_year'];

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
                'academic_year' => $data['academic_year'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'description' => $data['description'] ?? $existingPeriod['description'],
                'is_active' => $data['is_active'] ?? $existingPeriod['is_active']
            ];
            
            $this->gradingPeriodModel->update($id, $periodData);
            
            // Log the action
            $this->logAction('grading_period_updated', "Updated grading period: {$data['name']}", [
                'period_id' => $id,
                'academic_year' => $data['academic_year']
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
                'academic_year' => $period['academic_year']
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
     * Compute current academic year based on the configured switch date.
     * Uses the 'academic_year_switch_date' setting to determine when the academic year changes.
     */
    private function getCurrentAcademicYear() {
        try {
            // Get the academic year switch date from settings
            $settingModel = new SettingModel($this->pdo);
            $switchDate = $settingModel->getAcademicYearSwitchDate();
            
            // Parse the switch date (format: MM-DD)
            $switchParts = explode('-', $switchDate);
            if (count($switchParts) !== 2) {
                // Fallback to default September 1st if format is invalid
                $switchMonth = 9;
                $switchDay = 1;
            } else {
                $switchMonth = (int)$switchParts[0];
                $switchDay = (int)$switchParts[1];
            }
            
            $now = new DateTime('now');
            $currentYear = (int)$now->format('Y');
            
            // Create the switch date for current year
            $switchDateThisYear = new DateTime("$currentYear-$switchMonth-$switchDay");
            
            // If today is on or after the switch date, start new academic year
            // If today is before the switch date, we're still in the previous academic year
            if ($now >= $switchDateThisYear) {
                $start = $currentYear;
                $end = $currentYear + 1;
            } else {
                $start = $currentYear - 1;
                $end = $currentYear;
            }
            
            return $start . '-' . $end;
        } catch (Exception $e) {
            // Fallback to default September 1st logic if there's an error
            $now = new DateTime('now');
            $year = (int)$now->format('Y');
            $month = (int)$now->format('n');
            if ($month >= 9) {
                $start = $year;
                $end = $year + 1;
            } else {
                $start = $year - 1;
                $end = $year;
            }
            return $start . '-' . $end;
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
