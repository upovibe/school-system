<?php
// api/controllers/ParentController.php - Controller for parent operations

require_once __DIR__ . '/../models/ParentModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class ParentController {
    private $parentModel;
    private $userModel;
    private $logModel;

    public function __construct($pdo) {
        $this->parentModel = new ParentModel($pdo);
        $this->userModel = new UserModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $parents = $this->parentModel->getWithUserInfo();
            
            echo json_encode($parents, JSON_PRETTY_PRINT);
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
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email, and password are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if email already exists
            $existingUser = $this->userModel->findByEmail($data['email']);
            if ($existingUser) {
                http_response_code(400);
                echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Create user first
            $userData = [
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                'phone' => $data['phone'] ?? null,
                'gender' => $data['gender'] ?? null,
                'role_id' => 4, // Parent role
                'status' => 'active'
            ];
            
            $userId = $this->userModel->create($userData);
            
            // Create parent record
            $parentData = [
                'user_id' => $userId,
                'occupation' => $data['occupation'] ?? null,
                'workplace' => $data['workplace'] ?? null,
                'relationship_to_student' => $data['relationship_to_student'] ?? null
            ];
            
            $parentId = $this->parentModel->create($parentData);
            
            // Log parent creation
            global $currentUser;
            $this->logModel->logAction($currentUser['id'], 'parent_created', 'New parent created', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $parentId,
                'user_id' => $userId,
                'message' => 'Parent created successfully'
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
            
            $parent = $this->parentModel->getWithUserInfo($id);
            if (!$parent) {
                http_response_code(404);
                echo json_encode(['error' => 'Parent not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($parent, JSON_PRETTY_PRINT);
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
            
            // Check if parent exists
            $existingParent = $this->parentModel->findById($id);
            if (!$existingParent) {
                http_response_code(404);
                echo json_encode(['error' => 'Parent not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Update user data if provided
            if (isset($data['name']) || isset($data['email']) || isset($data['phone']) || isset($data['gender'])) {
                $userData = [];
                if (isset($data['name'])) $userData['name'] = $data['name'];
                if (isset($data['email'])) $userData['email'] = $data['email'];
                if (isset($data['phone'])) $userData['phone'] = $data['phone'];
                if (isset($data['gender'])) $userData['gender'] = $data['gender'];
                
                // Check email uniqueness if email is being updated
                if (isset($data['email'])) {
                    $existingUser = $this->userModel->findByEmail($data['email']);
                    if ($existingUser && $existingUser['id'] != $existingParent['user_id']) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                        return;
                    }
                }
                
                $this->userModel->update($existingParent['user_id'], $userData);
            }
            
            // Update parent data
            $parentData = [];
            if (isset($data['occupation'])) $parentData['occupation'] = $data['occupation'];
            if (isset($data['workplace'])) $parentData['workplace'] = $data['workplace'];
            if (isset($data['relationship_to_student'])) $parentData['relationship_to_student'] = $data['relationship_to_student'];
            
            $result = $this->parentModel->update($id, $parentData);
            
            if ($result) {
                // Log parent update
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'parent_updated', 'Parent updated', $data);
                
                echo json_encode(['message' => 'Parent updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update parent'], JSON_PRETTY_PRINT);
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
            
            // Check if parent exists
            $parent = $this->parentModel->findById($id);
            if (!$parent) {
                http_response_code(404);
                echo json_encode(['error' => 'Parent not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Delete parent record (user will be deleted via cascade)
            $result = $this->parentModel->delete($id);
            
            if ($result) {
                // Log parent deletion
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'parent_deleted', 'Parent deleted', ['parent_id' => $id]);
                
                echo json_encode(['message' => 'Parent deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete parent'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getStudents($id) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            // Check if parent exists
            $parent = $this->parentModel->findById($id);
            if (!$parent) {
                http_response_code(404);
                echo json_encode(['error' => 'Parent not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $students = $this->parentModel->getStudents($id);
            
            echo json_encode($students, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function linkToStudent($id) {
        try {
            // Require admin role
            require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['student_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Student ID is required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if parent exists
            $parent = $this->parentModel->findById($id);
            if (!$parent) {
                http_response_code(404);
                echo json_encode(['error' => 'Parent not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $relationship = $data['relationship'] ?? null;
            $isPrimaryContact = $data['is_primary_contact'] ?? 0;
            
            $result = $this->parentModel->linkToStudent($id, $data['student_id'], $relationship, $isPrimaryContact);
            
            if ($result) {
                // Log parent-student linking
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'parent_student_linked', 'Parent linked to student', $data);
                
                echo json_encode(['message' => 'Parent linked to student successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to link parent to student'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function unlinkFromStudent($id) {
        try {
            // Require admin role
            require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['student_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Student ID is required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if parent exists
            $parent = $this->parentModel->findById($id);
            if (!$parent) {
                http_response_code(404);
                echo json_encode(['error' => 'Parent not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $result = $this->parentModel->unlinkFromStudent($id, $data['student_id']);
            
            if ($result) {
                // Log parent-student unlinking
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'parent_student_unlinked', 'Parent unlinked from student', $data);
                
                echo json_encode(['message' => 'Parent unlinked from student successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to unlink parent from student'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function profile($id) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $parent = $this->parentModel->getWithUserInfo($id);
            if (!$parent) {
                http_response_code(404);
                echo json_encode(['error' => 'Parent not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($parent, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 