<?php
// api/controllers/TeacherController.php - Controller for teacher operations

require_once __DIR__ . '/../models/TeacherModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class TeacherController {
    private $teacherModel;
    private $userModel;
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->teacherModel = new TeacherModel($pdo);
        $this->userModel = new UserModel($pdo);
    }

    /**
     * Get all teachers (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $teachers = $this->teacherModel->getTeachersWithUserInfo();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teachers,
                'message' => 'Teachers retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teachers: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new teacher (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['employee_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Employee ID is required'
                ]);
                return;
            }

            if (empty($data['first_name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'First name is required'
                ]);
                return;
            }

            if (empty($data['last_name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Last name is required'
                ]);
                return;
            }

            if (empty($data['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email is required'
                ]);
                return;
            }

            if (empty($data['password'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Password is required'
                ]);
                return;
            }

            if (empty($data['hire_date'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Hire date is required'
                ]);
                return;
            }

            // Check if employee ID already exists
            if ($this->teacherModel->employeeIdExists($data['employee_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Employee ID already exists'
                ]);
                return;
            }

            // Check if email already exists
            if ($this->teacherModel->emailExists($data['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email already exists'
                ]);
                return;
            }

            // Set default values if not provided
            if (!isset($data['status'])) {
                $data['status'] = 'active';
            }

            // Create teacher with user account
            $result = $this->teacherModel->createTeacherWithUser($data);
            
            // Log teacher creation
            $this->logAction('teacher_created', 'New teacher created', $data);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $result,
                'message' => 'Teacher created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating teacher: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific teacher (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $teacher = $this->teacherModel->findById($id);
            
            if (!$teacher) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher not found'
                ]);
                return;
            }

            // Get user information
            $user = $this->userModel->findById($teacher['user_id']);
            $teacher['user'] = $user;
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teacher,
                'message' => 'Teacher retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a teacher (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if teacher exists
            $existingTeacher = $this->teacherModel->findById($id);
            if (!$existingTeacher) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher not found'
                ]);
                return;
            }

            // Validate required fields
            if (empty($data['employee_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Employee ID is required'
                ]);
                return;
            }

            if (empty($data['first_name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'First name is required'
                ]);
                return;
            }

            if (empty($data['last_name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Last name is required'
                ]);
                return;
            }

            if (empty($data['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email is required'
                ]);
                return;
            }

            if (empty($data['hire_date'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Hire date is required'
                ]);
                return;
            }

            // Check if employee ID already exists for different teacher
            if ($this->teacherModel->employeeIdExists($data['employee_id'], $id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Employee ID already exists'
                ]);
                return;
            }

            // Check if email already exists for different teacher
            if ($this->teacherModel->emailExists($data['email'], $id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email already exists'
                ]);
                return;
            }

            // Update teacher with user account
            $this->teacherModel->updateTeacherWithUser($id, $data);
            
            // Log teacher update
            $this->logAction('teacher_updated', 'Teacher updated', $data);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Teacher updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating teacher: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a teacher (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if teacher exists
            $existingTeacher = $this->teacherModel->findById($id);
            if (!$existingTeacher) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher not found'
                ]);
                return;
            }

            // Check if teacher has assignments
            $teachersWithCounts = $this->teacherModel->getTeachersWithAssignmentCounts();
            $teacherWithCount = null;
            foreach ($teachersWithCounts as $teacher) {
                if ($teacher['id'] == $id) {
                    $teacherWithCount = $teacher;
                    break;
                }
            }

            if ($teacherWithCount && $teacherWithCount['assignment_count'] > 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cannot delete teacher. They have ' . $teacherWithCount['assignment_count'] . ' assignment(s).'
                ]);
                return;
            }

            // Delete teacher
            $this->teacherModel->delete($id);
            
            // Log teacher deletion
            $this->logAction('teacher_deleted', 'Teacher deleted', $existingTeacher);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Teacher deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting teacher: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active teachers (public)
     */
    public function getActive() {
        try {
            $teachers = $this->teacherModel->getActiveTeachers();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teachers,
                'message' => 'Active teachers retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active teachers: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search teachers (admin only)
     */
    public function search() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $query = $_GET['q'] ?? '';
            $limit = $_GET['limit'] ?? null;
            
            if (empty($query)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Search query is required'
                ]);
                return;
            }
            
            $teachers = $this->teacherModel->searchTeachers($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teachers,
                'message' => 'Teachers search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching teachers: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get teachers with assignment counts (admin only)
     */
    public function getWithAssignmentCounts() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $teachers = $this->teacherModel->getTeachersWithAssignmentCounts();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teachers,
                'message' => 'Teachers with assignment counts retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teachers with assignment counts: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get available specializations (admin only)
     */
    public function getSpecializations() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $specializations = $this->teacherModel->getAvailableSpecializations();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $specializations,
                'message' => 'Available specializations retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving specializations: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get teachers by specialization (admin only)
     */
    public function getBySpecialization() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $specialization = $_GET['specialization'] ?? '';
            
            if (empty($specialization)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Specialization parameter is required'
                ]);
                return;
            }
            
            $teachers = $this->teacherModel->getTeachersBySpecialization($specialization);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teachers,
                'message' => 'Teachers by specialization retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teachers by specialization: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get teacher statistics (admin only)
     */
    public function getStatistics() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $statistics = $this->teacherModel->getTeacherStatistics();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $statistics,
                'message' => 'Teacher statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher statistics: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Log user action
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            // Get current user from session
            $token = $this->getAuthToken();
            if ($token) {
                require_once __DIR__ . '/../models/UserSessionModel.php';
                $userSessionModel = new UserSessionModel($this->pdo);
                $session = $userSessionModel->findActiveSession($token);
                if ($session) {
                    UserLogModel::logAction($session['user_id'], $action, $description, $metadata);
                }
            }
        } catch (Exception $e) {
            // Don't fail the main operation if logging fails
            error_log("Failed to log action: " . $e->getMessage());
        }
    }

    /**
     * Get authentication token from request
     */
    private function getAuthToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
}
?> 