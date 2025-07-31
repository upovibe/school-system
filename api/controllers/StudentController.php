<?php
// api/controllers/StudentController.php - Controller for student operations

require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../models/ClassModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../middlewares/StudentMiddleware.php';

class StudentController {
    private $studentModel;
    private $classModel;
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->studentModel = new StudentModel($pdo);
        $this->classModel = new ClassModel($pdo);
    }

    /**
     * Get all students (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $students = $this->studentModel->getStudentsWithClassInfo();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $students,
                'message' => 'Students retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving students: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new student (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['student_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student ID is required'
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

            // Check if student_id already exists
            if ($this->studentModel->studentIdExists($data['student_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student ID already exists'
                ]);
                return;
            }

            // Check if email already exists
            if ($this->studentModel->emailExists($data['email'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email already exists'
                ]);
                return;
            }

            // Validate class if provided
            if (!empty($data['current_class_id'])) {
                $class = $this->classModel->findById($data['current_class_id']);
                if (!$class) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid class ID'
                    ]);
                    return;
                }
            }

            // Set default values
            if (!isset($data['status'])) {
                $data['status'] = 'active';
            }

            // Create student with user account
            $result = $this->studentModel->createStudentWithUser($data);
            
            // Log the action
            $this->logAction('create', 'Student created successfully', [
                'student_id' => $result['student_id'],
                'user_id' => $result['user_id']
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $result,
                'message' => 'Student created successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating student: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific student (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $student = $this->studentModel->findById($id);
            
            if (!$student) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $student,
                'message' => 'Student retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving student: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a student (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if student exists
            $existingStudent = $this->studentModel->findById($id);
            if (!$existingStudent) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student not found'
                ]);
                return;
            }

            // Check if student_id already exists (excluding current student)
            if (!empty($data['student_id']) && $this->studentModel->studentIdExists($data['student_id'], $id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student ID already exists'
                ]);
                return;
            }

            // Check if email already exists (excluding current student)
            if (!empty($data['email']) && $this->studentModel->emailExists($data['email'], $id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email already exists'
                ]);
                return;
            }

            // Validate class if provided
            if (!empty($data['current_class_id'])) {
                $class = $this->classModel->findById($data['current_class_id']);
                if (!$class) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid class ID'
                    ]);
                    return;
                }
            }

            // Update student with user account
            $this->studentModel->updateStudentWithUser($id, $data);
            
            // Log the action
            $this->logAction('update', 'Student updated successfully', [
                'student_id' => $id,
                'updated_fields' => array_keys($data)
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Student updated successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating student: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a student (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if student exists
            $student = $this->studentModel->findById($id);
            if (!$student) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student not found'
                ]);
                return;
            }

            // Delete student
            $this->studentModel->delete($id);
            
            // Log the action
            $this->logAction('delete', 'Student deleted successfully', [
                'student_id' => $id,
                'student_name' => $student['first_name'] . ' ' . $student['last_name']
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Student deleted successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting student: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active students only (admin only)
     */
    public function getActive() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $students = $this->studentModel->getActiveStudents();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $students,
                'message' => 'Active students retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active students: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search students (admin only)
     */
    public function search() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $query = $_GET['q'] ?? '';
            $limit = $_GET['limit'] ?? 10;
            
            if (empty($query)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Search query is required'
                ]);
                return;
            }
            
            $students = $this->studentModel->searchStudents($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $students,
                'message' => 'Search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching students: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get students by class (admin only)
     */
    public function getByClass() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $classId = $_GET['class_id'] ?? null;
            
            if (!$classId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class ID is required'
                ]);
                return;
            }
            
            // Validate class exists
            $class = $this->classModel->findById($classId);
            if (!$class) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class not found'
                ]);
                return;
            }
            
            $students = $this->studentModel->getStudentsByClass($classId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $students,
                'message' => 'Students retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving students by class: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Student login (public)
     */
    public function login() {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['student_id']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student ID and password are required'
                ]);
                return;
            }
            
            // Authenticate student
            $student = $this->studentModel->authenticateStudent($data['student_id'], $data['password']);
            
            if (!$student) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid student ID or password'
                ]);
                return;
            }
            
            // Generate JWT token
            $token = $this->generateJWT($student);
            
            // Log login action
            $this->logAction('login', 'Student logged in successfully', [
                'student_id' => $student['student_id'],
                'student_name' => $student['first_name'] . ' ' . $student['last_name']
            ]);
            
            // Return student data with token
            $student['token'] = $token;
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $student,
                'message' => 'Login successful'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error during login: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Change student password (student only)
     */
    public function changePassword() {
        try {
            // Require student authentication
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['student_id']) || !isset($data['new_password'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student ID and new password are required'
                ]);
                return;
            }
            
            // Validate password strength
            if (strlen($data['new_password']) < 6) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Password must be at least 6 characters long'
                ]);
                return;
            }
            
            // Change password
            $success = $this->studentModel->changePassword($data['student_id'], $data['new_password']);
            
            if (!$success) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to change password'
                ]);
                return;
            }
            
            // Log the action
            $this->logAction('change_password', 'Student password changed successfully', [
                'student_id' => $data['student_id']
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error changing password: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get student profile (student only)
     */
    public function getProfile() {
        try {
            // Require student authentication
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            $token = $this->getAuthToken();
            $studentId = $this->getStudentIdFromToken($token);
            
            $student = $this->studentModel->findByStudentId($studentId);
            
            if (!$student) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $student,
                'message' => 'Profile retrieved successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving profile: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update student profile (student only)
     */
    public function updateProfile() {
        try {
            // Require student authentication
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            $token = $this->getAuthToken();
            $studentId = $this->getStudentIdFromToken($token);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Get current student
            $currentStudent = $this->studentModel->findByStudentId($studentId);
            if (!$currentStudent) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student not found'
                ]);
                return;
            }
            
            // Only allow updating certain fields for profile
            $allowedFields = ['phone', 'address', 'parent_phone', 'parent_email', 'emergency_contact', 'emergency_phone', 'medical_conditions'];
            $updateData = array_intersect_key($data, array_flip($allowedFields));
            
            if (empty($updateData)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No valid fields to update'
                ]);
                return;
            }
            
            // Update student
            $this->studentModel->update($currentStudent['id'], $updateData);
            
            // Log the action
            $this->logAction('update_profile', 'Student profile updated', [
                'student_id' => $studentId,
                'updated_fields' => array_keys($updateData)
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating profile: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Log action
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            $logModel = new UserLogModel($this->pdo);
            $userId = $this->getCurrentUserId();
            
            $logModel->logAction($userId, $action, $description, $metadata);
        } catch (Exception $e) {
            // Silently fail logging
        }
    }

    /**
     * Generate JWT token for student
     */
    private function generateJWT($student) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'student_id' => $student['student_id'],
            'user_id' => $student['user_id'] ?? null,
            'name' => $student['first_name'] . ' ' . $student['last_name'],
            'email' => $student['email'],
            'role' => 'student',
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, 'your-secret-key', true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    /**
     * Get auth token from headers
     */
    private function getAuthToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        throw new Exception('No valid authorization token found');
    }

    /**
     * Get student ID from token
     */
    private function getStudentIdFromToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        
        if (!$payload || !isset($payload['student_id'])) {
            throw new Exception('Invalid token payload');
        }
        
        return $payload['student_id'];
    }

    /**
     * Get current user ID
     */
    private function getCurrentUserId() {
        try {
            $token = $this->getAuthToken();
            $parts = explode('.', $token);
            $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
            return $payload['user_id'] ?? null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get current student's class information (student only)
     */
    public function getCurrentClass() {
        try {
            // Require student authentication and validation
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            // Student info is now available from middleware
            $student = $_REQUEST['current_student'];
            
            // Extract class information from student data
            $classInfo = null;
            $subjects = [];
            
            if (!empty($student['class_id'])) {
                $classInfo = [
                    'id' => $student['class_id'],
                    'name' => $student['class_name'],
                    'section' => $student['class_section'],
                    'academic_year' => $student['class_academic_year']
                ];
                
                // Get subjects for this class with teacher assignments
                require_once __DIR__ . '/../models/ClassSubjectModel.php';
                require_once __DIR__ . '/../models/TeacherAssignmentModel.php';
                
                $classSubjectModel = new ClassSubjectModel($pdo);
                $teacherAssignmentModel = new TeacherAssignmentModel($pdo);
                
                // Get all subjects for this class
                $classSubjects = $classSubjectModel->getByClassId($student['class_id']);
                
                // For each subject, get the assigned teacher
                foreach ($classSubjects as $subject) {
                    $teacherAssignment = $teacherAssignmentModel->getByClassAndSubject(
                        $student['class_id'], 
                        $subject['subject_id']
                    );
                    
                    // Add teacher information to the subject
                    if ($teacherAssignment) {
                        $subject['teacher'] = [
                            'name' => $teacherAssignment['teacher_first_name'] . ' ' . $teacherAssignment['teacher_last_name'],
                            'gender' => $teacherAssignment['gender']
                        ];
                    } else {
                        $subject['teacher'] = null;
                    }
                    
                    $subjects[] = $subject;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'class' => $classInfo,
                    'student' => $student,
                    'subjects' => $subjects
                ],
                'message' => 'Current class retrieved successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving current class: ' . $e->getMessage()
            ]);
        }
    }

}
?> 