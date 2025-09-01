<?php
// api/controllers/TimetableResourceController.php - Controller for timetable resource operations

require_once __DIR__ . '/../models/TimetableResourceModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../utils/timetable_resource_uploads.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class TimetableResourceController {
    private $timetableResourceModel;
    private $logModel;

    public function __construct($pdo) {
        $this->timetableResourceModel = new TimetableResourceModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    /**
     * Get all timetable resources with class information
     */
    public function index() {
        try {
            ob_clean();
            
            $resources = $this->timetableResourceModel->getAllWithClassInfo();
            
            echo json_encode([
                'success' => true,
                'data' => $resources,
                'message' => 'Timetable resources retrieved successfully'
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }

    /**
     * Create new timetable resource
     */
    public function store() {
        try {
            // Require authentication for creating
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            // Parse multipart form data
            $data = $_POST;
            $file = $_FILES['file'] ?? null;
            
            // Validate required fields
            if (!isset($data['title']) || !isset($data['class_id']) || !$file) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Title, class_id, and file are required'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Upload file
            $uploadResult = uploadTimetableResourceFile($file);
            if (!$uploadResult['success']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $uploadResult['message']
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Get the current user ID from the global variable set by AuthMiddleware
            global $currentUser;
            if (!$currentUser) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not authenticated'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Prepare data for database
            $resourceData = [
                'title' => $data['title'],
                'class_id' => $data['class_id'],
                'attachment_file' => $uploadResult['filepath'],
                'created_by' => $currentUser['id']
            ];
            
            $id = $this->timetableResourceModel->create($resourceData);
            
            if ($id) {
                // Get the created resource data
                $createdResource = $this->timetableResourceModel->findById($id);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $createdResource,
                    'message' => 'Timetable resource created successfully'
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to create timetable resource'
                ], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }

    /**
     * Get timetable resource by ID
     */
    public function show($id) {
        try {
            ob_clean();
            
            $resource = $this->timetableResourceModel->getByIdWithClassInfo($id);
            if (!$resource) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Timetable resource not found'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $resource,
                'message' => 'Timetable resource retrieved successfully'
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }

    /**
     * Update timetable resource
     */
    public function update($id) {
        try {
            // Require authentication for updating
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            // Check if resource exists
            $existingResource = $this->timetableResourceModel->findById($id);
            if (!$existingResource) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Timetable resource not found'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Handle multipart/form-data for PUT requests
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            if (strpos($contentType, 'multipart/form-data') !== false && $_SERVER['REQUEST_METHOD'] === 'PUT') {
                $rawData = file_get_contents('php://input');
                require_once __DIR__ . '/../core/MultipartFormParser.php';
                MultipartFormParser::processRequest($rawData, $contentType);
            }
            
            // Parse multipart form data
            $data = $_POST;
            $file = $_FILES['file'] ?? null;
            
            // Debug: Log what we received
            error_log("TimetableResource Update - Received data: " . print_r($data, true));
            error_log("TimetableResource Update - Received files: " . print_r($_FILES, true));
            
            // Prepare update data - always include fields that are provided, even if unchanged
            $updateData = [];
            
            // Always include title and class_id if they are provided in the request
            if (isset($data['title'])) {
                $updateData['title'] = $data['title'];
            }
            if (isset($data['class_id'])) {
                $updateData['class_id'] = $data['class_id'];
            }
            
            // Handle file update if provided
            if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
                // Delete old file
                if ($existingResource['attachment_file']) {
                    deleteTimetableResourceFile($existingResource['attachment_file']);
                }
                
                // Upload new file
                $uploadResult = uploadTimetableResourceFile($file);
                if (!$uploadResult['success']) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => $uploadResult['message']
                    ], JSON_PRETTY_PRINT);
                    return;
                }
                
                $updateData['attachment_file'] = $uploadResult['filepath'];
            }
            
            // Check if we have any data to update
            if (empty($updateData)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'No fields to update. Please provide title, class_id, or a new file.'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            $result = $this->timetableResourceModel->update($id, $updateData);
            
            if ($result) {
                // Get the updated resource data
                $updatedResource = $this->timetableResourceModel->findById($id);
                
                echo json_encode([
                    'success' => true,
                    'data' => $updatedResource,
                    'message' => 'Timetable resource updated successfully'
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to update timetable resource'
                ], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }

    /**
     * Delete timetable resource
     */
    public function destroy($id) {
        try {
            // Require authentication for deleting
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            // Check if resource exists
            $existingResource = $this->timetableResourceModel->findById($id);
            if (!$existingResource) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Timetable resource not found'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Delete file from storage
            if ($existingResource['attachment_file']) {
                deleteTimetableResourceFile($existingResource['attachment_file']);
            }
            
            // Delete from database
            $result = $this->timetableResourceModel->delete($id);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Timetable resource deleted successfully'
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to delete timetable resource'
                ], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }

    /**
     * Download timetable resource file (no authentication required)
     */
    public function download($id) {
        try {
            ob_clean();
            
            $resource = $this->timetableResourceModel->findById($id);
            if (!$resource) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Timetable resource not found'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            if (!$resource['attachment_file']) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'No file attached to this resource'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Download the file
            downloadTimetableResourceFile($resource['attachment_file'], $resource['title']);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }

    /**
     * Get timetable resources by class
     */
    public function getByClass($classId) {
        try {
            ob_clean();
            
            $resources = $this->timetableResourceModel->getByClass($classId);
            
            echo json_encode([
                'success' => true,
                'data' => $resources,
                'message' => 'Timetable resources retrieved successfully'
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }

    /**
     * Get timetable resources created by current user (for teachers)
     */
    public function getMyResources() {
        try {
            // Require authentication
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            global $currentUser;
            if (!$currentUser) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not authenticated'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Get resources created by current user
            $resources = $this->timetableResourceModel->getByCreator($currentUser['id']);
            
            echo json_encode([
                'success' => true,
                'data' => $resources,
                'message' => 'Your timetable resources retrieved successfully'
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }
}
?>
