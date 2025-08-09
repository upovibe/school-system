<?php
// api/controllers/FinanceController.php - Finance-related endpoints (schedules first)

require_once __DIR__ . '/../models/FeeSchedule.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/FeeInvoice.php';
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class FinanceController {
    private $pdo;
    private $feeScheduleModel;
    private $feeInvoiceModel;
    private $studentModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->feeScheduleModel = new FeeSchedule($pdo);
        $this->feeInvoiceModel = new FeeInvoice($pdo);
        $this->studentModel = new StudentModel($pdo);
    }

    /**
     * List fee schedules with optional filters (admin only)
     * Filters: class_id, academic_year, term, is_active
     */
    public function indexSchedules() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
     * Create a fee schedule (admin only)
     * Required: class_id, academic_year, term, total_fee
     */
    public function storeSchedule() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Validate required fields
            $required = ['class_id', 'academic_year', 'term', 'total_fee'];
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

            // Enforce uniqueness: class_id + academic_year + term
            $existing = $this->findScheduleByComposite($data['class_id'], $data['academic_year'], $data['term']);
            if ($existing) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'A schedule already exists for this class, academic year and term'
                ]);
                return;
            }

            // Defaults
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }

            $scheduleId = $this->feeScheduleModel->create($data);

            $this->logAction('finance_schedule_created', 'Created fee schedule', [
                'fee_schedule_id' => $scheduleId,
                'payload' => $data
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => ['id' => $scheduleId],
                'message' => 'Fee schedule created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating fee schedule: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Show a fee schedule (admin only)
     */
    public function showSchedule($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
     * Update a fee schedule (admin only)
     */
    public function updateSchedule($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $existing = $this->feeScheduleModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Fee schedule not found'
                ]);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // If composite keys are changing, enforce uniqueness
            $newClassId = $data['class_id'] ?? $existing['class_id'];
            $newYear = $data['academic_year'] ?? $existing['academic_year'];
            $newTerm = $data['term'] ?? $existing['term'];
            $dup = $this->findScheduleByComposite($newClassId, $newYear, $newTerm);
            if ($dup && (int)$dup['id'] !== (int)$id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Another schedule already exists for this class, academic year and term'
                ]);
                return;
            }

            $ok = $this->feeScheduleModel->update($id, $data);
            if ($ok) {
                $this->logAction('finance_schedule_updated', 'Updated fee schedule', [
                    'fee_schedule_id' => $id,
                    'payload' => $data
                ]);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Fee schedule updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update fee schedule'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating fee schedule: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a fee schedule (admin only)
     */
    public function destroySchedule($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $existing = $this->feeScheduleModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Fee schedule not found'
                ]);
                return;
            }

            $ok = $this->feeScheduleModel->delete($id);
            if ($ok) {
                $this->logAction('finance_schedule_deleted', 'Deleted fee schedule', [
                    'fee_schedule_id' => $id,
                    'record' => $existing
                ]);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Fee schedule deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete fee schedule'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting fee schedule: ' . $e->getMessage()
            ]);
        }
    }

    // --- Helpers ---
    private function findScheduleByComposite($classId, $academicYear, $term) {
        $sql = 'SELECT * FROM fee_schedules WHERE class_id = ? AND academic_year = ? AND term = ? LIMIT 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$classId, $academicYear, $term]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

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
            error_log('FinanceController logAction error: ' . $e->getMessage());
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

// Invoices Section
    /**
     * List fee invoices with optional filters (admin only)
     * Filters: student_id, academic_year, term, status
     */
    public function indexInvoices() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
     * Create a fee invoice (admin only)
     * Required: student_id, academic_year, term, amount_due
     * Optional: invoice_number (auto-generated if missing), issue_date, due_date, notes
     */
    public function storeInvoice() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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

            // If amount_due is empty or 0, try deriving from schedule based on student's current class
            if (empty($data['amount_due']) || (float)$data['amount_due'] <= 0) {
                $derived = $this->deriveAmountDueFromSchedule((int)$data['student_id'], (string)$data['academic_year'], (string)$data['term']);
                if ($derived !== null) {
                    $data['amount_due'] = $derived;
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

            $this->logAction('finance_invoice_created', 'Created invoice', [ 'fee_invoice_id' => $id, 'payload' => $data ]);

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
     * Show fee invoice (admin only)
     */
    public function showInvoice($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
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
     * Update fee invoice (admin only)
     * Recomputes balance and status as needed
     */
    public function updateInvoice($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
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

            // If amount_due not supplied or zero, attempt derive based on student current class & schedule
            $studentId = isset($data['student_id']) ? (int)$data['student_id'] : (int)$existing['student_id'];
            $year = $data['academic_year'] ?? $existing['academic_year'];
            $term = $data['term'] ?? $existing['term'];
            if (!isset($data['amount_due']) || (float)$data['amount_due'] <= 0) {
                $derived = $this->deriveAmountDueFromSchedule($studentId, (string)$year, (string)$term);
                if ($derived !== null) {
                    $data['amount_due'] = $derived;
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
                $this->logAction('finance_invoice_updated', 'Updated invoice', ['fee_invoice_id' => $id, 'payload' => $data]);
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
     * Delete fee invoice (admin only)
     */
    public function destroyInvoice($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            $existing = $this->feeInvoiceModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Invoice not found']);
                return;
            }
            $ok = $this->feeInvoiceModel->delete($id);
            if ($ok) {
                $this->logAction('finance_invoice_deleted', 'Deleted invoice', ['fee_invoice_id' => $id, 'record' => $existing]);
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

    // Helpers (invoices)
    private function generateInvoiceNumber() {
        $prefix = 'INV-' . date('Ymd') . '-';
        $sql = "SELECT COUNT(*) FROM fee_invoices WHERE DATE(issue_date) = CURDATE()";
        $count = (int)$this->pdo->query($sql)->fetchColumn();
        $seq = str_pad((string)($count + 1), 4, '0', STR_PAD_LEFT);
        return $prefix . $seq;
    }

    private function findInvoiceByNumber($invoiceNumber) {
        $stmt = $this->pdo->prepare('SELECT * FROM fee_invoices WHERE invoice_number = ? LIMIT 1');
        $stmt->execute([$invoiceNumber]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    private function getCurrentUserIdFromToken() {
        try {
            $token = $this->getAuthToken();
            if (!$token) return null;
            require_once __DIR__ . '/../models/UserSessionModel.php';
            $userSessionModel = new UserSessionModel($this->pdo);
            $session = $userSessionModel->findActiveSession($token);
            return $session['user_id'] ?? null;
        } catch (Exception $e) {
            return null;
        }
    }

    private function deriveAmountDueFromSchedule(int $studentId, string $academicYear, string $term): ?float {
        try {
            // Find student's current class
            $stmt = $this->pdo->prepare('SELECT current_class_id FROM students WHERE id = ? LIMIT 1');
            $stmt->execute([$studentId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $classId = $row['current_class_id'] ?? null;
            if (!$classId) return null;

            // Normalize inputs and try multiple candidates for year/term
            $yearCandidates = [];
            $trimYear = trim($academicYear);
            $yearCandidates[] = $trimYear;
            if (preg_match('/(\d{4})$/', $trimYear, $m)) {
                $yearCandidates[] = $m[1];
            }
            $yearCandidates = array_values(array_unique($yearCandidates));

            $termCandidates = [];
            $termLower = strtolower(trim($term));
            $termCandidates[] = $termLower;
            // If numeric like '1', add 'term1'
            if (preg_match('/^\s*(\d+)\s*$/', $termLower, $tm)) {
                $termCandidates[] = 'term' . $tm[1];
            }
            // Also remove spaces variant
            $termCandidates[] = str_replace(' ', '', $termLower);
            $termCandidates = array_values(array_unique($termCandidates));

            foreach ($yearCandidates as $y) {
                foreach ($termCandidates as $t) {
                    $schedule = $this->findScheduleByComposite($classId, $y, $t);
                    if ($schedule && isset($schedule['total_fee'])) {
                        return (float)$schedule['total_fee'];
                    }
                }
            }

            // Fallback: choose the most recent schedule for the class if available
            $stmt2 = $this->pdo->prepare('SELECT * FROM fee_schedules WHERE class_id = ? ORDER BY academic_year DESC, term DESC, id DESC LIMIT 1');
            $stmt2->execute([$classId]);
            $fallback = $stmt2->fetch(PDO::FETCH_ASSOC);
            if ($fallback && isset($fallback['total_fee'])) {
                return (float)$fallback['total_fee'];
            }
            return null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Compute amount due for a student based on current class and schedules.
     * Params: student_id (required), academic_year (optional), term (optional)
     */
    public function getAmountDue() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
            $year = isset($_GET['academic_year']) ? (string)$_GET['academic_year'] : '';
            $term = isset($_GET['term']) ? (string)$_GET['term'] : '';
            if ($studentId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'student_id is required']);
                return;
            }

            // Resolve class_id
            $stmt = $this->pdo->prepare('SELECT current_class_id FROM students WHERE id = ? LIMIT 1');
            $stmt->execute([$studentId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $classId = $row['current_class_id'] ?? null;
            if (!$classId) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Student has no current class']);
                return;
            }

            // Build candidate years/terms similar to derive method
            $yearCandidates = [];
            $trimYear = trim($year);
            if ($trimYear !== '') {
                $yearCandidates[] = $trimYear;
                if (preg_match('/(\\d{4})$/', $trimYear, $m)) {
                    $yearCandidates[] = $m[1];
                }
            }

            $termCandidates = [];
            $termLower = strtolower(trim($term));
            if ($termLower !== '') {
                $termCandidates[] = $termLower;
                if (preg_match('/^\\s*(\\d+)\\s*$/', $termLower, $tm)) {
                    $termCandidates[] = 'term' . $tm[1];
                }
                $termCandidates[] = str_replace(' ', '', $termLower);
            }

            $chosen = null;
            if (!empty($yearCandidates) && !empty($termCandidates)) {
                foreach ($yearCandidates as $y) {
                    foreach ($termCandidates as $t) {
                        $s = $this->findScheduleByComposite($classId, $y, $t);
                        if ($s) { $chosen = $s; break 2; }
                    }
                }
            }

            if (!$chosen) {
                // Fallback pick most recent/active for the class
                $stmt2 = $this->pdo->prepare('SELECT * FROM fee_schedules WHERE class_id = ? ORDER BY is_active DESC, academic_year DESC, term DESC, id DESC LIMIT 1');
                $stmt2->execute([$classId]);
                $chosen = $stmt2->fetch(PDO::FETCH_ASSOC) ?: null;
            }

            if (!$chosen) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'No schedule found for class']);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'amount_due' => isset($chosen['total_fee']) ? (float)$chosen['total_fee'] : 0,
                    'schedule' => [
                        'class_id' => (int)$chosen['class_id'],
                        'academic_year' => $chosen['academic_year'] ?? null,
                        'term' => $chosen['term'] ?? null,
                        'total_fee' => $chosen['total_fee'] ?? null,
                        'is_active' => isset($chosen['is_active']) ? (int)$chosen['is_active'] : null,
                    ]
                ],
                'message' => 'Amount due computed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error computing amount due: ' . $e->getMessage()]);
        }
    }
}


