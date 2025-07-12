<?php
// api/controllers/StudentController.php - Controller for student operations

require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class StudentController {
    private $studentModel;
    private $userModel;
    private $logModel;

    public function __construct($pdo) {
        $this->studentModel = new StudentModel($pdo);
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
            
            $students = $this->studentModel->getWithUserInfo();
            
            echo json_encode($students, JSON_PRETTY_PRINT);
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
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['password']) || !isset($data['admission_number']) || !isset($data['enrollment_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email, password, admission_number, and enrollment_date are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if email already exists
            $existingUser = $this->userModel->findByEmail($data['email']);
            if ($existingUser) {
                http_response_code(400);
                echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if admission number already exists
            $existingStudent = $this->studentModel->findByAdmissionNumber($data['admission_number']);
            if ($existingStudent) {
                http_response_code(400);
                echo json_encode(['error' => 'Admission number already exists'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Create user first
            $userData = [
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                'phone' => $data['phone'] ?? null,
                'gender' => $data['gender'] ?? null,
                'role_id' => 3, // Student role
                'status' => 'active'
            ];
            
            $userId = $this->userModel->create($userData);
            
            // Create student record
            $studentData = [
                'user_id' => $userId,
                'admission_number' => $data['admission_number'],
                'current_class_id' => $data['current_class_id'] ?? null,
                'enrollment_date' => $data['enrollment_date'],
                'guardian_name' => $data['guardian_name'] ?? null,
                'guardian_phone' => $data['guardian_phone'] ?? null,
                'guardian_email' => $data['guardian_email'] ?? null,
                'address' => $data['address'] ?? null,
                'emergency_contact' => $data['emergency_contact'] ?? null,
                'emergency_phone' => $data['emergency_phone'] ?? null
            ];
            
            $studentId = $this->studentModel->create($studentData);
            
            // Log student creation
            global $currentUser;
            $this->logModel->logAction($currentUser['id'], 'student_created', 'New student created', $data);
            
            http_response_code(201);
            echo json_encode([
                'id' => $studentId,
                'user_id' => $userId,
                'message' => 'Student created successfully'
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
            
            $student = $this->studentModel->getWithUserInfo($id);
            if (!$student) {
                http_response_code(404);
                echo json_encode(['error' => 'Student not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($student, JSON_PRETTY_PRINT);
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
            
            // Check if student exists
            $existingStudent = $this->studentModel->findById($id);
            if (!$existingStudent) {
                http_response_code(404);
                echo json_encode(['error' => 'Student not found'], JSON_PRETTY_PRINT);
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
                    if ($existingUser && $existingUser['id'] != $existingStudent['user_id']) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                        return;
                    }
                }
                
                $this->userModel->update($existingStudent['user_id'], $userData);
            }
            
            // Update student data
            $studentData = [];
            if (isset($data['admission_number'])) $studentData['admission_number'] = $data['admission_number'];
            if (isset($data['current_class_id'])) $studentData['current_class_id'] = $data['current_class_id'];
            if (isset($data['enrollment_date'])) $studentData['enrollment_date'] = $data['enrollment_date'];
            if (isset($data['guardian_name'])) $studentData['guardian_name'] = $data['guardian_name'];
            if (isset($data['guardian_phone'])) $studentData['guardian_phone'] = $data['guardian_phone'];
            if (isset($data['guardian_email'])) $studentData['guardian_email'] = $data['guardian_email'];
            if (isset($data['address'])) $studentData['address'] = $data['address'];
            if (isset($data['emergency_contact'])) $studentData['emergency_contact'] = $data['emergency_contact'];
            if (isset($data['emergency_phone'])) $studentData['emergency_phone'] = $data['emergency_phone'];
            
            // Check admission number uniqueness if being updated
            if (isset($data['admission_number']) && $data['admission_number'] !== $existingStudent['admission_number']) {
                $admissionExists = $this->studentModel->findByAdmissionNumber($data['admission_number']);
                if ($admissionExists) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Admission number already exists'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            $result = $this->studentModel->update($id, $studentData);
            
            if ($result) {
                // Log student update
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'student_updated', 'Student updated', $data);
                
                echo json_encode(['message' => 'Student updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update student'], JSON_PRETTY_PRINT);
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
            
            // Check if student exists
            $student = $this->studentModel->findById($id);
            if (!$student) {
                http_response_code(404);
                echo json_encode(['error' => 'Student not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Delete student record (user will be deleted via cascade)
            $result = $this->studentModel->delete($id);
            
            if ($result) {
                // Log student deletion
                global $currentUser;
                $this->logModel->logAction($currentUser['id'], 'student_deleted', 'Student deleted', ['student_id' => $id]);
                
                echo json_encode(['message' => 'Student deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete student'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function getParents($id) {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            // Check if student exists
            $student = $this->studentModel->findById($id);
            if (!$student) {
                http_response_code(404);
                echo json_encode(['error' => 'Student not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            $parents = $this->studentModel->getParents($id);
            
            echo json_encode($parents, JSON_PRETTY_PRINT);
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
            
            $student = $this->studentModel->getWithUserInfo($id);
            if (!$student) {
                http_response_code(404);
                echo json_encode(['error' => 'Student not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode($student, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 