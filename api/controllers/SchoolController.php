<?php
// api/controllers/SchoolController.php - Controller for school operations

require_once __DIR__ . '/../models/SchoolModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class SchoolController {
    private $schoolModel;
    private $logModel;

    public function __construct($pdo) {
        $this->schoolModel = new SchoolModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            // Require admin role
            require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            ob_clean();
            
            $schools = $this->schoolModel->getActiveSchools();
            
            echo json_encode($schools, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function store() {
        try {
            // Require admin role
            require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['name']) || !isset($data['type'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name and type are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if school code already exists
            if (isset($data['code'])) {
                $existingSchool = $this->schoolModel->findByCode($data['code']);
                if ($existingSchool) {
                    http_response_code(400);
                    echo json_encode(['error' => 'School code already exists'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            $id = $this->schoolModel->create($data);
            
            // Log school creation
            global $currentUser;
            $this->logModel->logAction($currentUser['id'], 'school_created', 'New school created', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $id, 
                'message' => 'School created successfully'
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function show($id) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $school = $this->schoolModel->findById($id);
            if (!$school) {
                http_response_code(404);
                echo json_encode(['error' => 'School not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($school, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function update($id) {
        try {
            // Require admin role
            require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if school exists
            $existingSchool = $this->schoolModel->findById($id);
            if (!$existingSchool) {
                http_response_code(404);
                echo json_encode(['error' => 'School not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check school code uniqueness if code is being updated
            if (isset($data['code']) && $data['code'] !== $existingSchool['code']) {
                $codeExists = $this->schoolModel->findByCode($data['code']);
                if ($codeExists) {
                    http_response_code(400);
                    echo json_encode(['error' => 'School code already exists'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            $result = $this->schoolModel->update($id, $data);
            
            if ($result) {
                // Log school update
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'school_updated', 'School updated', $data);
                
                echo json_encode(['message' => 'School updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update school'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function destroy($id) {
        try {
            // Require admin role
            require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            ob_clean();
            
            // Check if school exists
            $school = $this->schoolModel->findById($id);
            if (!$school) {
                http_response_code(404);
                echo json_encode(['error' => 'School not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $result = $this->schoolModel->delete($id);
            
            if ($result) {
                // Log school deletion
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'school_deleted', 'School deleted', ['school_id' => $id]);
                
                echo json_encode(['message' => 'School deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete school'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 