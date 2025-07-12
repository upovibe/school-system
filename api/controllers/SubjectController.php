<?php
// api/controllers/SubjectController.php - Controller for subject operations

require_once __DIR__ . '/../models/SubjectModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class SubjectController {
    private $subjectModel;
    private $logModel;

    public function __construct($pdo) {
        $this->subjectModel = new SubjectModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $subjects = $this->subjectModel->findAll();
            
            echo json_encode($subjects, JSON_PRETTY_PRINT);
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
            if (!isset($data['name']) || !isset($data['level_id']) || !isset($data['department_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, level_id, and department_id are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if subject already exists for this level
            $existingSubject = $this->subjectModel->where('name', $data['name'])
                                                ->where('level_id', $data['level_id'])
                                                ->first();
            if ($existingSubject) {
                http_response_code(400);
                echo json_encode(['error' => 'Subject already exists for this level'], JSON_PRETTY_PRINT);
                return;
            }
            
            $id = $this->subjectModel->create($data);
            
            // Log subject creation
            global $currentUser;
            $this->logModel->logAction($currentUser['id'], 'subject_created', 'New subject created', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $id, 
                'message' => 'Subject created successfully'
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
            
            $subject = $this->subjectModel->findWithRelations($id);
            if (!$subject) {
                http_response_code(404);
                echo json_encode(['error' => 'Subject not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($subject, JSON_PRETTY_PRINT);
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
            
            // Check if subject exists
            $existingSubject = $this->subjectModel->findById($id);
            if (!$existingSubject) {
                http_response_code(404);
                echo json_encode(['error' => 'Subject not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check subject name uniqueness if name is being updated
            if (isset($data['name']) && $data['name'] !== $existingSubject['name']) {
                $nameExists = $this->subjectModel->where('name', $data['name'])
                                               ->where('level_id', $data['level_id'] ?? $existingSubject['level_id'])
                                               ->first();
                if ($nameExists) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Subject name already exists for this level'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            $result = $this->subjectModel->update($id, $data);
            
            if ($result) {
                // Log subject update
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'subject_updated', 'Subject updated', $data);
                
                echo json_encode(['message' => 'Subject updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update subject'], JSON_PRETTY_PRINT);
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
            
            // Check if subject exists
            $subject = $this->subjectModel->findById($id);
            if (!$subject) {
                http_response_code(404);
                echo json_encode(['error' => 'Subject not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $result = $this->subjectModel->delete($id);
            
            if ($result) {
                // Log subject deletion
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'subject_deleted', 'Subject deleted', ['subject_id' => $id]);
                
                echo json_encode(['message' => 'Subject deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete subject'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getByLevel($levelId) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $subjects = $this->subjectModel->findByLevel($levelId);
            
            echo json_encode($subjects, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getByDepartment($departmentId) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $subjects = $this->subjectModel->findByDepartment($departmentId);
            
            echo json_encode($subjects, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getCoreSubjects($levelId = null) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $subjects = $this->subjectModel->findCoreSubjects($levelId);
            
            echo json_encode($subjects, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 