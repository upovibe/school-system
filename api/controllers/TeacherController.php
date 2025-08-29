<?php
// api/controllers/TeacherController.php - Controller for teacher operations

require_once __DIR__ . '/../models/TeacherModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/SettingModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
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
     * Get only the teacher's own announcements (teacher only)
     * This method returns ONLY announcements created by the current teacher
     */
    public function getMyOwnAnnouncements() {
        try {
            // Require teacher authentication
            global $pdo;
            TeacherMiddleware::requireTeacher($pdo);
            $teacher = $_REQUEST['current_teacher'];
            
            $conditions = [];
            $params = [];
            
            // Add filters if provided
            if (isset($_GET['announcement_type']) && $_GET['announcement_type'] !== '') {
                $conditions[] = 'announcement_type = ?';
                $params[] = $_GET['announcement_type'];
            }
            if (isset($_GET['priority']) && $_GET['priority'] !== '') {
                $conditions[] = 'priority = ?';
                $params[] = $_GET['priority'];
            }
            if (isset($_GET['is_active']) && $_GET['is_active'] !== '') {
                $conditions[] = 'is_active = ?';
                $params[] = (int) (!!$_GET['is_active']);
            }
            if (isset($_GET['is_pinned']) && $_GET['is_pinned'] !== '') {
                $conditions[] = 'is_pinned = ?';
                $params[] = (int) (!!$_GET['is_pinned']);
            }
            
            // ONLY show announcements created by the current teacher
            $conditions[] = 'created_by = ?';
            $params[] = $teacher['user_id'];
            
            $where = '';
            if (!empty($conditions)) {
                $where = 'WHERE ' . implode(' AND ', $conditions);
            }
            
            // Get announcements with enhanced details
            require_once __DIR__ . '/../models/AnnouncementModel.php';
            $announcementModel = new AnnouncementModel($this->pdo);
            $announcements = $announcementModel->getAllWithDetails($where, $params);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $announcements,
                'message' => 'Your announcements retrieved successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving your announcements: ' . $e->getMessage()
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

            // Validate dates are not in the future
            $today = date('Y-m-d');
            if (!empty($data['hire_date']) && strtotime($data['hire_date']) > strtotime($today)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Hire date cannot be in the future'
                ]);
                return;
            }
            if (!empty($data['date_of_birth']) && strtotime($data['date_of_birth']) > strtotime($today)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Date of birth cannot be in the future'
                ]);
                return;
            }
            // Enforce minimum age: at least 10 years old if DOB provided
            if (!empty($data['date_of_birth'])) {
                $minDob = date('Y-m-d', strtotime('-10 years'));
                if (strtotime($data['date_of_birth']) > strtotime($minDob)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Teacher must be at least 10 years old'
                    ]);
                    return;
                }
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

            // Validate dates are not in the future
            $today = date('Y-m-d');
            if (!empty($data['hire_date']) && strtotime($data['hire_date']) > strtotime($today)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Hire date cannot be in the future'
                ]);
                return;
            }
            if (!empty($data['date_of_birth']) && strtotime($data['date_of_birth']) > strtotime($today)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Date of birth cannot be in the future'
                ]);
                return;
            }
            // Enforce minimum age: at least 10 years old if DOB provided
            if (!empty($data['date_of_birth'])) {
                $minDob = date('Y-m-d', strtotime('-10 years'));
                if (strtotime($data['date_of_birth']) > strtotime($minDob)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Teacher must be at least 10 years old'
                    ]);
                    return;
                }
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

            // Get the user ID before deleting the teacher
            $userId = $existingTeacher['user_id'];
            
            // Start transaction to ensure both operations succeed or fail together
            $this->pdo->beginTransaction();
            
            try {
                // Delete teacher first
                $this->teacherModel->delete($id);
                
                // Delete the associated user account if user_id exists
                if ($userId) {
                    $this->userModel->delete($userId);
                }
                
                // Commit transaction
                $this->pdo->commit();
                
                // Log teacher deletion
                $this->logAction('teacher_deleted', 'Teacher and associated user account deleted', $existingTeacher);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Teacher and associated user account deleted successfully'
                ]);
                
            } catch (Exception $e) {
                // Rollback transaction on error
                $this->pdo->rollBack();
                throw $e;
            }
            
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

            // Get class details with academic year information
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

            // Get academic year information
            require_once __DIR__ . '/../models/AcademicYearModel.php';
            $academicYearModel = new AcademicYearModel($pdo);
            $academicYear = null;
            if (!empty($class['academic_year_id'])) {
                $academicYear = $academicYearModel->findById($class['academic_year_id']);
            }

            // Get students in this class
            require_once __DIR__ . '/../models/StudentModel.php';
            $studentModel = new StudentModel($pdo);
            $students = $studentModel->getStudentsByClass($teacher['class_id']);

            // Get subjects this teacher teaches in this class
            // Prefer all class subjects; if none, fall back to teacher assignments
            require_once __DIR__ . '/../models/ClassSubjectModel.php';
            $classSubjectModel = new ClassSubjectModel($pdo);
            $classSubjects = $classSubjectModel->getByClassId($teacher['class_id']);
            $subjects = array_map(function($cs) {
                return [
                    'id' => (int)$cs['subject_id'],
                    'name' => $cs['subject_name'] ?? ($cs['subject_code'] ?? (string)$cs['subject_id']),
                    'code' => $cs['subject_code'] ?? null,
                ];
            }, $classSubjects);
            if (empty($subjects)) {
                require_once __DIR__ . '/../models/TeacherAssignmentModel.php';
                $taModel = new TeacherAssignmentModel($pdo);
                $assignments = $taModel->getByTeacherAndClass($teacher['id'], $teacher['class_id']);
                foreach ($assignments as $row) {
                    $subjects[] = [
                        'id' => (int)$row['subject_id'],
                        'name' => $row['subject_name'] ?? ($row['subject_code'] ?? (string)$row['subject_id']),
                        'code' => $row['subject_code'] ?? null,
                    ];
                }
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'teacher_id' => $teacher['id'],
                    'teacher_name' => $teacher['first_name'] . ' ' . $teacher['last_name'],
                    'class_id' => $class['id'],
                    'class_name' => $class['name'],
                    'class_section' => $class['section'],
                    'academic_year' => $academicYear ? $academicYear['year_code'] : 'N/A',
                    'capacity' => $class['capacity'],
                    'status' => $class['status'],
                    'students' => $students,
                    'student_count' => count($students),
                    'subjects' => $subjects
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
            
            // Get filters from query parameters
            $filters = [];
            if (isset($_GET['status']) && $_GET['status'] === 'deleted') {
                $filters['include_deleted'] = true;
            }
            if (isset($_GET['class_id']) && !empty($_GET['class_id'])) {
                $filters['class_id'] = $_GET['class_id'];
            }
            if (isset($_GET['subject_id']) && !empty($_GET['subject_id'])) {
                $filters['subject_id'] = $_GET['subject_id'];
            }
            if (isset($_GET['assignment_type']) && !empty($_GET['assignment_type'])) {
                $filters['assignment_type'] = $_GET['assignment_type'];
            }
            
            // Get teacher assignments with class and subject details
            $assignments = $this->teacherModel->getTeacherAssignments($teacher['id'], $filters);
            
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
                // For POST requests with multipart data, PHP automatically populates $_POST and $_FILES
                $data = $_POST ?? [];
                // $_FILES is already populated by PHP
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
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => $attachmentData['message']
                    ]);
                    return;
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
                // Handle PUT/PATCH requests with multipart/form-data
                if (in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH'])) {
                    // For PUT/PATCH requests, PHP doesn't populate $_POST and $_FILES
                    require_once __DIR__ . '/../core/MultipartFormParser.php';
                    MultipartFormParser::processRequest($rawData, $content_type);
                    $data = $_POST ?? [];
                } else {
                    // For POST requests with multipart data, PHP automatically populates $_POST and $_FILES
                    $data = $_POST ?? [];
                    // $_FILES is already populated by PHP
                }
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
                
                // Delete old attachment file if exists
                if (!empty($existingAssignment['attachment_file'])) {
                    deleteAssignmentFiles($existingAssignment['attachment_file']);
                }
                
                // Upload new attachment
                $attachmentData = uploadAssignmentAttachment($_FILES['attachment']);
                if ($attachmentData['success']) {
                    $data['attachment_file'] = $attachmentData['filepath'];
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => $attachmentData['message']
                    ]);
                    return;
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
     * Get a specific student's submission for an assignment (teacher only)
     */
    public function getStudentSubmission($assignmentId, $studentId) {
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
                    'message' => 'You can only view submissions for your own assignments'
                ]);
                return;
            }
            
            // Get student submission details
            $submission = $studentAssignmentModel->getStudentSubmissionForTeacher($assignmentId, $studentId);
            
            if (!$submission) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student submission not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'assignment' => $assignment,
                    'submission' => $submission
                ],
                'message' => 'Student submission retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving student submission: ' . $e->getMessage()
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

    /**
     * Soft delete assignment (teacher only)
     */
    public function softDeleteAssignment($id) {
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
            
            // Check if assignment is already soft deleted
            if ($existingAssignment['deleted_at'] !== null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment is already deleted'
                ]);
                return;
            }
            
            // Check if assignment status is 'archived' before allowing soft delete
            if ($existingAssignment['status'] !== 'archived') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment must be archived before it can be deleted. Please archive the assignment first.'
                ]);
                return;
            }
            
            // Soft delete the assignment
            $result = $assignmentModel->softDelete($id, $teacher['id']);
            
            if ($result) {
                // Log the action
                $this->logAction('assignment_soft_deleted', "Soft deleted assignment: {$existingAssignment['title']}", [
                    'assignment_id' => $id,
                    'title' => $existingAssignment['title'],
                    'deleted_by' => $teacher['id']
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
     * Restore soft deleted assignment (teacher only)
     */
    public function restoreAssignment($id) {
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
            
            // Get assignment including soft deleted ones
            $existingAssignment = $assignmentModel->getAllAssignmentsWithDetails(['include_deleted' => true]);
            $existingAssignment = array_filter($existingAssignment, function($assignment) use ($id) {
                return $assignment['id'] == $id;
            });
            $existingAssignment = reset($existingAssignment);
            
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
                    'message' => 'You can only restore your own assignments'
                ]);
                return;
            }
            
            // Check if assignment is soft deleted
            if ($existingAssignment['deleted_at'] === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment is not deleted'
                ]);
                return;
            }
            
            // Restore the assignment
            $result = $assignmentModel->restore($id);
            
            if ($result) {
                // Log the action
                $this->logAction('assignment_restored', "Restored assignment: {$existingAssignment['title']}", [
                    'assignment_id' => $id,
                    'title' => $existingAssignment['title'],
                    'restored_by' => $teacher['id']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Assignment restored successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to restore assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error restoring assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Archive assignment (teacher only)
     */
    public function archiveAssignment($id) {
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
                    'message' => 'You can only archive your own assignments'
                ]);
                return;
            }
            
            // Check if assignment is already archived
            if ($existingAssignment['status'] === 'archived') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment is already archived'
                ]);
                return;
            }
            
            // Check if assignment is soft deleted
            if ($existingAssignment['deleted_at'] !== null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cannot archive a deleted assignment'
                ]);
                return;
            }
            
            // Archive the assignment
            $result = $assignmentModel->updateStatus($id, 'archived');
            
            if ($result) {
                // Log the action
                $this->logAction('assignment_archived', "Archived assignment: {$existingAssignment['title']}", [
                    'assignment_id' => $id,
                    'title' => $existingAssignment['title'],
                    'archived_by' => $teacher['id']
                ]);
                
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
     * Unarchive assignment (teacher only)
     */
    public function unarchiveAssignment($id) {
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
                    'message' => 'You can only unarchive your own assignments'
                ]);
                return;
            }
            
            // Check if assignment is archived
            if ($existingAssignment['status'] !== 'archived') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment is not archived'
                ]);
                return;
            }
            
            // Check if assignment is soft deleted
            if ($existingAssignment['deleted_at'] !== null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cannot unarchive a deleted assignment'
                ]);
                return;
            }
            
            // Unarchive the assignment (set status back to published)
            $result = $assignmentModel->updateStatus($id, 'published');
            
            if ($result) {
                // Log the action
                $this->logAction('assignment_unarchived', "Unarchived assignment: {$existingAssignment['title']}", [
                    'assignment_id' => $id,
                    'title' => $existingAssignment['title'],
                    'unarchived_by' => $teacher['id']
                ]);
                
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
     * Download assignment attachment (teacher only)
     */
    public function downloadAssignmentAttachment($filename) {
        try {
            // Require teacher authentication
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            
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
            
            // Validate token and get teacher
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
            
            // Check if user is a teacher
            $teacher = $this->teacherModel->findByUserId($session['user_id']);
            if (!$teacher) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. Teachers only.'
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

    // ========================================
    // TEACHER STUDENT GRADING (TERMINAL REPORT)
    // ========================================

    /**
     * List student grades for the teacher's class (teacher only)
     */
    public function listStudentGrades() {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);

            $teacher = $_REQUEST['current_teacher'];
            if (empty($teacher['class_id'])) {
                // Return empty data instead of error - teacher just doesn't have a class yet
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => [], 'message' => 'No class assigned to this teacher yet']);
                return;
            }

            $query = $_GET ?? [];
            $subjectId = isset($query['subject_id']) ? (int)$query['subject_id'] : null;
            $periodId = isset($query['grading_period_id']) ? (int)$query['grading_period_id'] : null;
            $studentId = isset($query['student_id']) ? (int)$query['student_id'] : null;

            $filters = [];
            if ($subjectId) { $filters['subject_id'] = $subjectId; }
            if ($periodId) { $filters['grading_period_id'] = $periodId; }

            require_once __DIR__ . '/../models/StudentGradeModel.php';
            $gradeModel = new StudentGradeModel($pdo);
            $grades = $gradeModel->getClassGradesWithDetails((int)$teacher['class_id'], $filters);
            if ($studentId) {
                $grades = array_values(array_filter($grades, function($g) use ($studentId) { return (int)$g['student_id'] === $studentId; }));
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $grades, 'message' => 'Grades retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving grades: ' . $e->getMessage()]);
        }
    }

    /**
     * Show a single student grade if it belongs to teacher's class (teacher only)
     */
    public function showStudentGrade($id) {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);

            $teacher = $_REQUEST['current_teacher'];
            if (empty($teacher['class_id'])) {
                // Return empty data instead of error - teacher just doesn't have a class yet
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => null, 'message' => 'No class assigned to this teacher yet']);
                return;
            }

            require_once __DIR__ . '/../models/StudentGradeModel.php';
            $gradeModel = new StudentGradeModel($pdo);
            $grade = $gradeModel->getGradeWithDetails($id);
            if (!$grade) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Grade not found']);
                return;
            }
            if ((int)$grade['class_id'] !== (int)$teacher['class_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: Grade is not for your assigned class']);
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
     * Create a student grade (teacher only)
     */
    public function createStudentGrade() {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            $teacher = $_REQUEST['current_teacher'];
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $required = ['student_id', 'subject_id', 'grading_period_id', 'assignment_total', 'exam_total'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || $data[$field] === '') {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => "$field is required"]);
                    return;
                }
            }

            // Ensure teacher is a class teacher and use their assigned class
            if (empty($teacher['class_id'])) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: You are not assigned to any class as class teacher']);
                return;
            }
            $classId = (int)$teacher['class_id'];

            // Validate student belongs to the teacher's class
            require_once __DIR__ . '/../models/StudentModel.php';
            $studentModel = new StudentModel($pdo);
            $student = $studentModel->findById((int)$data['student_id']);
            if (!$student) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Student not found']);
                return;
            }
            if ((int)($student['current_class_id'] ?? 0) !== $classId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Student does not belong to your assigned class']);
                return;
            }

            // Resolve grading policy by subject
            require_once __DIR__ . '/../models/GradingPolicyModel.php';
            $policyModel = new GradingPolicyModel($pdo);
            $policy = $policyModel->getBySubjectId((int)$data['subject_id']);
            if (!$policy) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No active grading policy for this subject']);
                return;
            }

            // Prepare payload (force class_id to teacher's class)
            require_once __DIR__ . '/../models/StudentGradeModel.php';
            $gradeModel = new StudentGradeModel($pdo);
            $payload = [
                'student_id' => (int)$data['student_id'],
                'class_id' => $classId,
                'subject_id' => (int)$data['subject_id'],
                'grading_period_id' => (int)$data['grading_period_id'],
                'grading_policy_id' => (int)$policy['id'],
                'assignment_total' => (float)$data['assignment_total'],
                'exam_total' => (float)$data['exam_total'],
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $this->getCurrentUserId()
            ];

            $id = $gradeModel->createGradeWithCalculation($payload);

            $this->logAction('teacher_student_grade_created', 'Teacher created student grade', [ 'grade_id' => $id ]);

            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Grade created successfully', 'data' => ['id' => $id]]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error creating grade: ' . $e->getMessage()]);
        }
    }

    /**
     * Update a student grade (teacher only)
     */
    public function updateStudentGrade($id) {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);

            $teacher = $_REQUEST['current_teacher'];
            if (empty($teacher['class_id'])) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: You are not assigned to any class as class teacher']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            require_once __DIR__ . '/../models/StudentGradeModel.php';
            $gradeModel = new StudentGradeModel($pdo);
            $existing = $gradeModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Grade not found']);
                return;
            }

            // Ensure the grade belongs to the teacher's class
            if ((int)$existing['class_id'] !== (int)$teacher['class_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: Grade is not for your assigned class']);
                return;
            }

            // Resolve policy by existing subject
            require_once __DIR__ . '/../models/GradingPolicyModel.php';
            $policyModel = new GradingPolicyModel($pdo);
            $policy = $policyModel->getBySubjectId((int)$existing['subject_id']);
            if (!$policy) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No active grading policy for this subject']);
                return;
            }

            $payload = [
                'grading_policy_id' => (int)$policy['id'],
                'assignment_total' => isset($data['assignment_total']) ? (float)$data['assignment_total'] : (float)$existing['assignment_total'],
                'exam_total' => isset($data['exam_total']) ? (float)$data['exam_total'] : (float)$existing['exam_total'],
                'remarks' => $data['remarks'] ?? $existing['remarks'],
                'updated_by' => $this->getCurrentUserId()
            ];

            $gradeModel->updateGradeWithCalculation($id, $payload);

            $this->logAction('teacher_student_grade_updated', 'Teacher updated student grade', [ 'grade_id' => $id ]);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Grade updated successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error updating grade: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete a student grade (teacher only)
     */
    public function deleteStudentGrade($id) {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);

            $teacher = $_REQUEST['current_teacher'];
            if (empty($teacher['class_id'])) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: You are not assigned to any class as class teacher']);
                return;
            }

            require_once __DIR__ . '/../models/StudentGradeModel.php';
            $gradeModel = new StudentGradeModel($pdo);
            $existing = $gradeModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Grade not found']);
                return;
            }

            // Ensure the grade belongs to the teacher's class
            if ((int)$existing['class_id'] !== (int)$teacher['class_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: Grade is not for your assigned class']);
                return;
            }

            $gradeModel->delete($id);

            $this->logAction('teacher_student_grade_deleted', 'Teacher deleted student grade', [ 'grade_id' => $id ]);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Grade deleted successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error deleting grade: ' . $e->getMessage()]);
        }
    }

    private function getCurrentUserId() {
        try {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
                require_once __DIR__ . '/../models/UserSessionModel.php';
                $userSessionModel = new UserSessionModel($this->pdo);
                $session = $userSessionModel->findActiveSession($token);
                if ($session && !empty($session['user_id'])) {
                    return (int)$session['user_id'];
                }
                $parts = explode('.', $token);
                if (count($parts) >= 2) {
                    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                    return $payload['user_id'] ?? null;
                }
            }
        } catch (Exception $e) { return null; }
        return null;
    }

    /**
     * Get grading periods (teacher only, read-only)
     */
    public function getGradingPeriods() {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
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
     * Get gender statistics for teachers (admin only)
     */
    public function getGenderStatistics() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $genderStats = $this->teacherModel->getGenderStatistics();
            $genderStatsByDepartment = $this->teacherModel->getGenderStatisticsByDepartment();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'overall' => $genderStats,
                    'by_department' => $genderStatsByDepartment
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
                 * Debug method to check teacher assignments data (temporary)
                 */
                public function debugTeacherAssignments() {
                    try {
                        // Require teacher authentication
                        global $pdo;
                        require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
                        TeacherMiddleware::requireTeacher($pdo);

                        // Get current teacher from middleware
                        $teacher = $_REQUEST['current_teacher'];

                        // Get raw data from teacher_assignments table
                        $stmt = $pdo->prepare("
                            SELECT
                                ta.*,
                                c.name as class_name,
                                c.section as class_section,
                                s.name as subject_name,
                                s.code as subject_code
                            FROM teacher_assignments ta
                            JOIN classes c ON ta.class_id = c.id
                            JOIN subjects s ON ta.subject_id = s.id
                            WHERE ta.teacher_id = ?
                            ORDER BY c.name ASC, c.section ASC, s.name ASC
                        ");
                        $stmt->execute([$teacher['id']]);
                        $rawData = $stmt->fetchAll(PDO::FETCH_ASSOC);

                        // Also check for potential duplicate entries
                        $duplicateCheck = $pdo->prepare("
                            SELECT 
                                class_id, 
                                subject_id, 
                                COUNT(*) as count
                            FROM teacher_assignments 
                            WHERE teacher_id = ?
                            GROUP BY class_id, subject_id 
                            HAVING COUNT(*) > 1
                        ");
                        $duplicateCheck->execute([$teacher['id']]);
                        $duplicates = $duplicateCheck->fetchAll(PDO::FETCH_ASSOC);

                        http_response_code(200);
                        echo json_encode([
                            'success' => true,
                            'data' => [
                                'teacher_id' => $teacher['id'],
                                'teacher_name' => $teacher['first_name'] . ' ' . $teacher['last_name'],
                                'raw_assignments' => $rawData,
                                'total_records' => count($rawData),
                                'duplicate_check' => $duplicates,
                                'classes_found' => array_unique(array_map(function($item) {
                                    return $item['class_name'] . '-' . $item['class_section'];
                                }, $rawData))
                            ],
                            'message' => 'Debug data retrieved successfully'
                        ]);
                    } catch (Exception $e) {
                        http_response_code(500);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Error retrieving debug data: ' . $e->getMessage()
                        ]);
                    }
                }

    /**
     * Get grading policy for a subject (teacher only - restricted to their assigned class)
     */
    public function getGradingPolicyBySubject() {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            $teacher = $_REQUEST['current_teacher'];
            
            // Ensure teacher is assigned to a class
            if (empty($teacher['class_id'])) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: You are not assigned to any class as class teacher']);
                return;
            }
            
            $classId = (int)$teacher['class_id'];
            $query = $_GET ?? [];
            $subjectId = isset($query['subject_id']) ? (int)$query['subject_id'] : 0;
            
            if ($subjectId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'subject_id is required']);
                return;
            }
            
            // Verify the subject is actually taught in the teacher's assigned class
            require_once __DIR__ . '/../models/ClassSubjectModel.php';
            $classSubjectModel = new ClassSubjectModel($pdo);
            $classSubject = $classSubjectModel->findByUniqueKey($classId, $subjectId);
            
            if (!$classSubject) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: This subject is not taught in your assigned class']);
                return;
            }
            
            // Get the grading policy for the subject
            require_once __DIR__ . '/../models/GradingPolicyModel.php';
            $policyModel = new GradingPolicyModel($pdo);
            $policy = $policyModel->getBySubjectId($subjectId);
            
            if (!$policy) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'No active grading policy for this subject']);
                return;
            }
            
            // Return only relevant fields to minimize payload
            $data = [
                'id' => (int)$policy['id'],
                'subject_id' => (int)$policy['subject_id'],
                'assignment_max_score' => (int)$policy['assignment_max_score'],
                'exam_max_score' => (int)$policy['exam_max_score'],
                'grade_boundaries' => $policy['grade_boundaries']
            ];
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $data, 'message' => 'Policy retrieved']);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving policy: ' . $e->getMessage()]);
        }
    }

    /**
     * Get all available classes for promotion (teacher only)
     */
    public function getAvailableClassesForPromotion() {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            $teacher = $_REQUEST['current_teacher'];
            
            // Ensure teacher is assigned to a class
            if (empty($teacher['class_id'])) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: You are not assigned to any class as class teacher']);
                return;
            }
            
            // Get all active classes
            require_once __DIR__ . '/../models/ClassModel.php';
            $classModel = new ClassModel($pdo);
            $classes = $classModel->findAll();
            
            // Filter to only active classes and exclude teacher's current class
            $availableClasses = array_filter($classes, function($class) use ($teacher) {
                return $class['status'] === 'active' && $class['id'] != $teacher['class_id'];
            });
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => array_values($availableClasses),
                'message' => 'Available classes for promotion retrieved successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving available classes: ' . $e->getMessage()]);
        }
    }

    /**
     * Promote a student to a new class (teacher only - restricted to their assigned class)
     */
    public function promoteStudent() {
        try {
            global $pdo;
            require_once __DIR__ . '/../middlewares/TeacherMiddleware.php';
            TeacherMiddleware::requireTeacher($pdo);
            
            $teacher = $_REQUEST['current_teacher'];
            
            // Ensure teacher is assigned to a class
            if (empty($teacher['class_id'])) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: You are not assigned to any class as class teacher']);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['student_id']) || !isset($data['new_class_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'student_id and new_class_id are required']);
                return;
            }
            
            $studentId = (int)$data['student_id'];
            $newClassId = (int)$data['new_class_id'];
            
            if ($studentId <= 0 || $newClassId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid student_id or new_class_id']);
                return;
            }
            
            // Verify the student is currently in the teacher's assigned class
            require_once __DIR__ . '/../models/StudentModel.php';
            $studentModel = new StudentModel($pdo);
            $student = $studentModel->findById($studentId);
            
            if (!$student) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Student not found']);
                return;
            }
            
            if ($student['current_class_id'] != $teacher['class_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: You can only promote students from your assigned class']);
                return;
            }
            
            if ($student['status'] !== 'active') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Only active students can be promoted']);
                return;
            }
            
            // Verify the new class exists
            require_once __DIR__ . '/../models/ClassModel.php';
            $classModel = new ClassModel($pdo);
            $newClass = $classModel->findById($newClassId);
            
            if (!$newClass) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'New class not found']);
                return;
            }
            
            if ($student['current_class_id'] == $newClassId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Student is already in the target class']);
                return;
            }
            
            $currentClass = $classModel->findById($student['current_class_id']);
            
            // Use transaction for data integrity
            $pdo->beginTransaction();
            try {
                // Update student's class
                $updateData = [
                    'current_class_id' => $newClassId,
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                $success = $studentModel->update($studentId, $updateData);
                if (!$success) {
                    throw new Exception('Failed to update student class');
                }
                
                // Log the promotion
                require_once __DIR__ . '/../models/StudentPromotionLogModel.php';
                $promotionLogModel = new StudentPromotionLogModel($pdo);
                
                // Get the current teacher user ID from the token
                $currentUserId = $this->getCurrentUserId();
                
                $logData = [
                    'student_id' => $studentId,
                    'from_class_id' => $student['current_class_id'],
                    'to_class_id' => $newClassId,
                    'promoted_by' => $currentUserId,
                    'promotion_date' => date('Y-m-d H:i:s'),
                    'notes' => $data['notes'] ?? 'Student promoted by class teacher'
                ];
                
                $promotionLogModel->create($logData);
                
                $pdo->commit();
                
                // Get updated student data
                $updatedStudent = $studentModel->findById($studentId);
                
                http_response_code(200);
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
                $pdo->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to promote student: ' . $e->getMessage()]);
        }
    }

    /**
     * Print student grade report (teacher only)
     * Uses the same template as admin but with teacher authentication
     */
    public function printStudentReport() {
        try {
            // Require teacher authentication
            global $pdo;
            TeacherMiddleware::requireTeacher($pdo);
            $teacher = $_REQUEST['current_teacher'];
            
            // Get query parameters
            $classId = $_GET['class_id'] ?? null;
            $studentId = $_GET['student_id'] ?? null;
            $periodId = $_GET['grading_period_id'] ?? null;
            
            if (!$classId || !$studentId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Class ID and Student ID are required']);
                return;
            }
            
            // Verify teacher has access to this class
            if ($teacher['class_id'] != $classId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: You can only print reports for your assigned class']);
                return;
            }
            
            // Get student information
            require_once __DIR__ . '/../models/StudentModel.php';
            $studentModel = new StudentModel($pdo);
            $student = $studentModel->findById($studentId);
            
            if (!$student) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Student not found']);
                return;
            }
            
            // Verify student is in teacher's class
            if ($student['current_class_id'] != $classId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied: Student is not in your assigned class']);
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
            $grades = $gradeModel->getStudentGradesWithDetails($studentId, ['class_id' => $classId, 'grading_period_id' => $periodId]);
            
            // Generate the HTML report using the same template
            $html = $this->generateStudentReportHTML($student, $class, $grades, $classSubjects, $periodId);
            
            // Set content type to HTML
            header('Content-Type: text/html; charset=utf-8');
            echo $html;
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to generate report: ' . $e->getMessage()]);
        }
    }

    /**
     * Generate student report HTML using the same template as admin
     */
    private function generateStudentReportHTML($student, $class, $grades, $classSubjects, $periodId) {
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
        
        // Get class teacher information from teacher assignments
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
        
        // Start output buffering
        ob_start();
        
        // Extract variables for the template (exactly like StudentGradeController)
        extract([
            'student' => $student,
            'class' => $class,
            'grades' => $grades,
            'classSubjects' => $classSubjects,
            'periodId' => $periodId,
            'academicYear' => $academicYear,
            'gradingPeriodName' => $gradingPeriodName,
            'generatedDate' => date('F j, Y'),
            'generatedTime' => date('g:i A'),
            'teacherName' => $teacherName,
            'schoolSettings' => $schoolSettings
        ]);
        
        // Include the template
        include __DIR__ . '/../email/templates/student_grade_report.php';
        
        // Get the buffered content
        $html = ob_get_clean();
        
        return $html;
    }

    /**
     * Get school settings for the report
     */
    private function getSchoolSettings() {
        try {
            // Load config for URLs
            $config = require __DIR__ . '/../config/app_config.php';
            
            // Try to get settings from database first
            // Check if SettingModel class exists
            if (!class_exists('SettingModel')) {
                // Try to require it again
                require_once __DIR__ . '/../models/SettingModel.php';
            }
            
            if (!class_exists('SettingModel')) {
                throw new Exception('SettingModel class could not be loaded');
            }
            
            $settingModel = new SettingModel($this->pdo);
            $settings = $settingModel->getAllAsArray();
            
            // Construct full logo URL if logo exists
            $logoUrl = null;
            if (!empty($settings['application_logo'])) {
                // If the logo path doesn't start with 'api/', add it
                $logoPath = $settings['application_logo'];
                if (strpos($logoPath, 'api/') !== 0) {
                    $logoPath = 'api/' . $logoPath;
                }
                $logoUrl = $config['app_url'] . '/' . $logoPath;
            }
            
            // Return settings with fallbacks (exactly like StudentGradeController)
            return [
                'application_name' => $settings['application_name'] ?? 'School Management System',
                'application_logo' => $logoUrl,
                'app_url' => $config['app_url'],
                'api_url' => $config['api_url'],
                'application_tagline' => $settings['application_tagline'] ?? 'Excellence in Education',
                'contact_address' => $settings['contact_address'] ?? 'School Address',
                'contact_phone' => $settings['contact_phone'] ?? 'Phone Number',
                'contact_email' => $settings['contact_email'] ?? 'info@school.com',
                'contact_website' => $settings['contact_website'] ?? 'https://school.com'
            ];
        } catch (Exception $e) {
            // Fallback to config only
            $config = require __DIR__ . '/../config/app_config.php';
            return [
                'application_name' => 'School Management System',
                'application_logo' => null,
                'app_url' => $config['app_url'],
                'api_url' => $config['api_url'],
                'application_tagline' => 'Excellence in Education'
            ];
        }
    }

    /**
     * Print class grade report (teacher only)
     * Uses the same template as admin but with teacher authentication
     */
    public function printClassReport() {
        try {
            // Require teacher authentication
            global $pdo;
            TeacherMiddleware::requireTeacher($pdo);
            $teacher = $_REQUEST['current_teacher'];
            
            // Get query parameters
            $classId = $_GET['class_id'] ?? null;
            $subjectIds = $_GET['subject_ids'] ?? null;
            $gradingPeriodId = $_GET['grading_period_id'] ?? null;
            
            if (!$classId || !$subjectIds) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Class ID and Subject IDs are required']);
                return;
            }
            
            // Verify teacher has access to this class
            if ($teacher['class_id'] != $classId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied to this class']);
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
            
            // Get subject information
            $subjectIdsArray = explode(',', $subjectIds);
            require_once __DIR__ . '/../models/SubjectModel.php';
            $subjectModel = new SubjectModel($pdo);
            $subjects = [];
            foreach ($subjectIdsArray as $subjectId) {
                $subject = $subjectModel->findById($subjectId);
                if ($subject) {
                    $subjects[] = $subject;
                }
            }
            
            if (empty($subjects)) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Subjects not found']);
                return;
            }
            
            // Get students in the class
            require_once __DIR__ . '/../models/StudentModel.php';
            $studentModel = new StudentModel($pdo);
            $students = $studentModel->getStudentsByClass($classId);
            
            // Get grades for the class and subjects
            require_once __DIR__ . '/../models/StudentGradeModel.php';
            $gradeModel = new StudentGradeModel($pdo);
            $filters = [];
            if ($gradingPeriodId) {
                $filters['grading_period_id'] = $gradingPeriodId;
            }
            if (!empty($subjectIdsArray)) {
                $filters['subject_id'] = $subjectIdsArray;
            }
            $grades = $gradeModel->getClassGradesWithDetails($classId, $filters);
            
            // Generate the report HTML
            $html = $this->generateClassReportHTML($class, $subjects, $students, $grades, $gradingPeriodId);
            
            // Set content type to HTML
            header('Content-Type: text/html; charset=utf-8');
            echo $html;
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to generate class report: ' . $e->getMessage()]);
        }
    }

    /**
     * Generate class report HTML using the same template as admin
     */
    private function generateClassReportHTML($class, $subjects, $students, $grades, $periodId) {
        // Get school settings
        $settings = $this->getSchoolSettings();
        
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
        
        // Get teacher for class report (Subject Teacher first, then Class Teacher as fallback)
        $teacherName = 'No Teacher Assigned';
        
        // First, try to get the Subject Teacher (teacher assigned to teach this subject in this class)
        if (!empty($subjects)) {
            try {
                require_once __DIR__ . '/../models/TeacherAssignmentModel.php';
                $teacherAssignmentModel = new TeacherAssignmentModel($this->pdo);
                
                $assignments = $teacherAssignmentModel->getWithDetails(['class_id' => $class['id'], 'subject_id' => $subjects[0]['id']]);
                if (!empty($assignments)) {
                    $firstAssignment = $assignments[0];
                    if (isset($firstAssignment['teacher_first_name']) && isset($firstAssignment['teacher_last_name'])) {
                        $teacherName = $firstAssignment['teacher_first_name'] . ' ' . $firstAssignment['teacher_last_name'];
                    }
                }
            } catch (Exception $e) {
                // Continue to fallback
            }
        }
        
        // If no Subject Teacher, try to get the Class Teacher as fallback
        if ($teacherName === 'No Teacher Assigned') {
            try {
                $stmt = $this->pdo->prepare("SELECT first_name, last_name FROM teachers WHERE class_id = ? AND status = 'active' LIMIT 1");
                $stmt->execute([$class['id']]);
                $classTeacher = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($classTeacher) {
                    $teacherName = $classTeacher['first_name'] . ' ' . $classTeacher['last_name'];
                }
            } catch (Exception $e) {
                // Keep default "No Teacher Assigned"
            }
        }
        
        // Get current date and time
        $generatedDate = date('F j, Y');
        $generatedTime = date('g:i A');
        
        // Get subject name for display (since we're printing for a specific subject)
        $subjectName = 'All Subjects';
        if (!empty($subjects)) {
            $subjectName = $subjects[0]['name'] ?? $subjects[0]['subject_name'] ?? 'All Subjects';
        }
        
        // Prepare template data
        $templateData = [
            'schoolSettings' => $settings,
            'class' => $class,
            'subjects' => $subjects,
            'students' => $students,
            'grades' => $grades,
            'gradingPeriodName' => $gradingPeriodName,
            'academicYear' => $academicYear,
            'teacherName' => $teacherName,
            'generatedDate' => $generatedDate,
            'generatedTime' => $generatedTime,
            'subjectName' => $subjectName
        ];
        
        // Start output buffering
        ob_start();
        
        // Include the template
        extract($templateData);
        include __DIR__ . '/../email/templates/class_grade_report.php';
        
        // Get the buffered content
        $html = ob_get_clean();
        
        return $html;
    }

    /**
     * Create a new announcement (teacher only)
     * Teachers can create announcements for their classes or general announcements
     */
    public function createAnnouncement() {
        try {
            // Require teacher authentication
            global $pdo;
            TeacherMiddleware::requireTeacher($pdo);
            $teacher = $_REQUEST['current_teacher'];
            
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            
            // Validate required fields
            $required = ['title', 'content', 'target_audience'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                    ]);
                    return;
                }
            }
            
            // Validate target_audience for teachers
            $validAudiences = ['students', 'specific_class'];
            if (!in_array($data['target_audience'], $validAudiences)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid target audience. Teachers can only target: students or specific_class'
                ]);
                return;
            }
            
            // Validate target_class_id if specific_class is selected
            if ($data['target_audience'] === 'specific_class') {
                if (!isset($data['target_class_id']) || $data['target_class_id'] === '') {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Target class ID is required when targeting specific class'
                    ]);
                    return;
                }
                
                // Verify teacher has access to this class
                $hasAccess = false;
                
                // Check if teacher is a class teacher for this class
                if ($teacher['class_id'] == $data['target_class_id']) {
                    $hasAccess = true;
                }
                
                // If not a class teacher, check if they teach subjects in this class
                if (!$hasAccess) {
                    require_once __DIR__ . '/../models/TeacherAssignmentModel.php';
                    $teacherAssignmentModel = new TeacherAssignmentModel($this->pdo);
                    $assignments = $teacherAssignmentModel->getByTeacherAndClass($teacher['id'], $data['target_class_id']);
                    
                    if (!empty($assignments)) {
                        $hasAccess = true;
                    }
                }
                
                if (!$hasAccess) {
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. You can only create announcements for your assigned class or classes where you teach subjects.'
                    ]);
                    return;
                }
            }
            
            // Validate that only class teachers can target students only
            if ($data['target_audience'] === 'students') {
                if (!$teacher['class_id']) {
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Access denied. Only class teachers can target students only. Subject teachers must target specific classes.'
                    ]);
                    return;
                }
                
                // Set target_class_id to teacher's assigned class when targeting students
                $data['target_class_id'] = $teacher['class_id'];
            }
            
            // Set defaults
            if (!isset($data['announcement_type'])) {
                $data['announcement_type'] = 'general';
            }
            if (!isset($data['priority'])) {
                $data['priority'] = 'normal';
            }
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }
            if (!isset($data['is_pinned'])) {
                $data['is_pinned'] = 0;
            }
            
            // Set created_by to current teacher's user ID
            $data['created_by'] = $teacher['user_id'];
            
            // Create the announcement
            require_once __DIR__ . '/../models/AnnouncementModel.php';
            $announcementModel = new AnnouncementModel($this->pdo);
            $announcementId = $announcementModel->create($data);
            
            // Log the action
            $this->logTeacherAction('announcement_created', 'Created announcement', [
                'announcement_id' => $announcementId,
                'title' => $data['title'],
                'target_audience' => $data['target_audience'],
                'target_class_id' => $data['target_class_id'] ?? null
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => ['id' => $announcementId],
                'message' => 'Announcement created successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating announcement: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get announcements for teacher (teacher only)
     * Teachers can see announcements they created and announcements relevant to their class
     */
    public function getMyAnnouncements() {
        try {
            // Require teacher authentication
            global $pdo;
            TeacherMiddleware::requireTeacher($pdo);
            $teacher = $_REQUEST['current_teacher'];
            
            $conditions = [];
            $params = [];
            
            // Add filters if provided
            if (isset($_GET['announcement_type']) && $_GET['announcement_type'] !== '') {
                $conditions[] = 'announcement_type = ?';
                $params[] = $_GET['announcement_type'];
            }
            if (isset($_GET['priority']) && $_GET['priority'] !== '') {
                $conditions[] = 'priority = ?';
                $params[] = $_GET['priority'];
            }
            if (isset($_GET['is_active']) && $_GET['is_active'] !== '') {
                $conditions[] = 'is_active = ?';
                $params[] = (int) (!!$_GET['is_active']);
            }
            if (isset($_GET['is_pinned']) && $_GET['is_pinned'] !== '') {
                $conditions[] = 'is_pinned = ?';
                $params[] = (int) (!!$_GET['is_pinned']);
            }
            
            // Teachers can see:
            // 1. Announcements they created
            // 2. Announcements for their class
            // 3. General announcements (all, teachers)
            $teacherConditions = [
                'created_by = ?', // Their own announcements
                'target_audience = "all"', // General announcements
                'target_audience = "teachers"', // Teacher-specific announcements
                '(target_audience = "specific_class" AND target_class_id = ?)' // Their class announcements
            ];
            $conditions[] = '(' . implode(' OR ', $teacherConditions) . ')';
            $params[] = $teacher['user_id']; // created_by
            $params[] = $teacher['class_id']; // target_class_id
            
            $where = '';
            if (!empty($conditions)) {
                $where = 'WHERE ' . implode(' AND ', $conditions);
            }
            
            // Get announcements with enhanced details
            require_once __DIR__ . '/../models/AnnouncementModel.php';
            $announcementModel = new AnnouncementModel($this->pdo);
            $announcements = $announcementModel->getAllWithDetails($where, $params);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $announcements,
                'message' => 'Announcements retrieved successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving announcements: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Update an announcement (teacher only)
     * Teachers can only update announcements they created
     */
    public function updateAnnouncement($id) {
        try {
            // Require teacher authentication
            global $pdo;
            TeacherMiddleware::requireTeacher($pdo);
            $teacher = $_REQUEST['current_teacher'];
            
            require_once __DIR__ . '/../models/AnnouncementModel.php';
            $announcementModel = new AnnouncementModel($this->pdo);
            
            // Get the announcement
            $announcement = $announcementModel->findById($id);
            if (!$announcement) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Announcement not found'
                ]);
                return;
            }
            
            // Verify teacher owns this announcement
            if ($announcement['created_by'] != $teacher['user_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. You can only update announcements you created.'
                ]);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            
            // Validate target_audience if provided
            if (isset($data['target_audience'])) {
                $validAudiences = ['all', 'students', 'teachers', 'specific_class'];
                if (!in_array($data['target_audience'], $validAudiences)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid target audience. Teachers can only target: ' . implode(', ', $validAudiences)
                    ]);
                    return;
                }
                
                // Validate target_class_id if specific_class is selected
                if ($data['target_audience'] === 'specific_class') {
                    if (!isset($data['target_class_id']) || $data['target_class_id'] === '') {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Target class ID is required when targeting specific class'
                        ]);
                        return;
                    }
                    
                    // Verify teacher has access to this class
                    if ($teacher['class_id'] != $data['target_class_id']) {
                        http_response_code(403);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Access denied. You can only target your assigned class.'
                        ]);
                        return;
                    }
                }
            }
            
            $updated = $announcementModel->update($id, $data);
            
            if ($updated) {
                // Log the action
                $this->logTeacherAction('announcement_updated', 'Updated announcement', [
                    'announcement_id' => $id,
                    'changes' => $data
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Announcement updated successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No changes made to announcement'
                ]);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating announcement: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete an announcement (teacher only)
     * Teachers can only delete announcements they created
     */
    public function deleteAnnouncement($id) {
        try {
            // Require teacher authentication
            global $pdo;
            TeacherMiddleware::requireTeacher($pdo);
            $teacher = $_REQUEST['current_teacher'];
            
            require_once __DIR__ . '/../models/AnnouncementModel.php';
            $announcementModel = new AnnouncementModel($this->pdo);
            
            // Get the announcement
            $announcement = $announcementModel->findById($id);
            if (!$announcement) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Announcement not found'
                ]);
                return;
            }
            
            // Verify teacher owns this announcement
            if ($announcement['created_by'] != $teacher['user_id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Access denied. You can only delete announcements you created.'
                ]);
                return;
            }
            
            $deleted = $announcementModel->delete($id);
            
            if ($deleted) {
                // Log the action
                $this->logTeacherAction('announcement_deleted', 'Deleted announcement', [
                    'announcement_id' => $id,
                    'title' => $announcement['title']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Announcement deleted successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete announcement'
                ]);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting announcement: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get announcement statistics for teacher (teacher only)
     */
    public function getAnnouncementStats() {
        try {
            // Require teacher authentication
            global $pdo;
            TeacherMiddleware::requireTeacher($pdo);
            $teacher = $_REQUEST['current_teacher'];
            
            require_once __DIR__ . '/../models/AnnouncementModel.php';
            $announcementModel = new AnnouncementModel($this->pdo);
            
            // Get basic stats
            $stats = $announcementModel->getStats();
            
            // Get teacher-specific stats
            $stmt = $this->pdo->prepare("
                SELECT 
                    COUNT(*) as total_created,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_created,
                    SUM(CASE WHEN is_pinned = 1 THEN 1 ELSE 0 END) as pinned_created,
                    COUNT(CASE WHEN target_audience = 'specific_class' THEN 1 END) as class_specific,
                    COUNT(CASE WHEN target_audience = 'students' THEN 1 END) as student_targeted,
                    COUNT(CASE WHEN target_audience = 'teachers' THEN 1 END) as teacher_targeted,
                    COUNT(CASE WHEN target_audience = 'all' THEN 1 END) as general
                FROM announcements 
                WHERE created_by = ?
            ");
            $stmt->execute([$teacher['user_id']]);
            $teacherStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Combine stats
            $combinedStats = array_merge($stats, $teacherStats);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $combinedStats,
                'message' => 'Announcement statistics retrieved successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving announcement statistics: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Log teacher actions for audit trail
     */
    private function logTeacherAction($action, $description, $details = []) {
        try {
            require_once __DIR__ . '/../models/UserLogModel.php';
            $logModel = new UserLogModel($this->pdo);
            
            $logData = [
                'user_id' => $_REQUEST['current_teacher']['user_id'],
                'action' => $action,
                'description' => $description,
                'details' => json_encode($details),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ];
            
            $logModel->create($logData);
        } catch (Exception $e) {
            // Don't fail the main operation if logging fails
            error_log("Failed to log teacher announcement action: " . $e->getMessage());
        }
    }

}
?> 