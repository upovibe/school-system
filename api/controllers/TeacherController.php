<?php
// api/controllers/TeacherController.php - Controller for teacher operations

require_once __DIR__ . '/../models/TeacherModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class TeacherController {
    private $teacherModel;
    private $userModel;
    private $logModel;

    public function __construct($pdo) {
        $this->teacherModel = new TeacherModel($pdo);
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
            
            $teachers = $this->teacherModel->getWithUserInfo();
            
            echo json_encode($teachers, JSON_PRETTY_PRINT);
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
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['password']) || !isset($data['hire_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email, password, and hire_date are required'], JSON_PRETTY_PRINT);
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
                'role_id' => 2, // Teacher role
                'status' => 'active'
            ];
            
            $userId = $this->userModel->create($userData);
            
            // Create teacher record
            $teacherData = [
                'user_id' => $userId,
                'department_id' => $data['department_id'] ?? null,
                'hire_date' => $data['hire_date'],
                'qualification' => $data['qualification'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'bio' => $data['bio'] ?? null
            ];
            
            $teacherId = $this->teacherModel->create($teacherData);
            
            // Log teacher creation
            global $currentUser;
            $this->logModel->logAction($currentUser['id'], 'teacher_created', 'New teacher created', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $teacherId,
                'user_id' => $userId,
                'message' => 'Teacher created successfully'
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
            
            $teacher = $this->teacherModel->getWithUserInfo($id);
            if (!$teacher) {
                http_response_code(404);
                echo json_encode(['error' => 'Teacher not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($teacher, JSON_PRETTY_PRINT);
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
            
            // Check if teacher exists
            $existingTeacher = $this->teacherModel->findById($id);
            if (!$existingTeacher) {
                http_response_code(404);
                echo json_encode(['error' => 'Teacher not found'], JSON_PRETTY_PRINT);
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
                    if ($existingUser && $existingUser['id'] != $existingTeacher['user_id']) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                        return;
                    }
                }
                
                $this->userModel->update($existingTeacher['user_id'], $userData);
            }
            
            // Update teacher data
            $teacherData = [];
            if (isset($data['department_id'])) $teacherData['department_id'] = $data['department_id'];
            if (isset($data['hire_date'])) $teacherData['hire_date'] = $data['hire_date'];
            if (isset($data['qualification'])) $teacherData['qualification'] = $data['qualification'];
            if (isset($data['specialization'])) $teacherData['specialization'] = $data['specialization'];
            if (isset($data['bio'])) $teacherData['bio'] = $data['bio'];
            
            $result = $this->teacherModel->update($id, $teacherData);
            
            if ($result) {
                // Log teacher update
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'teacher_updated', 'Teacher updated', $data);
                
                echo json_encode(['message' => 'Teacher updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update teacher'], JSON_PRETTY_PRINT);
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
            
            // Check if teacher exists
            $teacher = $this->teacherModel->findById($id);
            if (!$teacher) {
                http_response_code(404);
                echo json_encode(['error' => 'Teacher not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Delete teacher record (user will be deleted via cascade)
            $result = $this->teacherModel->delete($id);
            
            if ($result) {
                // Log teacher deletion
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'teacher_deleted', 'Teacher deleted', ['teacher_id' => $id]);
                
                echo json_encode(['message' => 'Teacher deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete teacher'], JSON_PRETTY_PRINT);
            }
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
            
            $teachers = $this->teacherModel->getByDepartment($departmentId);
            
            echo json_encode($teachers, JSON_PRETTY_PRINT);
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
            
            $teacher = $this->teacherModel->getWithUserInfo($id);
            if (!$teacher) {
                http_response_code(404);
                echo json_encode(['error' => 'Teacher not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($teacher, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 