<?php
// api/controllers/StudentGradeController.php - Controller for managing student grades

require_once __DIR__ . '/../models/StudentGradeModel.php';
require_once __DIR__ . '/../models/GradingPolicyModel.php';
require_once __DIR__ . '/../models/TeacherModel.php';
require_once __DIR__ . '/../models/TeacherAssignmentModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/ClassModel.php';
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../models/SubjectModel.php';
require_once __DIR__ . '/../models/GradingPeriodModel.php';
require_once __DIR__ . '/../models/AcademicYearModel.php';
require_once __DIR__ . '/../models/SettingModel.php';
require_once __DIR__ . '/../models/ClassSubjectModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class StudentGradeController {
    private $pdo;
    private $gradeModel;
    private $policyModel;
    private $teacherModel;
    private $teacherAssignmentModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->gradeModel = new StudentGradeModel($pdo);
        $this->policyModel = new GradingPolicyModel($pdo);
        $this->teacherModel = new TeacherModel($pdo);
        $this->teacherAssignmentModel = new TeacherAssignmentModel($pdo);
    }

    /**
     * List grades with optional filters (admin and teacher)
     * - Admin: can list all grades or filter by student_id/class_id + optional subject/period filters
     * - Teacher: must provide student_id or class_id; results limited to their assigned class/subject pairs
     */
    public function index() {
        try {
            global $pdo;
            // Allow admin or teacher
            RoleMiddleware::requireTeacher($pdo);

            $query = $_GET ?? [];
            $studentId = isset($query['student_id']) ? (int)$query['student_id'] : null;
            $classId = isset($query['class_id']) ? (int)$query['class_id'] : null;
            $subjectId = isset($query['subject_id']) ? (int)$query['subject_id'] : null;
            $periodId = isset($query['grading_period_id']) ? (int)$query['grading_period_id'] : null;

            $filters = [];
            if ($subjectId) { $filters['subject_id'] = $subjectId; }
            if ($periodId) { $filters['grading_period_id'] = $periodId; }

            // Check if current user is admin
            $currentUserId = $this->getCurrentUserId();
            $isAdmin = $this->isCurrentUserAdmin();

            // If teacher, require at least student_id or class_id
            if (!$isAdmin && !$studentId && !$classId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Provide student_id or class_id to list grades'
                ]);
                return;
            }

            // If teacher, enforce scope
            if (!$isAdmin) {
                // If filtering by class+subject, verify assignment; if only class given and subject also given, check pair
                if ($classId && $subjectId) {
                    $this->assertTeacherAssigned($currentUserId, $classId, $subjectId);
                }
            }

            // For admin users, if no filters provided, get all grades
            if ($isAdmin && !$studentId && !$classId) {
                $grades = $this->gradeModel->getAllGradesWithDetails($filters);
            } elseif ($studentId) {
                $grades = $this->gradeModel->getStudentGradesWithDetails($studentId, $filters);
            } else {
                // classId is guaranteed here for teachers, or provided for admins
                $grades = $this->gradeModel->getClassGradesWithDetails($classId, $filters);
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $grades,
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

    /** Show single grade (admin and teacher) */
    public function show($id) {
        try {
            global $pdo;
            RoleMiddleware::requireTeacher($pdo);

            $grade = $this->gradeModel->getGradeWithDetails($id);
            if (!$grade) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Grade not found']);
                return;
            }

            // If teacher, ensure they are assigned to this class/subject
            if (!$this->isCurrentUserAdmin()) {
                $this->assertTeacherAssigned($this->getCurrentUserId(), (int)$grade['class_id'], (int)$grade['subject_id']);
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $grade, 'message' => 'Grade retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving grade: ' . $e->getMessage()]);
        }
    }

    /** Create grade (admin and teacher) */
    public function store() {
        try {
            global $pdo;
            RoleMiddleware::requireTeacher($pdo);

            $data = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            $required = ['student_id', 'class_id', 'subject_id', 'grading_period_id', 'assignment_total', 'exam_total'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || $data[$field] === '') {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => "$field is required"]);
                    return;
                }
            }

            // Resolve grading policy by subject if not provided
            if (empty($data['grading_policy_id'])) {
                $policy = $this->policyModel->getBySubjectId($data['subject_id']);
                if (!$policy) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'No active grading policy for this subject']);
                    return;
                }
                $data['grading_policy_id'] = (int)$policy['id'];
            }

            // Teacher scope enforcement
            if (!$this->isCurrentUserAdmin()) {
                $this->assertTeacherAssigned($this->getCurrentUserId(), (int)$data['class_id'], (int)$data['subject_id']);
            }

            $payload = [
                'student_id' => (int)$data['student_id'],
                'class_id' => (int)$data['class_id'],
                'subject_id' => (int)$data['subject_id'],
                'grading_period_id' => (int)$data['grading_period_id'],
                'grading_policy_id' => (int)$data['grading_policy_id'],
                'assignment_total' => (float)$data['assignment_total'],
                'exam_total' => (float)$data['exam_total'],
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $this->getCurrentUserId()
            ];

            $id = $this->gradeModel->createGradeWithCalculation($payload);

            $this->logAction('student_grade_created', 'Created student grade', [ 'grade_id' => $id ]);

            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Grade created successfully', 'data' => ['id' => $id]]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error creating grade: ' . $e->getMessage()]);
        }
    }

    /** Update grade (admin and teacher) */
    public function update($id) {
        try {
            global $pdo;
            RoleMiddleware::requireTeacher($pdo);

            $data = json_decode(file_get_contents('php://input'), true);

            $existing = $this->gradeModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Grade not found']);
                return;
            }

            // Teacher scope enforcement on existing grade
            if (!$this->isCurrentUserAdmin()) {
                $this->assertTeacherAssigned($this->getCurrentUserId(), (int)$existing['class_id'], (int)$existing['subject_id']);
            }

            // Resolve grading policy by subject if not provided
            if (empty($data['grading_policy_id'])) {
                $policy = $this->policyModel->getBySubjectId($existing['subject_id']);
                if (!$policy) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'No active grading policy for this subject']);
                    return;
                }
                $data['grading_policy_id'] = (int)$policy['id'];
            }

            $payload = [
                'grading_policy_id' => (int)$data['grading_policy_id'],
                'assignment_total' => isset($data['assignment_total']) ? (float)$data['assignment_total'] : (float)$existing['assignment_total'],
                'exam_total' => isset($data['exam_total']) ? (float)$data['exam_total'] : (float)$existing['exam_total'],
                'remarks' => $data['remarks'] ?? $existing['remarks'],
                'updated_by' => $this->getCurrentUserId()
            ];

            $this->gradeModel->updateGradeWithCalculation($id, $payload);

            $this->logAction('student_grade_updated', 'Updated student grade', [ 'grade_id' => $id ]);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Grade updated successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error updating grade: ' . $e->getMessage()]);
        }
    }

    /** Delete grade (admin only) */
    public function destroy($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $existing = $this->gradeModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Grade not found']);
                return;
            }

            $this->gradeModel->delete($id);
            $this->logAction('student_grade_deleted', 'Deleted student grade', [ 'grade_id' => $id ]);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Grade deleted successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error deleting grade: ' . $e->getMessage()]);
        }
    }

    private function assertTeacherAssigned($currentUserId, $classId, $subjectId) {
        // If user is admin, skip
        if ($this->isCurrentUserAdmin()) { return true; }

        $teacher = $this->teacherModel->findByUserId($currentUserId);
        if (!$teacher) { throw new Exception('Teacher profile not found'); }

        $assignment = $this->teacherAssignmentModel->findByUniqueKey((int)$teacher['id'], (int)$classId, (int)$subjectId);
        if (!$assignment) {
            throw new Exception('Access denied: You are not assigned to this class and subject');
        }
        return true;
    }

    private function logAction($action, $description = null, $metadata = null) {
        try {
            $logModel = new UserLogModel($this->pdo);
            $logModel->logAction($this->getCurrentUserId(), $action, $description, $metadata);
        } catch (Exception $e) {
            // ignore logging failures
        }
    }

    private function getCurrentUserId() {
        try {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
                $parts = explode('.', $token);
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                return $payload['user_id'] ?? null;
            }
        } catch (Exception $e) {
            return null;
        }
        return null;
    }

    private function isCurrentUserAdmin() {
        try {
            // RoleMiddleware stores $currentUserRole globally on success
            global $currentUserRole;
            if (!empty($currentUserRole) && isset($currentUserRole['name'])) {
                return $currentUserRole['name'] === 'admin';
            }
        } catch (Exception $e) {
            // ignore
        }
        return false;
    }

    /**
     * Print class grade report (admin and teacher)
     * Generates HTML report for all students in a class for selected subjects
     */
    public function printClassReport() {
        try {
            global $pdo;
            RoleMiddleware::requireTeacher($pdo);

            $query = $_GET ?? [];
            $classId = isset($query['class_id']) ? (int)$query['class_id'] : null;
            $subjectIds = isset($query['subject_ids']) ? explode(',', $query['subject_ids']) : [];
            $periodId = isset($query['grading_period_id']) ? (int)$query['grading_period_id'] : null;

            if (!$classId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class ID is required'
                ]);
                return;
            }

            // Get class information
            $classModel = new ClassModel($pdo);
            $class = $classModel->findById($classId);
            if (!$class) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class not found'
                ]);
                return;
            }

            // Get students in the class
            $studentModel = new StudentModel($pdo);
            $students = $studentModel->getStudentsByClass($classId);

            // Get grades for the class
            $grades = $this->gradeModel->getClassGradesWithDetails($classId, [
                'subject_id' => $subjectIds,
                'grading_period_id' => $periodId
            ]);

            // Get subject teacher or class teacher
            $teacherName = 'Not Assigned';
            if (!empty($subjectIds)) {
                $teacherAssignment = $this->teacherAssignmentModel->findByUniqueKey(null, $classId, $subjectIds[0]);
                if ($teacherAssignment) {
                    $teacher = $this->teacherModel->findById($teacherAssignment['teacher_id']);
                    if ($teacher) {
                        $teacherName = $teacher['first_name'] . ' ' . $teacher['last_name'];
                    }
                }
            }

            // If no subject teacher, use default
            if ($teacherName === 'Not Assigned') {
                $teacherName = 'Class Teacher';
            }

            // Generate HTML report
            $html = $this->generateClassReportHTML($class, $students, $grades, $teacherName, $subjectIds, $periodId);

            // Set headers for HTML response
            header('Content-Type: text/html; charset=utf-8');
            header('Content-Disposition: inline; filename="class_grade_report.html"');
            
            echo $html;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error generating class report: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Print student grade report (admin and teacher)
     * Generates HTML report for a specific student across all subjects
     */
    public function printStudentReport() {
        try {
            global $pdo;
            // Allow both admin and teacher roles
            $currentUserId = $this->getCurrentUserId();
            $isAdmin = $this->isCurrentUserAdmin();
            
            if (!$isAdmin) {
                RoleMiddleware::requireTeacher($pdo);
            }

            $query = $_GET ?? [];
            $studentId = isset($query['student_id']) ? (int)$query['student_id'] : null;
            $classId = isset($query['class_id']) ? (int)$query['class_id'] : null;
            $periodId = isset($query['grading_period_id']) ? (int)$query['grading_period_id'] : null;

            if (!$studentId || !$classId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Both Student ID and Class ID are required'
                ]);
                return;
            }

            // Get student information
            $studentModel = new StudentModel($pdo);
            $student = $studentModel->findById($studentId);
            if (!$student) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student not found'
                ]);
                return;
            }

            // Get class information
            $classModel = new ClassModel($pdo);
            $class = $classModel->findById($classId);
            if (!$class) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class not found'
                ]);
                return;
            }

            // Get grades for the student in this class
            $grades = $this->gradeModel->getStudentGradesWithDetails($studentId, [
                'class_id' => $classId,
                'grading_period_id' => $periodId
            ]);

            // Get all subjects assigned to this class
            $classSubjectModel = new ClassSubjectModel($pdo);
            $classSubjects = $classSubjectModel->getByClassId($classId);
            if (!is_array($classSubjects)) {
                $classSubjects = [];
            }

            // Generate HTML report
            $html = $this->generateStudentReportHTML($student, $class, $grades, $classSubjects, $periodId);

            // Set headers for HTML response
            header('Content-Type: text/html; charset=utf-8');
            header('Content-Disposition: inline; filename="student_grade_report.html"');
            
            echo $html;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error generating student report: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Generate HTML for class grade report
     */
    private function generateClassReportHTML($class, $students, $grades, $teacherName, $subjectIds, $periodId) {
        // Read the PHP template
        $templatePath = __DIR__ . '/../email/templates/class_grade_report.php';
        if (!file_exists($templatePath)) {
            throw new Exception('Class grade report template not found');
        }

        // Get subject name and academic year
        $subjectName = 'All Subjects';
        $academicYear = 'N/A';
        
        if (!empty($subjectIds)) {
            $subjectModel = new SubjectModel($this->pdo);
            $subject = $subjectModel->findById($subjectIds[0]);
            if ($subject) {
                $subjectName = $subject['name'];
            }
        }
        
        // Get academic year from grading period if specified, otherwise from class
        if ($periodId) {
            $periodModel = new GradingPeriodModel($this->pdo);
            $period = $periodModel->findById($periodId);
            if ($period && isset($period['academic_year_id'])) {
                $academicYearModel = new AcademicYearModel($this->pdo);
                $academicYearData = $academicYearModel->findById($period['academic_year_id']);
                if ($academicYearData) {
                    $academicYear = $academicYearData['year_code'];
                }
            }
        } else {
            // If no specific period, get academic year from class
            if (isset($class['academic_year_id'])) {
                $academicYearModel = new AcademicYearModel($this->pdo);
                $academicYearData = $academicYearModel->findById($class['academic_year_id']);
                if ($academicYearData) {
                    $academicYear = $academicYearData['year_code'];
                }
            }
        }
        
        // Get school settings
        $schoolSettings = $this->getSchoolSettings();
        
        // Prepare data for the template
        $templateData = [
            'class' => $class,
            'students' => $students,
            'grades' => $grades,
            'teacherName' => $teacherName,
            'subjectIds' => $subjectIds,
            'periodId' => $periodId,
            'subjectName' => $subjectName,
            'academicYear' => $academicYear,
            'gradingPeriodName' => $this->getGradingPeriodName($periodId),
            'generatedDate' => date('F j, Y'),
            'generatedTime' => date('g:i A'),
            'totalStudents' => count($students),
            'schoolSettings' => $schoolSettings
        ];

        // Start output buffering to capture the template output
        ob_start();
        extract($templateData);
        include $templatePath;
        $html = ob_get_clean();

        return $html;
    }

    /**
     * Generate HTML for student grade report
     */
    private function generateStudentReportHTML($student, $class, $grades, $classSubjects, $periodId) {
        // Read the PHP template
        $templatePath = __DIR__ . '/../email/templates/student_grade_report.php';
        if (!file_exists($templatePath)) {
            throw new Exception('Student grade report template not found');
        }

        // Get academic year from grading period if specified, otherwise from student's class
        $academicYear = 'N/A';
        if ($periodId) {
            $periodModel = new GradingPeriodModel($this->pdo);
            $period = $periodModel->findById($periodId);
            if ($period && isset($period['academic_year_id'])) {
                $academicYearModel = new AcademicYearModel($this->pdo);
                $academicYearData = $academicYearModel->findById($period['academic_year_id']);
                if ($academicYearData) {
                    $academicYear = $academicYearData['year_code'];
                }
            }
        } else {
            // If no specific period, get academic year from class
            if (isset($class['academic_year_id'])) {
                $academicYearModel = new AcademicYearModel($this->pdo);
                $academicYearData = $academicYearModel->findById($class['academic_year_id']);
                if ($academicYearData) {
                    $academicYear = $academicYearData['year_code'];
                }
            }
        }
        
        // Get school settings
        $schoolSettings = $this->getSchoolSettings();
        
        // Prepare data for the template
        $templateData = [
            'student' => $student,
            'class' => $class,
            'grades' => $grades,
            'classSubjects' => $classSubjects,
            'periodId' => $periodId,
            'academicYear' => $academicYear,
            'gradingPeriodName' => $this->getGradingPeriodName($periodId),
            'generatedDate' => date('F j, Y'),
            'generatedTime' => date('g:i A'),
            'schoolSettings' => $schoolSettings
        ];

        // Start output buffering to capture the template output
        ob_start();
        extract($templateData);
        include $templatePath;
        $html = ob_get_clean();

        return $html;
    }

    /**
     * Get grading period name by ID
     */
    private function getGradingPeriodName($periodId) {
        if (!$periodId) return 'All Periods';
        
        try {
            $periodModel = new GradingPeriodModel($this->pdo);
            $period = $periodModel->findById($periodId);
            return $period['name'] ?? 'Unknown Period';
        } catch (Exception $e) {
            return 'Unknown Period';
        }
    }

    /**
     * Get school settings for report generation
     */
    private function getSchoolSettings() {
        try {
            // Load config for URLs
            $config = require __DIR__ . '/../config/app_config.php';
            
            // Try to get settings from database first
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
            
            // Return settings with fallbacks
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


}
?>


