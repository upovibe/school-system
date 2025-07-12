<?php
// api/controllers/StaffController.php - Controller for staff operations

require_once __DIR__ . '/../models/StaffModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class StaffController {
    private $staffModel;
    private $userModel;
    private $logModel;

    public function __construct($pdo) {
        $this->staffModel = new StaffModel($pdo);
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
            
            $staff = $this->staffModel->getWithUserInfo();
            
            echo json_encode($staff, JSON_PRETTY_PRINT);
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
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['password']) || !isset($data['position']) || !isset($data['hire_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email, password, position, and hire_date are required'], JSON_PRETTY_PRINT);
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
                'role_id' => 5, // Staff role
                'status' => 'active'
            ];
            
            $userId = $this->userModel->create($userData);
            
            // Create staff record
            $staffData = [
                'user_id' => $userId,
                'position' => $data['position'],
                'department' => $data['department'] ?? null,
                'hire_date' => $data['hire_date'],
                'bio' => $data['bio'] ?? null
            ];
            
            $staffId = $this->staffModel->create($staffData);
            
            // Log staff creation
            global $currentUser;
            $this->logModel->logAction($currentUser['id'], 'staff_created', 'New staff created', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $staffId,
                'user_id' => $userId,
                'message' => 'Staff created successfully'
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
            
            $staff = $this->staffModel->getWithUserInfo($id);
            if (!$staff) {
                http_response_code(404);
                echo json_encode(['error' => 'Staff not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($staff, JSON_PRETTY_PRINT);
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
            
            // Check if staff exists
            $existingStaff = $this->staffModel->findById($id);
            if (!$existingStaff) {
                http_response_code(404);
                echo json_encode(['error' => 'Staff not found'], JSON_PRETTY_PRINT);
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
                    if ($existingUser && $existingUser['id'] != $existingStaff['user_id']) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                        return;
                    }
                }
                
                $this->userModel->update($existingStaff['user_id'], $userData);
            }
            
            // Update staff data
            $staffData = [];
            if (isset($data['position'])) $staffData['position'] = $data['position'];
            if (isset($data['department'])) $staffData['department'] = $data['department'];
            if (isset($data['hire_date'])) $staffData['hire_date'] = $data['hire_date'];
            if (isset($data['bio'])) $staffData['bio'] = $data['bio'];
            
            $result = $this->staffModel->update($id, $staffData);
            
            if ($result) {
                // Log staff update
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'staff_updated', 'Staff updated', $data);
                
                echo json_encode(['message' => 'Staff updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update staff'], JSON_PRETTY_PRINT);
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
            
            // Check if staff exists
            $staff = $this->staffModel->findById($id);
            if (!$staff) {
                http_response_code(404);
                echo json_encode(['error' => 'Staff not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Delete staff record (user will be deleted via cascade)
            $result = $this->staffModel->delete($id);
            
            if ($result) {
                // Log staff deletion
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'staff_deleted', 'Staff deleted', ['staff_id' => $id]);
                
                echo json_encode(['message' => 'Staff deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete staff'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getByDepartment($department) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $staff = $this->staffModel->getByDepartment($department);
            
            echo json_encode($staff, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getByPosition($position) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $staff = $this->staffModel->getByPosition($position);
            
            echo json_encode($staff, JSON_PRETTY_PRINT);
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
            
            $staff = $this->staffModel->getWithUserInfo($id);
            if (!$staff) {
                http_response_code(404);
                echo json_encode(['error' => 'Staff not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($staff, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 