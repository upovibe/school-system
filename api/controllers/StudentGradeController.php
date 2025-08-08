<?php
// api/controllers/StudentGradeController.php - Controller for managing student grades

require_once __DIR__ . '/../models/StudentGradeModel.php';
require_once __DIR__ . '/../models/GradingPolicyModel.php';
require_once __DIR__ . '/../models/TeacherModel.php';
require_once __DIR__ . '/../models/TeacherAssignmentModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
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
     * - Admin: can list by student_id or class_id + optional subject/period filters
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

            // Require at least student_id or class_id
            if (!$studentId && !$classId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Provide student_id or class_id to list grades'
                ]);
                return;
            }

            // If teacher, enforce scope
            $currentUserId = $this->getCurrentUserId();
            $isAdmin = $this->isCurrentUserAdmin();
            if (!$isAdmin) {
                // If filtering by class+subject, verify assignment; if only class given and subject also given, check pair
                if ($classId && $subjectId) {
                    $this->assertTeacherAssigned($currentUserId, $classId, $subjectId);
                }
            }

            if ($studentId) {
                $grades = $this->gradeModel->getStudentGradesWithDetails($studentId, $filters);
            } else {
                // classId is guaranteed here
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
}
?>


