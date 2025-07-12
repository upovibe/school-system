<?php
// api/controllers/ClassController.php - Controller for class operations

require_once __DIR__ . '/../models/ClassModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class ClassController {
    private $classModel;
    private $logModel;

    public function __construct($pdo) {
        $this->classModel = new ClassModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $classes = $this->classModel->findAll();
            
            echo json_encode($classes, JSON_PRETTY_PRINT);
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
            if (!isset($data['level_id']) || !isset($data['section']) || !isset($data['school_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'level_id, section, and school_id are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if class already exists for this level, section, and school
            $existingClass = $this->classModel->where('level_id', $data['level_id'])
                                            ->where('section', $data['section'])
                                            ->where('school_id', $data['school_id'])
                                            ->first();
            if ($existingClass) {
                http_response_code(400);
                echo json_encode(['error' => 'Class already exists for this level, section, and school'], JSON_PRETTY_PRINT);
                return;
            }
            
            $id = $this->classModel->create($data);
            
            // Log class creation
            global $currentUser;
            $this->logModel->logAction($currentUser['id'], 'class_created', 'New class created', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $id, 
                'message' => 'Class created successfully'
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
            
            $class = $this->classModel->findWithRelations($id);
            if (!$class) {
                http_response_code(404);
                echo json_encode(['error' => 'Class not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($class, JSON_PRETTY_PRINT);
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
            
            // Check if class exists
            $existingClass = $this->classModel->findById($id);
            if (!$existingClass) {
                http_response_code(404);
                echo json_encode(['error' => 'Class not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check class uniqueness if level, section, or school is being updated
            if (isset($data['level_id']) || isset($data['section']) || isset($data['school_id'])) {
                $levelId = $data['level_id'] ?? $existingClass['level_id'];
                $section = $data['section'] ?? $existingClass['section'];
                $schoolId = $data['school_id'] ?? $existingClass['school_id'];
                
                $classExists = $this->classModel->where('level_id', $levelId)
                                              ->where('section', $section)
                                              ->where('school_id', $schoolId)
                                              ->first();
                if ($classExists && $classExists['id'] != $id) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Class already exists for this level, section, and school'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            $result = $this->classModel->update($id, $data);
            
            if ($result) {
                // Log class update
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'class_updated', 'Class updated', $data);
                
                echo json_encode(['message' => 'Class updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update class'], JSON_PRETTY_PRINT);
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
            
            // Check if class exists
            $class = $this->classModel->findById($id);
            if (!$class) {
                http_response_code(404);
                echo json_encode(['error' => 'Class not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $result = $this->classModel->delete($id);
            
            if ($result) {
                // Log class deletion
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'class_deleted', 'Class deleted', ['class_id' => $id]);
                
                echo json_encode(['message' => 'Class deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete class'], JSON_PRETTY_PRINT);
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
            
            $classes = $this->classModel->findByLevel($levelId);
            
            echo json_encode($classes, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getBySchool($schoolId) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $classes = $this->classModel->findBySchool($schoolId);
            
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
            
            $classes = $this->classModel->findByTeacher($teacherId);
            
            echo json_encode($classes, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getByTrack($trackId) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $classes = $this->classModel->findByTrack($trackId);
            
            echo json_encode($classes, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getWithSubjects($id) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $class = $this->classModel->findWithSubjects($id);
            if (!$class) {
                http_response_code(404);
                echo json_encode(['error' => 'Class not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($class, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 