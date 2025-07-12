<?php
// api/controllers/DepartmentController.php - Controller for department operations

require_once __DIR__ . '/../models/DepartmentModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class DepartmentController {
    private $departmentModel;
    private $logModel;

    public function __construct($pdo) {
        $this->departmentModel = new DepartmentModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $departments = $this->departmentModel->getWithHeadTeacher();
            
            echo json_encode($departments, JSON_PRETTY_PRINT);
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
            if (!isset($data['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name is required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if department name already exists
            $existingDepartment = $this->departmentModel->findByName($data['name']);
            if ($existingDepartment) {
                http_response_code(400);
                echo json_encode(['error' => 'Department name already exists'], JSON_PRETTY_PRINT);
                return;
            }
            
            $id = $this->departmentModel->create($data);
            
            // Log department creation
            global $currentUser;
            $this->logModel->logAction($currentUser['id'], 'department_created', 'New department created', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $id, 
                'message' => 'Department created successfully'
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
            
            $department = $this->departmentModel->findById($id);
            if (!$department) {
                http_response_code(404);
                echo json_encode(['error' => 'Department not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Get department with head teacher info
            $departments = $this->departmentModel->getWithHeadTeacher();
            $departmentWithHead = null;
            foreach ($departments as $dept) {
                if ($dept['id'] == $id) {
                    $departmentWithHead = $dept;
                    break;
                }
            }
            
            echo json_encode($departmentWithHead ?: $department, JSON_PRETTY_PRINT);
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
            
            // Check if department exists
            $existingDepartment = $this->departmentModel->findById($id);
            if (!$existingDepartment) {
                http_response_code(404);
                echo json_encode(['error' => 'Department not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check department name uniqueness if name is being updated
            if (isset($data['name']) && $data['name'] !== $existingDepartment['name']) {
                $nameExists = $this->departmentModel->findByName($data['name']);
                if ($nameExists) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Department name already exists'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            $result = $this->departmentModel->update($id, $data);
            
            if ($result) {
                // Log department update
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'department_updated', 'Department updated', $data);
                
                echo json_encode(['message' => 'Department updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update department'], JSON_PRETTY_PRINT);
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
            
            // Check if department exists
            $department = $this->departmentModel->findById($id);
            if (!$department) {
                http_response_code(404);
                echo json_encode(['error' => 'Department not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $result = $this->departmentModel->delete($id);
            
            if ($result) {
                // Log department deletion
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'department_deleted', 'Department deleted', ['department_id' => $id]);
                
                echo json_encode(['message' => 'Department deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete department'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getTeachers($id) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            // Check if department exists
            $department = $this->departmentModel->findById($id);
            if (!$department) {
                http_response_code(404);
                echo json_encode(['error' => 'Department not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $teachers = $this->departmentModel->getTeachersByDepartment($id);
            
            echo json_encode($teachers, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 