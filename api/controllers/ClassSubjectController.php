<?php
// api/controllers/ClassSubjectController.php - Controller for class-subject operations

require_once __DIR__ . '/../models/ClassSubjectModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class ClassSubjectController {
    private $classSubjectModel;
    private $logModel;

    public function __construct($pdo) {
        $this->classSubjectModel = new ClassSubjectModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $assignments = $this->classSubjectModel->findAll();
            
            echo json_encode($assignments, JSON_PRETTY_PRINT);
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
            if (!isset($data['class_id']) || !isset($data['subject_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'class_id and subject_id are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if assignment already exists
            $existingAssignment = $this->classSubjectModel->assignmentExists($data['class_id'], $data['subject_id']);
            if ($existingAssignment) {
                http_response_code(400);
                echo json_encode(['error' => 'Subject is already assigned to this class'], JSON_PRETTY_PRINT);
                return;
            }
            
            $id = $this->classSubjectModel->create($data);
            
            // Log assignment creation
            global $currentUser;
            $this->logModel->logAction($currentUser['id'], 'class_subject_assigned', 'Subject assigned to class', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $id, 
                'message' => 'Subject assigned to class successfully'
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
            
            $assignment = $this->classSubjectModel->findById($id);
            if (!$assignment) {
                http_response_code(404);
                echo json_encode(['error' => 'Assignment not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($assignment, JSON_PRETTY_PRINT);
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
            
            // Check if assignment exists
            $existingAssignment = $this->classSubjectModel->findById($id);
            if (!$existingAssignment) {
                http_response_code(404);
                echo json_encode(['error' => 'Assignment not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check assignment uniqueness if class_id or subject_id is being updated
            if (isset($data['class_id']) || isset($data['subject_id'])) {
                $classId = $data['class_id'] ?? $existingAssignment['class_id'];
                $subjectId = $data['subject_id'] ?? $existingAssignment['subject_id'];
                
                $assignmentExists = $this->classSubjectModel->assignmentExists($classId, $subjectId);
                if ($assignmentExists && $assignmentExists['id'] != $id) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Subject is already assigned to this class'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            $result = $this->classSubjectModel->update($id, $data);
            
            if ($result) {
                // Log assignment update
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'class_subject_updated', 'Class-subject assignment updated', $data);
                
                echo json_encode(['message' => 'Assignment updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update assignment'], JSON_PRETTY_PRINT);
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
            
            // Check if assignment exists
            $assignment = $this->classSubjectModel->findById($id);
            if (!$assignment) {
                http_response_code(404);
                echo json_encode(['error' => 'Assignment not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $result = $this->classSubjectModel->delete($id);
            
            if ($result) {
                // Log assignment deletion
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'class_subject_deleted', 'Class-subject assignment deleted', ['assignment_id' => $id]);
                
                echo json_encode(['message' => 'Assignment deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete assignment'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getByClass($classId) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $subjects = $this->classSubjectModel->findByClass($classId);
            
            echo json_encode($subjects, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getBySubject($subjectId) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $classes = $this->classSubjectModel->findBySubject($subjectId);
            
            echo json_encode($classes, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getByTeacher($teacherId) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $assignments = $this->classSubjectModel->findByTeacher($teacherId);
            
            echo json_encode($assignments, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 