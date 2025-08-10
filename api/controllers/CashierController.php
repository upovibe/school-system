<?php
// api/controllers/CashierController.php - Cashier-specific finance operations

require_once __DIR__ . '/../models/FeeSchedule.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../models/FeeInvoice.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class CashierController {
    private $pdo;
    private $feeScheduleModel;
    private $studentModel;
    private $feeInvoiceModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->feeScheduleModel = new FeeSchedule($pdo);
        $this->studentModel = new StudentModel($pdo);
        $this->feeInvoiceModel = new FeeInvoice($pdo);
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

    /**
     * List fee invoices with optional filters (cashier only)
     * Filters: student_id, academic_year, term, status
     */
    public function indexInvoices() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $conditions = [];
            $params = [];

            if (isset($_GET['student_id']) && $_GET['student_id'] !== '') {
                $conditions[] = 'student_id = ?';
                $params[] = $_GET['student_id'];
            }
            if (!empty($_GET['academic_year'])) {
                $conditions[] = 'academic_year = ?';
                $params[] = $_GET['academic_year'];
            }
            if (!empty($_GET['term'])) {
                $conditions[] = 'term = ?';
                $params[] = $_GET['term'];
            }
            if (!empty($_GET['status'])) {
                $conditions[] = 'status = ?';
                $params[] = $_GET['status'];
            }

            $where = '';
            if (!empty($conditions)) {
                $where = 'WHERE ' . implode(' AND ', $conditions);
            }

            $sql = "SELECT * FROM fee_invoices $where ORDER BY issue_date DESC, id DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $invoices,
                'message' => 'Fee invoices retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving fee invoices: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a fee invoice (cashier only)
     * Required: student_id, academic_year, term, amount_due
     * Optional: invoice_number (auto-generated if missing), issue_date, due_date, notes
     */
    public function storeInvoice() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Required fields
            $required = ['student_id', 'academic_year', 'term', 'amount_due'];
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

            // Derive student_type and schedule_id; If amount_due is empty or 0, derive from schedule
            if (empty($data['amount_due']) || (float)$data['amount_due'] <= 0) {
                $derived = $this->deriveAmountDueFromSchedule((int)$data['student_id'], (string)$data['academic_year'], (string)$data['term']);
                if ($derived !== null) {
                    $data['amount_due'] = $derived;
                }
            }

            // Attach student_type and schedule_id if possible
            $studentRow = $this->studentModel->findById($data['student_id']);
            $studentType = $studentRow['student_type'] ?? null;
            if ($studentType) {
                $data['student_type'] = $studentType;
            }
            // Try to find matching schedule id using type if present
            $classIdStmt = $this->pdo->prepare('SELECT current_class_id FROM students WHERE id = ? LIMIT 1');
            $classIdStmt->execute([(int)$data['student_id']]);
            $classId = $classIdStmt->fetchColumn();
            if ($classId) {
                $schedule = $this->findScheduleByComposite($classId, (string)$data['academic_year'], (string)$data['term'], $data['student_type'] ?? null);
                if ($schedule) {
                    $data['schedule_id'] = $schedule['id'];
                    if (empty($data['amount_due']) || (float)$data['amount_due'] <= 0) {
                        $data['amount_due'] = (float)($schedule['total_fee'] ?? 0);
                    }
                    if (empty($data['student_type']) && !empty($schedule['student_type'])) {
                        $data['student_type'] = $schedule['student_type'];
                    }
                }
            }

            // Defaults
            if (empty($data['invoice_number'])) {
                $data['invoice_number'] = $this->generateInvoiceNumber();
            }
            if (empty($data['issue_date'])) {
                $data['issue_date'] = date('Y-m-d');
            }
            if (!isset($data['amount_paid'])) {
                $data['amount_paid'] = 0;
            }
            $data['balance'] = (float)$data['amount_due'] - (float)$data['amount_paid'];
            if (empty($data['status'])) {
                $data['status'] = $data['balance'] <= 0 ? 'paid' : 'open';
            }

            // created_by from session token if available
            $data['created_by'] = $this->getCurrentUserIdFromToken();

            // Create
            $id = $this->feeInvoiceModel->create($data);

            $this->logAction('cashier_invoice_created', 'Created invoice', [ 'fee_invoice_id' => $id, 'payload' => $data ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => ['id' => $id, 'invoice_number' => $data['invoice_number']],
                'message' => 'Fee invoice created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating fee invoice: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Show fee invoice (cashier only)
     */
    public function showInvoice($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);
            $inv = $this->feeInvoiceModel->findById($id);
            if (!$inv) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Invoice not found']);
                return;
            }
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $inv, 'message' => 'Invoice retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving invoice: ' . $e->getMessage()]);
        }
    }

    /**
     * Update fee invoice (cashier only)
     * Recomputes balance and status as needed
     */
    public function updateInvoice($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);
            $existing = $this->feeInvoiceModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Invoice not found']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Protect invoice_number uniqueness if being changed
            if (!empty($data['invoice_number']) && $data['invoice_number'] !== $existing['invoice_number']) {
                $dup = $this->findInvoiceByNumber($data['invoice_number']);
                if ($dup && (int)$dup['id'] !== (int)$id) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invoice number already exists']);
                    return;
                }
            }

            // Derive student_type/schedule_id and amount_due if omitted
            $studentId = isset($data['student_id']) ? (int)$data['student_id'] : (int)$existing['student_id'];
            $year = $data['academic_year'] ?? $existing['academic_year'];
            $term = $data['term'] ?? $existing['term'];
            if (!isset($data['amount_due']) || (float)$data['amount_due'] <= 0) {
                $derived = $this->deriveAmountDueFromSchedule($studentId, (string)$year, (string)$term);
                if ($derived !== null) {
                    $data['amount_due'] = $derived;
                }
            }
            $classIdStmt = $this->pdo->prepare('SELECT current_class_id FROM students WHERE id = ? LIMIT 1');
            $classIdStmt->execute([$studentId]);
            $classId = $classIdStmt->fetchColumn();
            if ($classId) {
                $schedule = $this->findScheduleByComposite($classId, (string)$year, (string)$term, $data['student_type'] ?? ($existing['student_type'] ?? null));
                if ($schedule) {
                    $data['schedule_id'] = $schedule['id'];
                    if (!isset($data['student_type']) && isset($existing['student_type'])) {
                        $data['student_type'] = $existing['student_type'];
                    } elseif (!isset($data['student_type']) && isset($schedule['student_type'])) {
                        $data['student_type'] = $schedule['student_type'];
                    }
                }
            }

            // Recompute amounts
            $amountDue = isset($data['amount_due']) ? (float)$data['amount_due'] : (float)$existing['amount_due'];
            $amountPaid = isset($data['amount_paid']) ? (float)$data['amount_paid'] : (float)$existing['amount_paid'];
            $data['balance'] = $amountDue - $amountPaid;

            // Auto status
            if (!isset($data['status'])) {
                $data['status'] = $data['balance'] <= 0 ? 'paid' : 'open';
            }

            $ok = $this->feeInvoiceModel->update($id, $data);
            if ($ok) {
                $this->logAction('cashier_invoice_updated', 'Updated invoice', ['fee_invoice_id' => $id, 'payload' => $data]);
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Fee invoice updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update fee invoice']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error updating fee invoice: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete fee invoice (cashier only)
     */
    public function destroyInvoice($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);
            $existing = $this->feeInvoiceModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Invoice not found']);
                return;
            }
            $ok = $this->feeInvoiceModel->delete($id);
            if ($ok) {
                $this->logAction('cashier_invoice_deleted', 'Deleted invoice', ['fee_invoice_id' => $id, 'record' => $existing]);
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Fee invoice deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to delete fee invoice']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error deleting fee invoice: ' . $e->getMessage()]);
        }
    }

    /**
     * Generate unique invoice number
     */
    private function generateInvoiceNumber() {
        $prefix = 'INV';
        $year = date('Y');
        $month = date('m');
        
        // Get count for this month
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM fee_invoices WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?");
        $stmt->execute([$year, $month]);
        $count = $stmt->fetchColumn();
        
        return sprintf('%s%s%s%04d', $prefix, $year, $month, $count + 1);
    }

    /**
     * Find invoice by number
     */
    private function findInvoiceByNumber($invoiceNumber) {
        $stmt = $this->pdo->prepare("SELECT * FROM fee_invoices WHERE invoice_number = ? LIMIT 1");
        $stmt->execute([$invoiceNumber]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Derive amount due from schedule
     */
    private function deriveAmountDueFromSchedule(int $studentId, string $academicYear, string $term): ?float {
        try {
            // Get student's current class
            $classStmt = $this->pdo->prepare("SELECT current_class_id FROM students WHERE id = ? LIMIT 1");
            $classStmt->execute([$studentId]);
            $classId = $classStmt->fetchColumn();
            
            if (!$classId) return null;
            
            // Get student type
            $studentStmt = $this->pdo->prepare("SELECT student_type FROM students WHERE id = ? LIMIT 1");
            $studentStmt->execute([$studentId]);
            $studentType = $studentStmt->fetchColumn();
            
            // Find matching schedule
            $schedule = $this->findScheduleByComposite($classId, $academicYear, $term, $studentType);
            
            return $schedule ? (float)($schedule['total_fee'] ?? 0) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Find schedule by composite key
     */
    private function findScheduleByComposite($classId, $academicYear, $term, $studentType = null) {
        $sql = "SELECT * FROM fee_schedules WHERE class_id = ? AND academic_year = ? AND term = ?";
        $params = [$classId, $academicYear, $term];
        
        if ($studentType) {
            $sql .= " AND student_type = ?";
            $params[] = $studentType;
        }
        
        $sql .= " LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get basic student information for cashiers (cashier only)
     * Returns limited student data needed for invoice management
     */
    public function getStudents() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $students = $this->studentModel->getStudentsBasicInfo();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $students,
                'message' => 'Students retrieved successfully for cashier'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving students: ' . $e->getMessage()
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

    private function getCurrentUserIdFromToken() {
        $token = $this->getAuthToken();
        if ($token) {
            require_once __DIR__ . '/../models/UserSessionModel.php';
            $userSessionModel = new UserSessionModel($this->pdo);
            $session = $userSessionModel->findActiveSession($token);
            return $session['user_id'] ?? null;
        }
        return null;
    }
}
?>
