<?php
// api/controllers/TeacherController.php - Controller for teacher operations

require_once __DIR__ . '/../models/TeacherModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/ClassModel.php'; // Added for class assignment validation
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../utils/assignment_uploads.php';

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

            // Validate class assignment if provided
            if (!empty($data['class_id'])) {
                // Check if class exists
                $classModel = new ClassModel($this->pdo);
                $class = $classModel->findById($data['class_id']);
                
                if (!$class) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Selected class does not exist'
                    ]);
                    return;
                }

                // Check if class is already assigned to another teacher
                if ($this->teacherModel->isClassAssigned($data['class_id'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'This class is already assigned to another teacher'
                    ]);
                    return;
                }
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

            // Validate class assignment if provided
            if (isset($data['class_id'])) {
                if (!empty($data['class_id'])) {
                    // Check if class exists
                    $classModel = new ClassModel($this->pdo);
                    $class = $classModel->findById($data['class_id']);
                    
                    if (!$class) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Selected class does not exist'
                        ]);
                        return;
                    }

                    // Check if class is already assigned to another teacher
                    if ($this->teacherModel->isClassAssigned($data['class_id'], $id)) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'This class is already assigned to another teacher'
                        ]);
                        return;
                    }
                }
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
     * Get class teachers (teachers assigned to classes)
     */
    public function getClassTeachers() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $classTeachers = $this->teacherModel->getClassTeachers();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classTeachers,
                'message' => 'Class teachers retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving class teachers: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get available classes (classes without assigned teachers)
     */
    public function getAvailableClasses() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $availableClasses = $this->teacherModel->getAvailableClasses();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $availableClasses,
                'message' => 'Available classes retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving available classes: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get current teacher's assigned class (teacher only)
     */
    public function getMyClass() {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Check if teacher has an assigned class
            if (!$teacher['class_id']) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => null,
                    'message' => 'No class assigned to this teacher'
                ]);
                return;
            }

            // Get class details
            require_once __DIR__ . '/../models/ClassModel.php';
            $classModel = new ClassModel($pdo);
            $class = $classModel->findById($teacher['class_id']);
            
            if (!$class) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assigned class not found'
                ]);
                return;
            }

            // Get students in this class
            require_once __DIR__ . '/../models/StudentModel.php';
            $studentModel = new StudentModel($pdo);
            $students = $studentModel->getStudentsByClass($teacher['class_id']);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'teacher_id' => $teacher['id'],
                    'teacher_name' => $teacher['first_name'] . ' ' . $teacher['last_name'],
                    'class_id' => $class['id'],
                    'class_name' => $class['name'],
                    'class_section' => $class['section'],
                    'academic_year' => $class['academic_year'],
                    'capacity' => $class['capacity'],
                    'status' => $class['status'],
                    'students' => $students,
                    'student_count' => count($students)
                ],
                'message' => 'Teacher class retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher class: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get current teacher's assignments (teacher only)
     */
    public function getMyAssignments() {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Get teacher assignments with class and subject details
            $assignments = $this->teacherModel->getTeacherAssignments($teacher['id']);
            
            if (empty($assignments)) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'teacher_id' => $teacher['id'],
                        'teacher_name' => $teacher['first_name'] . ' ' . $teacher['last_name'],
                        'assignments' => [],
                        'summary' => [
                            'total_assignments' => 0,
                            'total_classes' => 0,
                            'total_subjects' => 0
                        ]
                    ],
                    'message' => 'No assignments found for this teacher'
                ]);
                return;
            }

            // Calculate summary statistics
            $uniqueClasses = [];
            $uniqueSubjects = [];
            foreach ($assignments as $class) {
                $uniqueClasses[$class['class_id']] = $class['class_name'];
                foreach ($class['subjects'] as $subject) {
                    $uniqueSubjects[$subject['subject_id']] = $subject['subject_name'];
                }
            }

            $summary = [
                'total_assignments' => count($assignments),
                'total_classes' => count($uniqueClasses),
                'total_subjects' => count($uniqueSubjects)
            ];

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'teacher_id' => $teacher['id'],
                    'teacher_name' => $teacher['first_name'] . ' ' . $teacher['last_name'],
                    'assignments' => $assignments,
                    'summary' => $summary
                ],
                'message' => 'Teacher assignments retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher assignments: ' . $e->getMessage()
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

    // ========================================
    // TEACHER ASSIGNMENT MANAGEMENT METHODS
    // ========================================

    /**
     * Get teacher's class assignments (teacher only)
     */
    public function getMyClassAssignments() {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Get query parameters for filtering
            $filters = [];
            if (isset($_GET['class_id'])) $filters['class_id'] = $_GET['class_id'];
            if (isset($_GET['subject_id'])) $filters['subject_id'] = $_GET['subject_id'];
            if (isset($_GET['status'])) $filters['status'] = $_GET['status'];
            if (isset($_GET['assignment_type'])) $filters['assignment_type'] = $_GET['assignment_type'];
            
            // Get class assignments for this teacher
            require_once __DIR__ . '/../models/ClassAssignmentModel.php';
            $assignmentModel = new ClassAssignmentModel($this->pdo);
            $assignments = $assignmentModel->getTeacherAssignments($teacher['id'], $filters);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $assignments,
                'message' => 'Teacher class assignments retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher assignments: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create new assignment (teacher only)
     */
    public function createAssignment() {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Handle multipart form data or JSON data
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                require_once __DIR__ . '/../core/MultipartFormParser.php';
                $parsed = MultipartFormParser::parse($rawData, $content_type);
                $data = $parsed['data'] ?? [];
                $_FILES = $parsed['files'] ?? [];
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            // Validate required fields
            if (empty($data['title'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Title is required'
                ]);
                return;
            }

            if (empty($data['class_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class ID is required'
                ]);
                return;
            }

            if (empty($data['subject_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject ID is required'
                ]);
                return;
            }
            
            // Verify teacher is assigned to this class and subject
            $assignments = $this->teacherModel->getTeacherAssignments($teacher['id']);
            $isAssigned = false;
            foreach ($assignments as $assignment) {
                if ($assignment['class_id'] == $data['class_id']) {
                    foreach ($assignment['subjects'] as $subject) {
                        if ($subject['subject_id'] == $data['subject_id']) {
                            $isAssigned = true;
                            break 2;
                        }
                    }
                }
            }
            
            if (!$isAssigned) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not assigned to teach this class and subject'
                ]);
                return;
            }
            
            // Convert due_date format if provided
            if (isset($data['due_date']) && !empty($data['due_date'])) {
                $dueDate = null;
                $dateFormats = [
                    'Y-m-d H:i:s',  // 2025-09-25 23:00:45
                    'Y-m-d\TH:i',   // 2025-09-25T23:00
                    'Y-m-d H:i',    // 2025-09-25 23:00
                    'd/m/Y H:i:s',  // 25/9/2025 23:00:45
                    'd/m/Y H:i'     // 25/9/2025 23:00
                ];
                
                foreach ($dateFormats as $format) {
                    $dueDate = DateTime::createFromFormat($format, $data['due_date']);
                    if ($dueDate) break;
                }
                
                if ($dueDate) {
                    $data['due_date'] = $dueDate->format('Y-m-d H:i:s');
                }
            }
            
            // Handle attachment upload if present
            if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
                require_once __DIR__ . '/../utils/assignment_uploads.php';
                $attachmentData = uploadAssignmentAttachment($_FILES['attachment']);
                if ($attachmentData['success']) {
                    $data['attachment_file'] = $attachmentData['filepath'];
                }
            }
            
            // Set teacher ID and default values
            $data['teacher_id'] = $teacher['id'];
            
            if (empty($data['total_points'])) {
                $data['total_points'] = 100.00;
            }
            
            if (empty($data['assignment_type'])) {
                $data['assignment_type'] = 'homework';
            }
            
            if (empty($data['status'])) {
                $data['status'] = 'draft';
            }
            
            // Create assignment using ClassAssignmentModel
            require_once __DIR__ . '/../models/ClassAssignmentModel.php';
            $assignmentModel = new ClassAssignmentModel($this->pdo);
            
            $result = $assignmentModel->create($data);
            
            if ($result) {
                // Get the created assignment data
                $createdAssignment = $assignmentModel->getAssignmentWithDetails($result);
                
                // Log the action
                $this->logAction('assignment_created', "Created assignment: {$data['title']}", [
                    'assignment_id' => $result,
                    'title' => $data['title'],
                    'class_id' => $data['class_id'],
                    'subject_id' => $data['subject_id']
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $createdAssignment,
                    'message' => 'Assignment created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get single assignment details (teacher only)
     */
    public function getAssignment($id) {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Get assignment details
            require_once __DIR__ . '/../models/ClassAssignmentModel.php';
            $assignmentModel = new ClassAssignmentModel($this->pdo);
            
            $assignment = $assignmentModel->getAssignmentWithDetails($id);
            
            if (!$assignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            // Verify teacher owns this assignment
            if ($assignment['teacher_id'] != $teacher['id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only view your own assignments'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $assignment,
                'message' => 'Assignment details retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving assignment details: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update assignment (teacher only)
     */
    public function updateAssignment($id) {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Check if assignment exists and teacher owns it
            require_once __DIR__ . '/../models/ClassAssignmentModel.php';
            $assignmentModel = new ClassAssignmentModel($this->pdo);
            
            $existingAssignment = $assignmentModel->findById($id);
            if (!$existingAssignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            if ($existingAssignment['teacher_id'] != $teacher['id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only update your own assignments'
                ]);
                return;
            }
            
            // Handle multipart form data or JSON data
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                require_once __DIR__ . '/../core/MultipartFormParser.php';
                $parsed = MultipartFormParser::parse($rawData, $content_type);
                $data = $parsed['data'] ?? [];
                $_FILES = $parsed['files'] ?? [];
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            // Convert due_date format if provided
            if (isset($data['due_date']) && !empty($data['due_date'])) {
                $dueDate = null;
                $dateFormats = [
                    'Y-m-d H:i:s',  // 2025-09-25 23:00:45
                    'Y-m-d\TH:i',   // 2025-09-25T23:00
                    'Y-m-d H:i',    // 2025-09-25 23:00
                    'd/m/Y H:i:s',  // 25/9/2025 23:00:45
                    'd/m/Y H:i'     // 25/9/2025 23:00
                ];
                
                foreach ($dateFormats as $format) {
                    $dueDate = DateTime::createFromFormat($format, $data['due_date']);
                    if ($dueDate) break;
                }
                
                if ($dueDate) {
                    $data['due_date'] = $dueDate->format('Y-m-d H:i:s');
                }
            }
            
            // Handle attachment upload if present
            if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
                require_once __DIR__ . '/../utils/assignment_uploads.php';
                $attachmentData = uploadAssignmentAttachment($_FILES['attachment']);
                if ($attachmentData['success']) {
                    $data['attachment_file'] = $attachmentData['filepath'];
                }
            }
            
            // Ensure all fields are included in the update (even null values)
            foreach ($data as $key => $value) {
                if ($value === 'null' || $value === '') {
                    $data[$key] = null;
                }
            }
            
            $result = $assignmentModel->update($id, $data);
            
            if ($result) {
                // Get the updated assignment data
                $updatedAssignment = $assignmentModel->getAssignmentWithDetails($id);
                
                // Log the action
                $this->logAction('assignment_updated', "Updated assignment: {$existingAssignment['title']}", [
                    'assignment_id' => $id,
                    'title' => $data['title'] ?? $existingAssignment['title']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedAssignment,
                    'message' => 'Assignment updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete assignment (teacher only)
     */
    public function deleteAssignment($id) {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Check if assignment exists and teacher owns it
            require_once __DIR__ . '/../models/ClassAssignmentModel.php';
            $assignmentModel = new ClassAssignmentModel($this->pdo);
            
            $existingAssignment = $assignmentModel->findById($id);
            if (!$existingAssignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            if ($existingAssignment['teacher_id'] != $teacher['id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only delete your own assignments'
                ]);
                return;
            }
            
            // Delete attachment file if exists
            if (!empty($existingAssignment['attachment_file'])) {
                require_once __DIR__ . '/../utils/assignment_uploads.php';
                deleteAssignmentFiles($existingAssignment['attachment_file']);
            }
            
            $result = $assignmentModel->delete($id);
            
            if ($result) {
                // Log the action
                $this->logAction('assignment_deleted', "Deleted assignment: {$existingAssignment['title']}", [
                    'assignment_id' => $id,
                    'title' => $existingAssignment['title']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Assignment deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get assignment submissions for grading (teacher only)
     */
    public function getAssignmentSubmissions($id) {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Check if assignment exists and teacher owns it
            require_once __DIR__ . '/../models/ClassAssignmentModel.php';
            require_once __DIR__ . '/../models/StudentAssignmentModel.php';
            
            $assignmentModel = new ClassAssignmentModel($this->pdo);
            $studentAssignmentModel = new StudentAssignmentModel($this->pdo);
            
            $assignment = $assignmentModel->findById($id);
            if (!$assignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            if ($assignment['teacher_id'] != $teacher['id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only view submissions for your own assignments'
                ]);
                return;
            }
            
            $submissions = $studentAssignmentModel->getAssignmentSubmissions($id);
            $statistics = $studentAssignmentModel->getAssignmentStatistics($id);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'assignment' => $assignment,
                    'submissions' => $submissions,
                    'statistics' => $statistics
                ],
                'message' => 'Assignment submissions retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving submissions: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Grade a student submission (teacher only)
     */
    public function gradeSubmission($assignmentId, $studentId) {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Check if assignment exists and teacher owns it
            require_once __DIR__ . '/../models/ClassAssignmentModel.php';
            require_once __DIR__ . '/../models/StudentAssignmentModel.php';
            
            $assignmentModel = new ClassAssignmentModel($this->pdo);
            $studentAssignmentModel = new StudentAssignmentModel($this->pdo);
            
            $assignment = $assignmentModel->findById($assignmentId);
            if (!$assignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            if ($assignment['teacher_id'] != $teacher['id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You can only grade submissions for your own assignments'
                ]);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['grade']) || !is_numeric($data['grade'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valid grade is required'
                ]);
                return;
            }
            
            $grade = floatval($data['grade']);
            $feedback = $data['feedback'] ?? null;
            
            $result = $studentAssignmentModel->gradeSubmission($studentId, $assignmentId, $grade, $feedback);
            
            if ($result) {
                // Get the updated submission
                $submission = $studentAssignmentModel->getStudentSubmission($studentId, $assignmentId);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $submission,
                    'message' => 'Submission graded successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to grade submission'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error grading submission: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get student's assignments (teacher only)
     */
    public function getStudentAssignments($studentId) {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            // Get current teacher from middleware
            $teacher = $_REQUEST['current_teacher'];
            
            // Get student's assignment history
            require_once __DIR__ . '/../models/StudentAssignmentModel.php';
            $studentAssignmentModel = new StudentAssignmentModel($this->pdo);
            
            $assignments = $studentAssignmentModel->getStudentAssignmentHistory($studentId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $assignments,
                'message' => 'Student assignments retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving student assignments: ' . $e->getMessage()
            ]);
        }
    }
}
?> 