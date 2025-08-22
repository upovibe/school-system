<?php
// api/controllers/AcademicYearController.php - Controller for academic year management

require_once __DIR__ . '/../models/AcademicYearModel.php';
require_once __DIR__ . '/../models/AcademicYearRecordModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class AcademicYearController {
    private $pdo;
    private $academicYearModel;
    private $academicYearRecordModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->academicYearModel = new AcademicYearModel($pdo);
        $this->academicYearRecordModel = new AcademicYearRecordModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all academic years (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $academicYears = $this->academicYearModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $academicYears,
                'message' => 'Academic years retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving academic years: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get current academic year
     */
    public function getCurrent() {
        try {
            $currentYear = $this->academicYearModel->getCurrentAcademicYear();
            
            if (!$currentYear) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No current academic year found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $currentYear,
                'message' => 'Current academic year retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving current academic year: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active academic years (admin only)
     */
    public function getActive() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $activeYears = $this->academicYearModel->getActiveAcademicYears();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $activeYears,
                'message' => 'Active academic years retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active academic years: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get academic years for dropdown/selection (admin only)
     */
    public function getForSelection() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $selectionYears = $this->academicYearModel->getForSelection();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $selectionYears,
                'message' => 'Academic years for selection retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving academic years for selection: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new academic year (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $required = ['year_code', 'display_name', 'start_date', 'end_date'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => "Field '$field' is required"
                    ]);
                    return;
                }
            }

            // Check if year code already exists
            if ($this->academicYearModel->yearExists($input['year_code'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year with this code already exists'
                ]);
                return;
            }

            // Set default values
            $input['is_active'] = $input['is_active'] ?? false;
            $input['is_current'] = $input['is_current'] ?? false;
            $input['status'] = $input['status'] ?? 'active';

            // Convert boolean values to integers for database
            $input['is_active'] = $input['is_active'] ? 1 : 0;
            $input['is_current'] = $input['is_current'] ? 1 : 0;

            // If setting as current, remove current flag from others
            if ($input['is_current']) {
                $this->academicYearModel->setAsCurrent(null); // This will clear all current flags
            }

            $academicYearId = $this->academicYearModel->create($input);
            
            // Get the created record
            $academicYear = $this->academicYearModel->findById($academicYearId);
            
            // Log the action
            global $currentUser;
            $this->userLogModel->logAction($currentUser['id'], 'academic_year_created', [
                'academic_year_id' => $academicYearId,
                'year_code' => $input['year_code']
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $academicYear,
                'message' => 'Academic year created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating academic year: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a single academic year by ID (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $academicYear = $this->academicYearModel->findById($id);
            
            if (!$academicYear) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $academicYear,
                'message' => 'Academic year retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving academic year: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update an academic year (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $input = json_decode(file_get_contents('php://input'), true);
            
            // Check if academic year exists
            $existingYear = $this->academicYearModel->findById($id);
            if (!$existingYear) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year not found'
                ]);
                return;
            }

            // Convert boolean values to integers for database
            if (isset($input['is_active'])) {
                $input['is_active'] = $input['is_active'] ? 1 : 0;
            }
            if (isset($input['is_current'])) {
                $input['is_current'] = $input['is_current'] ? 1 : 0;
            }

            // If setting as current, remove current flag from others
            if (isset($input['is_current']) && $input['is_current']) {
                $this->academicYearModel->setAsCurrent(null); // Clear all current flags
            }

            $updateResult = $this->academicYearModel->update($id, $input);
            
            if ($updateResult) {
                // Get the updated record
                $academicYear = $this->academicYearModel->findById($id);
                
                // Log the action
                global $currentUser;
                $this->userLogModel->logAction($currentUser['id'], 'academic_year_updated', [
                    'academic_year_id' => $id,
                    'year_code' => $existingYear['year_code']
                ]);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $academicYear,
                    'message' => 'Academic year updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating academic year'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating academic year: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Archive an academic year (admin only)
     */
    public function archive($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            // Check if academic year exists
            $existingYear = $this->academicYearModel->findById($id);
            if (!$existingYear) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year not found'
                ]);
                return;
            }

            // Check if it's already archived
            if ($existingYear['status'] === 'archived') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year is already archived'
                ]);
                return;
            }

            // Create archive record first
            global $currentUser;
            $archiveResult = $this->academicYearRecordModel->archiveCompleteYear(
                $id, 
                $existingYear['year_code'], 
                $currentUser['id'],
                'Academic year archived by admin'
            );

            // Then mark academic year as archived
            $this->academicYearModel->archiveAcademicYear($id);
            
            // Log the action
            $this->userLogModel->logAction($currentUser['id'], 'academic_year_archived', [
                'academic_year_id' => $id,
                'year_code' => $existingYear['year_code'],
                'archive_record_id' => $archiveResult['id']
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Academic year archived successfully',
                'archive_record_id' => $archiveResult['id']
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error archiving academic year: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete an academic year (admin only) - only if not archived
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            // Check if academic year exists
            $existingYear = $this->academicYearModel->findById($id);
            if (!$existingYear) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year not found'
                ]);
                return;
            }

            // Prevent deletion of archived years
            if ($existingYear['status'] === 'archived') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cannot delete archived academic year. Use archive instead.'
                ]);
                return;
            }

            // Prevent deletion of current year
            if ($existingYear['is_current']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cannot delete current academic year'
                ]);
                return;
            }

            $this->academicYearModel->delete($id);
            
            // Log the action
            global $currentUser;
            $this->userLogModel->logAction($currentUser['id'], 'academic_year_deleted', [
                'academic_year_id' => $id,
                'year_code' => $existingYear['year_code']
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Academic year deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting academic year: ' . $e->getMessage()
            ]);
        }
    }
}
?>
