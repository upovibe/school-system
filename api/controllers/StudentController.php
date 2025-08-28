<?php
// api/controllers/StudentController.php - Controller for student operations

require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../models/ClassModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/ClassAssignmentModel.php';
require_once __DIR__ . '/../models/StudentAssignmentModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../middlewares/StudentMiddleware.php';

class StudentController {
    private $studentModel;
    private $classModel;
    private $classAssignmentModel;
    private $studentAssignmentModel;
    private $userModel;
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->studentModel = new StudentModel($pdo);
        $this->classModel = new ClassModel($pdo);
        $this->classAssignmentModel = new ClassAssignmentModel($pdo);
        $this->studentAssignmentModel = new StudentAssignmentModel($pdo);
        $this->userModel = new UserModel($pdo);
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

            // Validate date_of_birth if provided: not future and at least 3 months old
            $today = date('Y-m-d');
            if (!empty($data['date_of_birth'])) {
                if (strtotime($data['date_of_birth']) > strtotime($today)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Date of birth cannot be in the future'
                    ]);
                    return;
                }
                $minDob = date('Y-m-d', strtotime('-3 months'));
                if (strtotime($data['date_of_birth']) > strtotime($minDob)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Student must be at least 3 months old'
                    ]);
                    return;
                }
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
            // Normalize student_type
            $allowedTypes = ['Day','Boarding'];
            if (empty($data['student_type']) || !in_array($data['student_type'], $allowedTypes, true)) {
                $data['student_type'] = 'Day';
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

            // Validate student_type if provided
            if (isset($data['student_type'])) {
                $allowedTypes = ['Day','Boarding'];
                if (!in_array($data['student_type'], $allowedTypes, true)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid student_type. Allowed: Day, Boarding'
                    ]);
                    return;
                }
            }

            // Validate date_of_birth if provided: not future and at least 3 months old
            $today = date('Y-m-d');
            if (!empty($data['date_of_birth'])) {
                if (strtotime($data['date_of_birth']) > strtotime($today)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Date of birth cannot be in the future'
                    ]);
                    return;
                }
                $minDob = date('Y-m-d', strtotime('-3 months'));
                if (strtotime($data['date_of_birth']) > strtotime($minDob)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Student must be at least 3 months old'
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

            // Begin transaction for cascading delete
            $this->pdo->beginTransaction();

            // Delete linked user if present
            $userId = $student['user_id'] ?? null;
            if ($userId) {
                // Clean up sessions/logs if you have models for them (optional)
                $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$userId]);
            }

            // Delete student
            $this->studentModel->delete($id);

            $this->pdo->commit();
            
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
            'exp' => time() + (60 * 60) // 1 hour
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
                
                // Resolve class teacher (homeroom teacher) if any
                $classTeacher = null;
                try {
                    $stmt = $pdo->prepare("SELECT first_name, last_name, gender, email, phone FROM teachers WHERE class_id = ? AND status = 'active' LIMIT 1");
                    $stmt->execute([$student['class_id']]);
                    $t = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($t) {
                        $classTeacher = [
                            'name' => trim(($t['first_name'] ?? '') . ' ' . ($t['last_name'] ?? '')),
                            'gender' => $t['gender'] ?? null,
                            'email' => $t['email'] ?? null,
                            'phone' => $t['phone'] ?? null,
                        ];
                    }
                } catch (Exception $_) {
                    $classTeacher = null;
                }
                
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
                            'gender' => $teacherAssignment['gender'],
                            'email' => $teacherAssignment['teacher_email'] ?? null,
                            'phone' => $teacherAssignment['teacher_phone'] ?? null
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
                    'class_teacher' => $classTeacher ?? null,
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

    /**
     * Get current student's personal information (student only)
     */
    public function getPersonalInfo() {
        try {
            // Require student authentication and validation
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            // Student info is now available from middleware
            $student = $_REQUEST['current_student'];
            
            // Extract personal information from student data
            $personalInfo = [
                'student_id' => $student['student_id'],
                'first_name' => $student['first_name'],
                'last_name' => $student['last_name'],
                'email' => $student['email'],
                'phone' => $student['phone'],
                'address' => $student['address'],
                'date_of_birth' => $student['date_of_birth'],
                'gender' => $student['gender'],
                'admission_date' => $student['admission_date'],
                'status' => $student['status'],
                'parent_name' => $student['parent_name'],
                'parent_phone' => $student['parent_phone'],
                'parent_email' => $student['parent_email'],
                'emergency_contact' => $student['emergency_contact'],
                'emergency_phone' => $student['emergency_phone'],
                'blood_group' => $student['blood_group'],
                'medical_conditions' => $student['medical_conditions']
            ];
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $personalInfo,
                'message' => 'Personal information retrieved successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving personal information: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get all assignments for the current student
     */
    public function getMyAssignments() {
        try {
            // Require student authentication
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            $student = $_REQUEST['current_student'];
            
            // Get assignments for the student's class
            $assignments = $this->classAssignmentModel->getByClassId($student['current_class_id']);
            
            // Restructure the response with better grouping
            $restructuredAssignments = [];
            
            foreach ($assignments as $assignment) {
                $submission = $this->studentAssignmentModel->getByStudentAndAssignment(
                    $student['id'], 
                    $assignment['id']
                );
                
                $restructuredAssignment = [
                    'id' => $assignment['id'],
                    'title' => $assignment['title'],
                    'description' => $assignment['description'],
                    'due_date' => $assignment['due_date'],
                    'total_points' => $assignment['total_points'],
                    'assignment_type' => $assignment['assignment_type'],
                    'status' => $assignment['status'],
                    'attachment_file' => $assignment['attachment_file'],
                    'created_at' => $assignment['created_at'],
                    'updated_at' => $assignment['updated_at'],
                    'subject' => [
                        'id' => $assignment['subject_id'],
                        'name' => $assignment['subject_name']
                    ],
                    'teacher' => [
                        'id' => $assignment['teacher_id'],
                        'first_name' => $assignment['teacher_first_name'],
                        'last_name' => $assignment['teacher_last_name'],
                        'full_name' => $assignment['teacher_first_name'] . ' ' . $assignment['teacher_last_name'],
                        'gender' => $assignment['teacher_gender']
                    ],
                    'submission' => $submission ? [
                        'id' => $submission['id'],
                        'status' => $submission['status'],
                        'grade' => $submission['grade'],
                        'feedback' => $submission['feedback'],
                        'submitted_at' => $submission['submitted_at'],
                        'submission_text' => $submission['submission_text'],
                        'submission_file' => $submission['submission_file'],
                        'archived_at' => $submission['archived_at']
                    ] : null,
                    'submission_status' => $submission ? $submission['status'] : 'not_submitted',
                    'submission_grade' => $submission ? $submission['grade'] : null,
                    'submitted_at' => $submission ? $submission['submitted_at'] : null,
                    'archived_at' => $submission ? $submission['archived_at'] : null
                ];
                
                $restructuredAssignments[] = $restructuredAssignment;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $restructuredAssignments,
                'message' => 'Student assignments retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving assignments: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific assignment for the current student
     */
    public function getAssignment($assignmentId) {
        try {
            // Require student authentication
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            $student = $_REQUEST['current_student'];
            
            // Get the assignment with full details
            $assignment = $this->classAssignmentModel->getAssignmentWithDetails($assignmentId);
            
            if (!$assignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            // Check if assignment belongs to student's class
            if ($assignment['class_id'] != $student['current_class_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Assignment does not belong to your class.'
                ]);
                return;
            }
            
            // Get student's submission for this assignment
            $submission = $this->studentAssignmentModel->getByStudentAndAssignment(
                $student['id'], 
                $assignmentId
            );
            
            // Restructure the response to include teacher and subject details
            $restructuredAssignment = [
                'id' => $assignment['id'],
                'title' => $assignment['title'],
                'description' => $assignment['description'],
                'due_date' => $assignment['due_date'],
                'total_points' => $assignment['total_points'],
                'assignment_type' => $assignment['assignment_type'],
                'status' => $assignment['status'],
                'attachment_file' => $assignment['attachment_file'],
                'created_at' => $assignment['created_at'],
                'updated_at' => $assignment['updated_at'],
                'teacher' => [
                    'id' => $assignment['teacher_id'],
                    'first_name' => $assignment['teacher_first_name'],
                    'last_name' => $assignment['teacher_last_name'],
                    'full_name' => $assignment['teacher_first_name'] . ' ' . $assignment['teacher_last_name'],
                    'email' => $assignment['teacher_email']
                ],
                'subject' => [
                    'id' => $assignment['subject_id'],
                    'name' => $assignment['subject_name'],
                    'code' => $assignment['subject_code']
                ],
                'class' => [
                    'id' => $assignment['class_id'],
                    'name' => $assignment['class_name'],
                    'section' => $assignment['class_section']
                ],
                'submission' => $submission
            ];
            
                http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $restructuredAssignment,
                'message' => 'Assignment retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Submit an assignment
     */
    public function submitAssignment($assignmentId) {
        try {
            // Require student authentication
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            $student = $_REQUEST['current_student'];
            
            // Get the assignment
            $assignment = $this->classAssignmentModel->findById($assignmentId);
            
            if (!$assignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            // Check if assignment belongs to student's class
            if ($assignment['class_id'] != $student['current_class_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Assignment does not belong to your class.'
                ]);
                return;
            }
            
            // Check if assignment is still open
            $dueDate = new DateTime($assignment['due_date']);
            $now = new DateTime();
            
            if ($now > $dueDate) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment is past due date'
                ]);
                return;
            }
            
            // Check if already submitted
            $existingSubmission = $this->studentAssignmentModel->getByStudentAndAssignment(
                $student['id'], 
                $assignmentId
            );
            
            if ($existingSubmission) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment already submitted'
                ]);
                return;
            }
            
            // Handle multipart form data
            $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
            $rawData = file_get_contents('php://input');
            
            if (strpos($content_type, 'multipart/form-data') !== false) {
                // For POST requests with multipart data, PHP automatically populates $_POST and $_FILES
                $data = $_POST ?? [];
                // $_FILES is already populated by PHP
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            // Validate required fields
            if (empty($data['submission_text']) && empty($_FILES['submission_file'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Either submission text or file is required'
                ]);
                return;
            }
            
            $submissionData = [
                'student_id' => $student['id'],
                'assignment_id' => $assignmentId,
                'submission_text' => $data['submission_text'] ?? null,
                'submission_file' => null,
                'submitted_at' => date('Y-m-d H:i:s'),
                'status' => 'submitted'
            ];
            
            // Handle file upload if provided
            if (!empty($_FILES['submission_file']) && $_FILES['submission_file']['error'] === UPLOAD_ERR_OK) {
                require_once __DIR__ . '/../utils/assignment_uploads.php';
                $attachmentData = uploadStudentSubmission($_FILES['submission_file']);
                if ($attachmentData['success']) {
                    $submissionData['submission_file'] = $attachmentData['filepath'];
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => $attachmentData['message']
                    ]);
                    return;
                }
            }
            
            // Create submission
            $submissionId = $this->studentAssignmentModel->create($submissionData);
            
            if ($submissionId) {
                // Log the action
                $this->logAction('assignment_submitted', "Submitted assignment: {$assignment['title']}", [
                    'assignment_id' => $assignmentId,
                    'submission_id' => $submissionId
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'submission_id' => $submissionId,
                        'submitted_at' => $submissionData['submitted_at']
                    ],
                    'message' => 'Assignment submitted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error submitting assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error submitting assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update an existing submission
     */
    public function updateSubmission($assignmentId) {
        try {
            // Require student authentication
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            $student = $_REQUEST['current_student'];
            
            // Get the assignment
            $assignment = $this->classAssignmentModel->findById($assignmentId);
            
            if (!$assignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            // Check if assignment belongs to student's class
            if ($assignment['class_id'] != $student['current_class_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Assignment does not belong to your class.'
                ]);
                return;
            }
            
            // Get existing submission
            $existingSubmission = $this->studentAssignmentModel->getByStudentAndAssignment(
                $student['id'], 
                $assignmentId
            );
            
            if (!$existingSubmission) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No submission found for this assignment'
                ]);
                return;
            }
            
            // Check if assignment is still open
            $dueDate = new DateTime($assignment['due_date']);
            $now = new DateTime();
            
            if ($now > $dueDate) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment is past due date'
                ]);
                return;
            }
            
            // Handle multipart form data
            $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
            $rawData = file_get_contents('php://input');
            
            if (strpos($content_type, 'multipart/form-data') !== false) {
                // For PUT/PATCH requests with multipart data, PHP doesn't populate $_POST and $_FILES
                if (in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH'])) {
                    require_once __DIR__ . '/../core/MultipartFormParser.php';
                    MultipartFormParser::processRequest($rawData, $content_type);
                    $data = $_POST ?? [];
                } else {
                    // For POST requests with multipart data, PHP automatically populates $_POST and $_FILES
                    $data = $_POST ?? [];
                }
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            $updateData = [
                'submission_text' => $data['submission_text'] ?? $existingSubmission['submission_text'],
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            // Handle file upload if provided
            if (!empty($_FILES['submission_file']) && $_FILES['submission_file']['error'] === UPLOAD_ERR_OK) {
                require_once __DIR__ . '/../utils/assignment_uploads.php';
                
                // Delete old submission file if exists
                if (!empty($existingSubmission['submission_file'])) {
                    deleteAssignmentFiles($existingSubmission['submission_file']);
                }
                
                // Upload new submission file
                $attachmentData = uploadStudentSubmission($_FILES['submission_file']);
                if ($attachmentData['success']) {
                    $updateData['submission_file'] = $attachmentData['filepath'];
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => $attachmentData['message']
                    ]);
                    return;
                }
            }
            
            // Update submission
            $updated = $this->studentAssignmentModel->update($existingSubmission['id'], $updateData);
            
            if ($updated) {
                // Log the action
                $this->logAction('assignment_updated', "Updated submission for assignment: {$assignment['title']}", [
                    'assignment_id' => $assignmentId,
                    'submission_id' => $existingSubmission['id']
                ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                    'message' => 'Submission updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating submission'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating submission: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get submission history for the current student
     */
    public function getSubmissionHistory() {
        try {
            // Require student authentication
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            $student = $_REQUEST['current_student'];
            
            // Get all submissions for the student
            $submissions = $this->studentAssignmentModel->getByStudentId($student['id']);
            
            // Add assignment details to each submission
            foreach ($submissions as &$submission) {
                $assignment = $this->classAssignmentModel->findById($submission['assignment_id']);
                $submission['assignment'] = $assignment;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $submissions,
                'message' => 'Submission history retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving submission history: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get grades and feedback for the current student
     */
    public function getGrades() {
        try {
            // Require student authentication
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            $student = $_REQUEST['current_student'];
            
            // Get graded submissions
            $gradedSubmissions = $this->studentAssignmentModel->getGradedByStudentId($student['id']);
            
            // Add assignment details to each submission
            foreach ($gradedSubmissions as &$submission) {
                $assignment = $this->classAssignmentModel->findById($submission['assignment_id']);
                $submission['assignment'] = $assignment;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $gradedSubmissions,
                'message' => 'Grades retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving grades: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * List terminal/student grades for the authenticated student
     * Filters: subject_id, grading_period_id (optional)
     */
    public function listMyStudentGrades() {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/StudentMiddleware.php';
            StudentMiddleware::requireStudent($pdo);

            $student = $_REQUEST['current_student'];

            $query = $_GET ?? [];
            $subjectId = isset($query['subject_id']) ? (int)$query['subject_id'] : null;
            $periodId = isset($query['grading_period_id']) ? (int)$query['grading_period_id'] : null;

            $filters = [];
            if ($subjectId) { $filters['subject_id'] = $subjectId; }
            if ($periodId) { $filters['grading_period_id'] = $periodId; }

            require_once __DIR__ . '/../models/StudentGradeModel.php';
            $gradeModel = new StudentGradeModel($pdo);
            $grades = $gradeModel->getStudentGradesWithDetails((int)$student['id'], $filters);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $grades, 'message' => 'Grades retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving grades: ' . $e->getMessage()]);
        }
    }

    /**
     * Show one terminal/student grade for the authenticated student
     */
    public function showMyStudentGrade($id) {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/StudentMiddleware.php';
            StudentMiddleware::requireStudent($pdo);

            $student = $_REQUEST['current_student'];

            require_once __DIR__ . '/../models/StudentGradeModel.php';
            $gradeModel = new StudentGradeModel($pdo);
            $grade = $gradeModel->getGradeWithDetails($id);
            if (!$grade) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Grade not found']);
                return;
            }
            if ((int)$grade['student_id'] !== (int)$student['id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: This grade does not belong to you']);
                return;
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $grade, 'message' => 'Grade retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving grade: ' . $e->getMessage()]);
        }
    }

    /**
     * Get grading periods for student (student-only)
     */
    public function getGradingPeriods() {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/StudentMiddleware.php';
            StudentMiddleware::requireStudent($pdo);
            require_once __DIR__ . '/../models/GradingPeriodModel.php';
            $gpm = new GradingPeriodModel($pdo);
            $periods = $gpm->findAll();
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $periods, 'message' => 'Grading periods retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving grading periods: ' . $e->getMessage()]);
        }
    }

    /**
     * Get subjects assigned to student's class (student-only)
     */
    public function getMyClassSubjects() {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/StudentMiddleware.php';
            StudentMiddleware::requireStudent($pdo);

            $student = $_REQUEST['current_student'];
            $classId = $student['current_class_id'] ?? null;

            if (!$classId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Student not assigned to any class']);
                return;
            }

            require_once __DIR__ . '/../models/ClassSubjectModel.php';
            $classSubjectModel = new ClassSubjectModel($pdo);
            $subjects = $classSubjectModel->getByClassId($classId);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $subjects, 'message' => 'Class subjects retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving class subjects: ' . $e->getMessage()]);
        }
    }

    /**
     * Print terminal report for the authenticated student (student-only)
     * Generates HTML report for the student across all subjects
     */
    public function printTerminalReport() {
        try {
            // Require student authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/StudentMiddleware.php';
            StudentMiddleware::requireStudent($pdo);

            $student = $_REQUEST['current_student'];
            $query = $_GET ?? [];
            $periodId = isset($query['grading_period_id']) ? (int)$query['grading_period_id'] : null;

            // Get student's class information
            $classId = $student['current_class_id'] ?? null;
            if (!$classId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Student not assigned to any class']);
                return;
            }

            // Get class information
            require_once __DIR__ . '/../models/ClassModel.php';
            $classModel = new ClassModel($pdo);
            $class = $classModel->findById($classId);
            
            if (!$class) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Class not found']);
                return;
            }

            // Get class subjects
            require_once __DIR__ . '/../models/ClassSubjectModel.php';
            $classSubjectModel = new ClassSubjectModel($pdo);
            $classSubjects = $classSubjectModel->getByClassId($classId);
            
            if (!is_array($classSubjects)) {
                $classSubjects = [];
            }

            // Get grades for this student
            require_once __DIR__ . '/../models/StudentGradeModel.php';
            $gradeModel = new StudentGradeModel($pdo);
            $grades = $gradeModel->getStudentGradesWithDetails((int)$student['id'], ['class_id' => $classId, 'grading_period_id' => $periodId]);

            // Generate the HTML report using the existing template
            $html = $this->generateStudentTerminalReportHTML($student, $class, $grades, $classSubjects, $periodId);

            // Set content type to HTML
            header('Content-Type: text/html; charset=utf-8');
            header('Content-Disposition: inline; filename="student_terminal_report.html"');
            
            echo $html;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error generating terminal report: ' . $e->getMessage()]);
        }
    }

    /**
     * Generate student terminal report HTML using the existing template
     */
    private function generateStudentTerminalReportHTML($student, $class, $grades, $classSubjects, $periodId) {
        // Get school settings
        $schoolSettings = $this->getSchoolSettings();
        
        // Get grading period name
        $gradingPeriodName = 'All Periods';
        if ($periodId) {
            require_once __DIR__ . '/../models/GradingPeriodModel.php';
            $periodModel = new GradingPeriodModel($this->pdo);
            $period = $periodModel->findById($periodId);
            if ($period) {
                $gradingPeriodName = $period['name'];
            }
        }
        
        // Get academic year
        $academicYear = 'N/A';
        if ($class['academic_year_id']) {
            require_once __DIR__ . '/../models/AcademicYearModel.php';
            $academicYearModel = new AcademicYearModel($this->pdo);
            $academicYearData = $academicYearModel->findById($class['academic_year_id']);
            if ($academicYearData) {
                $academicYear = $academicYearData['year_code'];
            }
        }
        
        // Get class teacher information
        $teacherName = 'No Class Teacher';
        try {
            require_once __DIR__ . '/../models/TeacherAssignmentModel.php';
            $teacherAssignmentModel = new TeacherAssignmentModel($this->pdo);
            
            // Get the first teacher assignment for this class (any subject)
            $assignments = $teacherAssignmentModel->getWithDetails(['class_id' => $class['id']]);
            
            if (!empty($assignments)) {
                $firstAssignment = $assignments[0];
                $teacherName = $firstAssignment['teacher_first_name'] . ' ' . $firstAssignment['teacher_last_name'];
            }
        } catch (Exception $e) {
            // If there's an error, keep the default value
            $teacherName = 'No Class Teacher';
        }
        
        // Generate HTML directly
        $html = '<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Student Terminal Report - ' . htmlspecialchars($student['first_name'] . ' ' . $student['last_name']) . '</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .school-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .report-title { font-size: 20px; margin-bottom: 10px; }
                .student-info { margin-bottom: 30px; }
                .info-row { display: flex; margin-bottom: 10px; }
                .info-label { font-weight: bold; width: 150px; }
                .grades-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .grades-table th, .grades-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .grades-table th { background-color: #f2f2f2; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="school-name">' . htmlspecialchars($schoolSettings['application_name'] ?? 'School Management System') . '</div>
                <div class="report-title">Student Terminal Report</div>
                <div>' . htmlspecialchars($gradingPeriodName) . ' - ' . htmlspecialchars($academicYear) . '</div>
            </div>
            
            <div class="student-info">
                <div class="info-row">
                    <span class="info-label">Student Name:</span>
                    <span>' . htmlspecialchars($student['first_name'] . ' ' . $student['last_name']) . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Student ID:</span>
                    <span>' . htmlspecialchars($student['student_id'] ?? 'N/A') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Class:</span>
                    <span>' . htmlspecialchars($class['name'] . ' (' . $class['section'] . ')') . '</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Class Teacher:</span>
                    <span>' . htmlspecialchars($teacherName) . '</span>
                </div>
            </div>
            
            <table class="grades-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Assignment Total</th>
                        <th>Exam Total</th>
                        <th>Final Percentage</th>
                        <th>Letter Grade</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>';
        
        // Add grade rows
        foreach ($classSubjects as $subject) {
            $subjectId = $subject['subject_id'];
            $grade = null;
            
            // Find grade for this subject
            foreach ($grades as $g) {
                if ($g['subject_id'] == $subjectId) {
                    $grade = $g;
                    break;
                }
            }
            
            $html .= '<tr>
                <td>' . htmlspecialchars($subject['subject_name'] ?? $subject['subject_code']) . '</td>
                <td>' . ($grade ? number_format($grade['assignment_total'] ?? 0, 2) : 'N/A') . '</td>
                <td>' . ($grade ? number_format($grade['exam_total'] ?? 0, 2) : 'N/A') . '</td>
                <td>' . ($grade ? number_format($grade['final_percentage'] ?? 0, 2) . '%' : 'N/A') . '</td>
                <td>' . htmlspecialchars($grade['final_letter_grade'] ?? 'N/A') . '</td>
                <td>' . htmlspecialchars($grade['remarks'] ?? '') . '</td>
            </tr>';
        }
        
        $html .= '</tbody>
            </table>
            
            <div class="footer">
                <p>Generated on: ' . date('F j, Y \a\t g:i A') . '</p>
                <p>This is an official document from ' . htmlspecialchars($schoolSettings['application_name'] ?? 'School Management System') . '</p>
            </div>
        </body>
        </html>';
        
        return $html;
    }

    /**
     * Get school settings for the report
     */
    private function getSchoolSettings() {
        try {
            require_once __DIR__ . '/../models/SettingModel.php';
            $settingModel = new SettingModel($this->pdo);
            $settings = $settingModel->getAllAsArray();
            
            return $settings;
        } catch (Exception $e) {
            // Return default settings if there's an error
            return [
                'application_name' => 'School Management System',
                'application_tagline' => 'Excellence in Education',
                'application_logo' => '',
                'school_address' => 'School Address',
                'school_phone' => 'School Phone',
                'school_email' => 'school@example.com'
            ];
        }
    }

    /**
     * Download assignment attachment (student only)
     */
    public function downloadAssignmentAttachment($filename) {
        try {
            // Require student authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/StudentMiddleware.php';
            StudentMiddleware::requireStudent($pdo);
            
            $student = $_REQUEST['current_student'];
            
            // Check for token in Authorization header or query parameter
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            $token = null;
            
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
            } else {
                // Fallback: check query parameter for token (for window.open requests)
                $token = $_GET['token'] ?? null;
            }
            
            if (!$token) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Authentication token required'
                ]);
                return;
            }
            
            // Validate token and get student
            require_once __DIR__ . '/../models/UserSessionModel.php';
            $userSessionModel = new UserSessionModel($pdo);
            $session = $userSessionModel->findActiveSession($token);
            
            if (!$session) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid or expired token'
                ]);
                return;
            }
            
            // Check if user is a student
            $studentFromToken = $this->studentModel->findByUserId($session['user_id']);
            if (!$studentFromToken) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Students only.'
                ]);
                return;
            }

            // Sanitize filename
            $filename = basename($filename);

            // Define the file path
            $filePath = __DIR__ . '/../uploads/assignments/attachments/' . $filename;

            // Check if file exists
            if (!file_exists($filePath)) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'File not found'
                ]);
                return;
            }

            // Get file info
            $fileInfo = pathinfo($filePath);

            // Set headers to force download instead of displaying in browser
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Length: ' . filesize($filePath));
            header('Cache-Control: no-cache, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');

            // Output file content
            readfile($filePath);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error downloading file: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Archive a student assignment submission
     */
    public function archiveAssignment($assignmentId) {
        try {
            // Require student authentication
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            $student = $_REQUEST['current_student'];
            
            // Check if assignment exists and belongs to student's class
            $assignment = $this->classAssignmentModel->getAssignmentWithDetails($assignmentId);
            if (!$assignment || $assignment['class_id'] != $student['current_class_id']) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found or access denied'
                ]);
                return;
            }
            
            // Check if student has submitted this assignment
            $submission = $this->studentAssignmentModel->getByStudentAndAssignment($student['id'], $assignmentId);
            if (!$submission || !in_array($submission['status'], ['submitted', 'graded', 'late'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Can only archive submitted assignments'
                ]);
                return;
            }
            
            // Archive the submission
            $success = $this->studentAssignmentModel->archiveSubmission($student['id'], $assignmentId);
            
            if ($success) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Assignment archived successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to archive assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error archiving assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Unarchive a student assignment submission
     */
    public function unarchiveAssignment($assignmentId) {
        try {
            // Require student authentication
            global $pdo;
            StudentMiddleware::requireStudent($pdo);
            
            $student = $_REQUEST['current_student'];
            
            // Check if assignment exists and belongs to student's class
            $assignment = $this->classAssignmentModel->getAssignmentWithDetails($assignmentId);
            if (!$assignment || $assignment['class_id'] != $student['current_class_id']) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found or access denied'
                ]);
                return;
            }
            
            // Check if student has submitted this assignment
            $submission = $this->studentAssignmentModel->getByStudentAndAssignment($student['id'], $assignmentId);
            if (!$submission) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment submission not found'
                ]);
                return;
            }
            
            // Unarchive the submission
            $success = $this->studentAssignmentModel->unarchiveSubmission($student['id'], $assignmentId);
            
            if ($success) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Assignment unarchived successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to unarchive assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error unarchiving assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get gender statistics for students (admin only)
     */
    public function getGenderStatistics() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $genderStats = $this->studentModel->getGenderStatistics();
            $genderStatsByClass = $this->studentModel->getGenderStatisticsByClass();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'overall' => $genderStats,
                    'by_class' => $genderStatsByClass
                ],
                'message' => 'Gender statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving gender statistics: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Promote a student to a new class
     * 
     * @return void
     */
    public function promoteStudent() {
        try {
            global $pdo;
            
            // Check if user is authenticated and has admin role
            RoleMiddleware::requireAdmin($pdo);
            
            // Get request data
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['student_id']) || !isset($data['new_class_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'student_id and new_class_id are required'
                ]);
                return;
            }
            
            $studentId = (int)$data['student_id'];
            $newClassId = (int)$data['new_class_id'];
            
            // Validate IDs
            if ($studentId <= 0 || $newClassId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid student_id or new_class_id'
                ]);
                return;
            }
            
            // Check if student exists and is active
            $student = $this->studentModel->findById($studentId);
            if (!$student) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student not found'
                ]);
                return;
            }
            
            if ($student['status'] !== 'active') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Only active students can be promoted'
                ]);
                return;
            }
            
            // Check if new class exists
            require_once __DIR__ . '/../models/ClassModel.php';
            $classModel = new ClassModel($pdo);
            $newClass = $classModel->findById($newClassId);
            if (!$newClass) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'New class not found'
                ]);
                return;
            }
            
            // Check if student is already in the target class
            if ($student['current_class_id'] == $newClassId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student is already in the target class'
                ]);
                return;
            }
            
            // Get current class info for logging
            $currentClass = null;
            if ($student['current_class_id']) {
                $currentClass = $classModel->findById($student['current_class_id']);
            }
            
            // Start transaction
            $pdo->beginTransaction();
            
            try {
                // Update student's class
                $updateData = [
                    'current_class_id' => $newClassId,
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                $success = $this->studentModel->update($studentId, $updateData);
                
                if (!$success) {
                    throw new Exception('Failed to update student class');
                }
                
                // Log the promotion
                require_once __DIR__ . '/../models/StudentPromotionLogModel.php';
                $promotionLogModel = new StudentPromotionLogModel($pdo);
                
                // Get the current admin user ID from the token
                $currentUserId = $this->getCurrentUserId();
                
                $logData = [
                    'student_id' => $studentId,
                    'from_class_id' => $student['current_class_id'],
                    'to_class_id' => $newClassId,
                    'promoted_by' => $currentUserId,
                    'promotion_date' => date('Y-m-d H:i:s'),
                    'notes' => $data['notes'] ?? 'Student promoted to next class level'
                ];
                
                $promotionLogModel->create($logData);
                
                // Commit transaction
                $pdo->commit();
                
                // Get updated student data
                $updatedStudent = $this->studentModel->findById($studentId);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Student promoted successfully',
                    'data' => [
                        'student' => $updatedStudent,
                        'from_class' => $currentClass ? $currentClass['name'] . '-' . $currentClass['section'] : 'No Class',
                        'to_class' => $newClass['name'] . '-' . $newClass['section'],
                        'promotion_date' => date('Y-m-d H:i:s')
                    ]
                ]);
                
            } catch (Exception $e) {
                // Rollback transaction
                $pdo->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to promote student: ' . $e->getMessage()
            ]);
        }
    }

}
?> 