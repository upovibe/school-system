<?php
// api/controllers/CashierController.php - Cashier-specific finance operations

require_once __DIR__ . '/../models/FeeSchedule.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class CashierController {
    private $pdo;
    private $feeScheduleModel;
    private $studentModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->feeScheduleModel = new FeeSchedule($pdo);
        $this->studentModel = new StudentModel($pdo);
    }

    /**
     * List fee schedules with optional filters (cashier only)
     * Filters: class_id, academic_year, term, student_type, is_active
     */
    public function indexSchedules() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $conditions = [];
            $params = [];

            if (isset($_GET['class_id']) && $_GET['class_id'] !== '') {
                $conditions[] = 'class_id = ?';
                $params[] = $_GET['class_id'];
            }
            if (isset($_GET['academic_year']) && $_GET['academic_year'] !== '') {
                $conditions[] = 'academic_year = ?';
                $params[] = $_GET['academic_year'];
            }
            if (isset($_GET['term']) && $_GET['term'] !== '') {
                $conditions[] = 'term = ?';
                $params[] = $_GET['term'];
            }
            if (isset($_GET['student_type']) && $_GET['student_type'] !== '') {
                $conditions[] = 'student_type = ?';
                $params[] = $_GET['student_type'];
            }
            if (isset($_GET['is_active']) && $_GET['is_active'] !== '') {
                $conditions[] = 'is_active = ?';
                $params[] = (int) (!!$_GET['is_active']);
            }

            $where = '';
            if (!empty($conditions)) {
                $where = 'WHERE ' . implode(' AND ', $conditions);
            }

            $sql = "SELECT * FROM fee_schedules $where ORDER BY academic_year DESC, term DESC, id DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $schedules,
                'message' => 'Fee schedules retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving fee schedules: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Show a fee schedule (cashier only)
     */
    public function showSchedule($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $schedule = $this->feeScheduleModel->findById($id);
            if (!$schedule) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Fee schedule not found'
                ]);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $schedule,
                'message' => 'Fee schedule retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving fee schedule: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get fee schedules for a specific student's class (cashier only)
     * Useful for cashiers to see what fees apply to a student
     */
    public function getStudentSchedules() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
            if ($studentId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'student_id is required'
                ]);
                return;
            }

            // Get student's current class
            $student = $this->studentModel->findById($studentId);
            if (!$student) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student not found'
                ]);
                return;
            }

            $classId = $student['current_class_id'] ?? null;
            if (!$classId) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student has no current class'
                ]);
                return;
            }

            // Get all fee schedules for the student's class
            $sql = "SELECT * FROM fee_schedules WHERE class_id = ? ORDER BY academic_year DESC, term DESC, id DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$classId]);
            $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Add student info to response
            $response = [
                'student' => [
                    'id' => $student['id'],
                    'first_name' => $student['first_name'],
                    'last_name' => $student['last_name'],
                    'student_id' => $student['student_id'],
                    'current_class_id' => $classId
                ],
                'schedules' => $schedules
            ];

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $response,
                'message' => 'Student fee schedules retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving student fee schedules: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active fee schedules (cashier only)
     * Returns only active schedules for current academic operations
     */
    public function getActiveSchedules() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $sql = "SELECT * FROM fee_schedules WHERE is_active = 1 ORDER BY academic_year DESC, term DESC, id DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $schedules,
                'message' => 'Active fee schedules retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active fee schedules: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search fee schedules by academic year and term (cashier only)
     * Useful for cashiers to find specific fee structures
     */
    public function searchSchedules() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $academicYear = isset($_GET['academic_year']) ? trim($_GET['academic_year']) : '';
            $term = isset($_GET['term']) ? trim($_GET['term']) : '';
            $classId = isset($_GET['class_id']) ? (int)$_GET['class_id'] : 0;

            if (empty($academicYear) && empty($term) && $classId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'At least one search parameter is required (academic_year, term, or class_id)'
                ]);
                return;
            }

            $conditions = [];
            $params = [];

            if (!empty($academicYear)) {
                $conditions[] = 'academic_year LIKE ?';
                $params[] = '%' . $academicYear . '%';
            }
            if (!empty($term)) {
                $conditions[] = 'term LIKE ?';
                $params[] = '%' . $term . '%';
            }
            if ($classId > 0) {
                $conditions[] = 'class_id = ?';
                $params[] = $classId;
            }

            $where = 'WHERE ' . implode(' AND ', $conditions);
            $sql = "SELECT * FROM fee_schedules $where ORDER BY academic_year DESC, term DESC, id DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $schedules,
                'message' => 'Fee schedules search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching fee schedules: ' . $e->getMessage()
            ]);
        }
    }

    // --- Helpers ---
    private function logAction($action, $description = null, $metadata = null) {
        try {
            // Try to resolve current user id from token if available
            $token = $this->getAuthToken();
            if ($token) {
                require_once __DIR__ . '/../models/UserSessionModel.php';
                $userSessionModel = new UserSessionModel($this->pdo);
                $session = $userSessionModel->findActiveSession($token);
                $userId = $session['user_id'] ?? null;
                UserLogModel::logAction($userId, $action, $description, $metadata);
            } else {
                UserLogModel::logAction(null, $action, $description, $metadata);
            }
        } catch (Exception $e) {
            error_log('CashierController logAction error: ' . $e->getMessage());
        }
    }

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
