<?php
// api/controllers/UserController.php - Controller for user operations

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/RoleModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class UserController {
    private $userModel;
    private $roleModel;
    private $logModel;

    public function __construct($pdo) {
        $this->userModel = new UserModel($pdo);
        $this->roleModel = new RoleModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $users = $this->userModel->findAll();
            
            // Add role information to each user
            foreach ($users as &$user) {
                unset($user['password']); // Hide password
                if (isset($user['role_id'])) {
                    $role = $this->roleModel->findById($user['role_id']);
                    $user['role'] = $role ? $role['name'] : null;
                }
            }
            
            echo json_encode($users, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function store() {
        try {
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
            
            // Hash password
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Set default role if not provided
            if (!isset($data['role_id'])) {
                $data['role_id'] = 3; // Default to student role
            }
            
            // Set default status
            if (!isset($data['status'])) {
                $data['status'] = 'active';
            }
            
            $id = $this->userModel->create($data);
            
            // Log user creation
            $this->logModel->logAction($id, 'user_created', 'New user created', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $id, 
                'message' => 'User created successfully'
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function show($id) {
        try {
            ob_clean();
            
            $user = $this->userModel->findById($id);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            unset($user['password']); // Hide password
            
            // Add role information
            if (isset($user['role_id'])) {
                $role = $this->roleModel->findById($user['role_id']);
                $user['role'] = $role ? $role['name'] : null;
            }
            
            echo json_encode($user, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function update($id) {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if user exists
            $existingUser = $this->userModel->findById($id);
            if (!$existingUser) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check email uniqueness if email is being updated
            if (isset($data['email']) && $data['email'] !== $existingUser['email']) {
                $emailExists = $this->userModel->findByEmail($data['email']);
                if ($emailExists) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            $result = $this->userModel->update($id, $data);
            
            if ($result) {
                // Log user update
                $this->logModel->logAction($id, 'user_updated', 'User updated', $data);
                
                echo json_encode(['message' => 'User updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update user'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function destroy($id) {
        try {
            ob_clean();
            
            // Check if user exists
            $user = $this->userModel->findById($id);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $result = $this->userModel->delete($id);
            
            if ($result) {
                // Log user deletion
                $this->logModel->logAction($id, 'user_deleted', 'User deleted', ['user_id' => $id]);
                
                echo json_encode(['message' => 'User deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete user'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function profile($id) {
        try {
            ob_clean();
            
            $user = $this->userModel->findById($id);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            unset($user['password']); // Hide password
            
            // Add role information
            if (isset($user['role_id'])) {
                $role = $this->roleModel->findById($user['role_id']);
                $user['role'] = $role ? $role['name'] : null;
            }
            
            echo json_encode($user, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function updateProfile($id) {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if user exists
            $existingUser = $this->userModel->findById($id);
            if (!$existingUser) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Remove sensitive fields that shouldn't be updated via profile
            unset($data['role_id']);
            unset($data['status']);
            
            // Check email uniqueness if email is being updated
            if (isset($data['email']) && $data['email'] !== $existingUser['email']) {
                $emailExists = $this->userModel->findByEmail($data['email']);
                if ($emailExists) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            $result = $this->userModel->update($id, $data);
            
            if ($result) {
                // Log profile update
                $this->logModel->logAction($id, 'profile_updated', 'Profile updated', $data);
                
                echo json_encode(['message' => 'Profile updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update profile'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 