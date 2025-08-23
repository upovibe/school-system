<?php
// api/controllers/CashierController.php - Cashier-specific finance operations

require_once __DIR__ . '/../models/FeeSchedule.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../models/FeeInvoice.php';
require_once __DIR__ . '/../models/FeePayment.php';
require_once __DIR__ . '/../models/FeeReceipt.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class CashierController {
    private $pdo;
    private $feeScheduleModel;
    private $studentModel;
    private $feeInvoiceModel;
    private $feePaymentModel;
    private $feeReceiptModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->feeScheduleModel = new FeeSchedule($pdo);
        $this->studentModel = new StudentModel($pdo);
        $this->feeInvoiceModel = new FeeInvoice($pdo);
        $this->feePaymentModel = new FeePayment($pdo);
        $this->feeReceiptModel = new FeeReceipt($pdo);
    }

    /**
     * List fee schedules with optional filters (cashier only)
     * Filters: class_id, academic_year, grading_period, student_type, is_active
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
            if (isset($_GET['grading_period']) && $_GET['grading_period'] !== '') {
                $conditions[] = 'grading_period = ?';
                $params[] = $_GET['grading_period'];
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

            $sql = "SELECT * FROM fee_schedules $where ORDER BY academic_year DESC, grading_period DESC, id DESC";
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
            $sql = "SELECT * FROM fee_schedules WHERE class_id = ? ORDER BY academic_year DESC, grading_period DESC, id DESC";
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

            $sql = "SELECT * FROM fee_schedules WHERE is_active = 1 ORDER BY academic_year DESC, grading_period DESC, id DESC";
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
     * Search fee schedules by academic year and grading period (cashier only)
     * Useful for cashiers to find specific fee structures
     */
    public function searchSchedules() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $academicYear = isset($_GET['academic_year']) ? trim($_GET['academic_year']) : '';
            $gradingPeriod = isset($_GET['grading_period']) ? trim($_GET['grading_period']) : '';
            $classId = isset($_GET['class_id']) ? (int)$_GET['class_id'] : 0;

            if (empty($academicYear) && empty($gradingPeriod) && $classId <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'At least one search parameter is required (academic_year, grading_period, or class_id)'
                ]);
                return;
            }

            $conditions = [];
            $params = [];

            if (!empty($academicYear)) {
                $conditions[] = 'academic_year LIKE ?';
                $params[] = '%' . $academicYear . '%';
            }
            if (!empty($gradingPeriod)) {
                $conditions[] = 'grading_period LIKE ?';
                $params[] = '%' . $gradingPeriod . '%';
            }
            if ($classId > 0) {
                $conditions[] = 'class_id = ?';
                $params[] = $classId;
            }

            $where = 'WHERE ' . implode(' AND ', $conditions);
            $sql = "SELECT * FROM fee_schedules $where ORDER BY academic_year DESC, grading_period DESC, id DESC";
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
     * Filters: student_id, academic_year, grading_period, status
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
            if (!empty($_GET['grading_period'])) {
                $conditions[] = 'grading_period = ?';
                $params[] = $_GET['grading_period'];
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

    // Payments (cashier)
    public function indexPayments() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $conditions = [];
            $params = [];
            if (!empty($_GET['invoice_id'])) { $conditions[] = 'invoice_id = ?'; $params[] = (int)$_GET['invoice_id']; }
            if (!empty($_GET['student_id'])) { $conditions[] = 'student_id = ?'; $params[] = (int)$_GET['student_id']; }
            if (!empty($_GET['method'])) { $conditions[] = 'method = ?'; $params[] = (string)$_GET['method']; }
            if (!empty($_GET['from'])) { $conditions[] = 'DATE(paid_on) >= ?'; $params[] = (string)$_GET['from']; }
            if (!empty($_GET['to'])) { $conditions[] = 'DATE(paid_on) <= ?'; $params[] = (string)$_GET['to']; }

            $where = empty($conditions) ? '' : ('WHERE ' . implode(' AND ', $conditions));
            $stmt = $this->pdo->prepare("SELECT * FROM fee_payments $where ORDER BY paid_on DESC, id DESC");
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $rows, 'message' => 'Payments retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving payments: ' . $e->getMessage()]);
        }
    }

    public function storePayment() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $invoiceId = isset($data['invoice_id']) ? (int)$data['invoice_id'] : 0;
            $amount = isset($data['amount']) ? (float)$data['amount'] : 0.0;
            if ($invoiceId <= 0) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'invoice_id is required']); return; }
            if ($amount <= 0) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'amount must be greater than 0']); return; }

            $invoice = $this->feeInvoiceModel->findById($invoiceId);
            if (!$invoice) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Invoice not found']); return; }

            // Prevent overpayment
            $currentPaid = (float)$invoice['amount_paid'];
            $currentDue = (float)$invoice['amount_due'];
            $currentBalance = $currentDue - $currentPaid;
            if ($amount > $currentBalance + 0.0001) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Payment exceeds invoice balance']);
                return;
            }

            $studentId = (int)$invoice['student_id'];
            // Normalize paid_on
            $incomingPaidOn = $data['paid_on'] ?? null;
            if ($incomingPaidOn) {
                if (strpos($incomingPaidOn, 'T') !== false) { $incomingPaidOn = str_replace('T', ' ', $incomingPaidOn); }
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $incomingPaidOn)) { $incomingPaidOn .= ' ' . date('H:i:s'); }
                elseif (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $incomingPaidOn)) { $incomingPaidOn .= ':00'; }
            } else { $incomingPaidOn = date('Y-m-d H:i:s'); }

            $payload = [
                'invoice_id' => $invoiceId,
                'student_id' => $studentId,
                'amount' => $amount,
                'method' => $data['method'] ?? null,
                'reference' => $data['reference'] ?? null,
                'paid_on' => $incomingPaidOn,
                'received_by' => $this->getCurrentUserIdFromToken(),
                'notes' => $data['notes'] ?? null,
            ];

            // Insert payment
            $paymentId = $this->feePaymentModel->create($payload);

            // Recompute invoice totals based on payments (exclude voided)
            $sumStmt = $this->pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE invoice_id = ? AND (status IS NULL OR status <> 'voided')");
            $sumStmt->execute([$invoiceId]);
            $sumPaid = (float)$sumStmt->fetchColumn();

            $newBalance = (float)$invoice['amount_due'] - $sumPaid;
            if ($newBalance < 0) { $newBalance = 0.0; }
            $newStatus = $newBalance <= 0 ? 'paid' : 'open';
            $this->feeInvoiceModel->update($invoiceId, [ 'amount_paid' => $sumPaid, 'balance' => $newBalance, 'status' => $newStatus ]);

            // Create receipt
            $receiptNumber = $this->generateReceiptNumber();
            $this->feeReceiptModel->create([
                'payment_id' => $paymentId,
                'receipt_number' => $receiptNumber,
                'printed_on' => date('Y-m-d H:i:s')
            ]);

            $this->logAction('cashier_payment_created', 'Payment recorded', [ 'fee_payment_id' => $paymentId, 'invoice_id' => $invoiceId, 'amount' => $amount ]);

            http_response_code(201);
            echo json_encode(['success' => true, 'data' => ['id' => $paymentId, 'receipt_number' => $receiptNumber], 'message' => 'Payment recorded successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error recording payment: ' . $e->getMessage()]);
        }
    }

    public function showPayment($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);
            $stmt = $this->pdo->prepare('SELECT * FROM fee_payments WHERE id = ? LIMIT 1');
            $stmt->execute([(int)$id]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            if (!$payment) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Payment not found']); return; }
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $payment, 'message' => 'Payment retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving payment: ' . $e->getMessage()]);
        }
    }

    public function destroyPayment($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $stmt = $this->pdo->prepare('SELECT * FROM fee_payments WHERE id = ? LIMIT 1');
            $stmt->execute([(int)$id]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            if (!$existing) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Payment not found']); return; }

            $invoiceId = (int)$existing['invoice_id'];
            $ok = $this->feePaymentModel->delete($id);
            if ($ok) {
                // Recompute invoice totals
                $sumStmt = $this->pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE invoice_id = ? AND (status IS NULL OR status <> 'voided')");
                $sumStmt->execute([$invoiceId]);
                $sumPaid = (float)$sumStmt->fetchColumn();
                $inv = $this->feeInvoiceModel->findById($invoiceId);
                if ($inv) {
                    $newBalance = (float)$inv['amount_due'] - $sumPaid;
                    if ($newBalance < 0) { $newBalance = 0.0; }
                    $newStatus = $newBalance <= 0 ? 'paid' : 'open';
                    $this->feeInvoiceModel->update($invoiceId, [ 'amount_paid' => $sumPaid, 'balance' => $newBalance, 'status' => $newStatus ]);
                }
                $this->logAction('cashier_payment_deleted', 'Payment deleted', [ 'fee_payment_id' => (int)$id, 'invoice_id' => $invoiceId ]);
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Payment deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to delete payment']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error deleting payment: ' . $e->getMessage()]);
        }
    }

    public function voidPayment($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $stmt = $this->pdo->prepare('SELECT * FROM fee_payments WHERE id = ? LIMIT 1');
            $stmt->execute([(int)$id]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            if (!$existing) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Payment not found']); return; }

            if (isset($existing['status']) && $existing['status'] === 'voided') {
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Payment already voided']);
                return;
            }

            $payload = json_decode(file_get_contents('php://input'), true) ?? [];
            $reason = isset($payload['reason']) ? trim((string)$payload['reason']) : '';
            if ($reason === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Reason for voiding is required']);
                return;
            }

            $ok = $this->feePaymentModel->update($id, [
                'status' => 'voided',
                'voided_at' => date('Y-m-d H:i:s'),
                'voided_by' => $this->getCurrentUserIdFromToken(),
                'void_reason' => $reason,
            ]);
            if (!$ok) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to void payment']);
                return;
            }

            $invoiceId = (int)$existing['invoice_id'];
            // Recompute invoice totals excluding voided payments
            $sumStmt = $this->pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE invoice_id = ? AND (status IS NULL OR status <> 'voided')");
            $sumStmt->execute([$invoiceId]);
            $sumPaid = (float)$sumStmt->fetchColumn();
            $inv = $this->feeInvoiceModel->findById($invoiceId);
            if ($inv) {
                $newBalance = (float)$inv['amount_due'] - $sumPaid;
                if ($newBalance < 0) { $newBalance = 0.0; }
                $newStatus = $newBalance <= 0 ? 'paid' : 'open';
                $this->feeInvoiceModel->update($invoiceId, [ 'amount_paid' => $sumPaid, 'balance' => $newBalance, 'status' => $newStatus ]);
            }

            $this->logAction('cashier_payment_voided', 'Payment voided', [ 'fee_payment_id' => (int)$id, 'invoice_id' => $invoiceId, 'reason' => $reason ]);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Payment voided successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error voiding payment: ' . $e->getMessage()]);
        }
    }

    // Receipts (cashier) - mirror finance with cashier role
    public function indexReceipts() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $sql = "
                SELECT 
                    r.id, r.receipt_number, r.printed_on, r.created_at,
                    p.id as payment_id, p.amount, p.method, p.reference, p.paid_on, p.status as payment_status,
                    i.invoice_number, i.amount_due, i.balance, i.grading_period, i.academic_year,
                    s.first_name, s.last_name,
                    u.name as voided_by_name
                FROM fee_receipts r
                LEFT JOIN fee_payments p ON r.payment_id = p.id
                LEFT JOIN fee_invoices i ON p.invoice_id = i.id
                LEFT JOIN students s ON p.student_id = s.id
                LEFT JOIN users u ON p.voided_by = u.id
                ORDER BY r.created_at DESC
            ";
            $stmt = $this->pdo->query($sql);
            $receipts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($receipts as &$receipt) {
                $receipt['student_display'] = trim(($receipt['first_name'] ?? '') . ' ' . ($receipt['last_name'] ?? ''));
                $receipt['voided_by_display'] = $receipt['voided_by_name'] ?: 'Unknown';
                $receipt['is_voided'] = ($receipt['payment_status'] ?? '') === 'voided';
            }
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $receipts]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error fetching receipts: ' . $e->getMessage()]);
        }
    }

    public function showReceipt($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);
            $sql = "
                SELECT 
                    r.id, r.receipt_number, r.printed_on, r.created_at,
                    p.id as payment_id, p.amount, p.method, p.reference, p.paid_on, p.status as payment_status, p.notes,
                    p.voided_at, p.void_reason,
                    i.id as invoice_id, i.invoice_number, i.amount_due, i.balance, i.grading_period, i.academic_year, i.due_date,
                    s.id as student_id, s.first_name, s.last_name, s.student_id as student_number,
                    u.name as voided_by_name, u.first_name as voided_by_first, u.last_name as voided_by_last
                FROM fee_receipts r
                LEFT JOIN fee_payments p ON r.payment_id = p.id
                LEFT JOIN fee_invoices i ON p.invoice_id = i.id
                LEFT JOIN students s ON p.student_id = s.id
                LEFT JOIN users u ON p.voided_by = u.id
                WHERE r.id = ?
                LIMIT 1
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([(int)$id]);
            $receipt = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$receipt) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Receipt not found']); return; }
            $receipt['student_display'] = trim(($receipt['first_name'] ?? '') . ' ' . ($receipt['last_name'] ?? ''));
            $receipt['voided_by_display'] = $receipt['voided_by_name'] ?: 'Unknown';
            $receipt['is_voided'] = ($receipt['payment_status'] ?? '') === 'voided';
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $receipt]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error fetching receipt: ' . $e->getMessage()]);
        }
    }

    public function printReceipt($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            // Get receipt data
            $sql = "
                SELECT 
                    r.id, r.receipt_number, r.printed_on, r.created_at,
                    p.id as payment_id, p.amount, p.method, p.reference, p.paid_on, p.status as payment_status, p.notes,
                    p.voided_at, p.void_reason,
                    i.id as invoice_id, i.invoice_number, i.amount_due, i.balance, i.grading_period, i.academic_year, i.due_date,
                    s.id as student_id, s.first_name, s.last_name, s.student_id as student_number,
                    u.name as voided_by_name
                FROM fee_receipts r
                LEFT JOIN fee_payments p ON r.payment_id = p.id
                LEFT JOIN fee_invoices i ON p.invoice_id = i.id
                LEFT JOIN students s ON p.student_id = s.id
                LEFT JOIN users u ON p.voided_by = u.id
                WHERE r.id = ?
                LIMIT 1
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([(int)$id]);
            $receipt = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$receipt) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Receipt not found']);
                return;
            }

            // Update printed_on timestamp
            $this->feeReceiptModel->update($id, ['printed_on' => date('Y-m-d H:i:s')]);

            // Render HTML
            $this->renderReceiptHTML($receipt);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error printing receipt: ' . $e->getMessage()]);
        }
    }



    private function getSchoolSettings() {
        try {
            $stmt = $this->pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE category IN ('general', 'contact') AND is_active = 1");
            $stmt->execute();
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $result = [];
            foreach ($settings as $setting) {
                $result[$setting['setting_key']] = $setting['setting_value'];
            }
            return $result;
        } catch (Exception $e) {
            return [
                'application_name' => 'School System',
                'application_logo' => '',
                'application_tagline' => '',
                'contact_address' => '',
                'contact_phone' => '',
                'contact_email' => '',
                'contact_website' => ''
            ];
        }
    }

    private function renderReceiptHTML($receipt) {
        $isVoided = ($receipt['payment_status'] ?? '') === 'voided';
        $studentName = trim(($receipt['first_name'] ?? '') . ' ' . ($receipt['last_name'] ?? ''));
        $schoolSettings = $this->getSchoolSettings();
        
        header('Content-Type: text/html; charset=utf-8');
        
        // Include the PHP template directly - variables are already in scope
        include __DIR__ . '/../email/templates/receipt.php';
    }
    public function regenerateReceipt($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);
            $existing = $this->feeReceiptModel->findById($id);
            if (!$existing) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Receipt not found']); return; }
            $newReceiptNumber = $this->generateReceiptNumber();
            $this->feeReceiptModel->update($id, [ 'receipt_number' => $newReceiptNumber, 'printed_on' => null ]);
            $updated = $this->feeReceiptModel->findById($id);
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Receipt regenerated successfully', 'data' => $updated]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error regenerating receipt: ' . $e->getMessage()]);
        }
    }

    // Helpers (payments/receipts)
    private function generateReceiptNumber() {
        $prefix = 'RCT-' . date('Ymd') . '-';
        $sql = "SELECT receipt_number FROM fee_receipts WHERE receipt_number LIKE ? ORDER BY receipt_number DESC LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$prefix . '%']);
        $last = $stmt->fetch(PDO::FETCH_ASSOC);
        $nextSeq = $last ? ((int)substr($last['receipt_number'], -4)) + 1 : 1;
        return $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Create a fee invoice (cashier only)
     * Required: student_id, academic_year, grading_period, amount_due
     * Optional: invoice_number (auto-generated if missing), issue_date, due_date, notes
     */
    public function storeInvoice() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Required fields
            $required = ['student_id', 'academic_year', 'grading_period', 'amount_due'];
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
                $derived = $this->deriveAmountDueFromSchedule((int)$data['student_id'], (string)$data['academic_year'], (string)$data['grading_period']);
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
                $schedule = $this->findScheduleByComposite($classId, (string)$data['academic_year'], (string)$data['grading_period'], $data['student_type'] ?? null);
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
            $gradingPeriod = $data['grading_period'] ?? $existing['grading_period'];
            if (!isset($data['amount_due']) || (float)$data['amount_due'] <= 0) {
                $derived = $this->deriveAmountDueFromSchedule($studentId, (string)$year, (string)$gradingPeriod);
                if ($derived !== null) {
                    $data['amount_due'] = $derived;
                }
            }
            $classIdStmt = $this->pdo->prepare('SELECT current_class_id FROM students WHERE id = ? LIMIT 1');
            $classIdStmt->execute([$studentId]);
            $classId = $classIdStmt->fetchColumn();
            if ($classId) {
                $schedule = $this->findScheduleByComposite($classId, (string)$year, (string)$gradingPeriod, $data['student_type'] ?? ($existing['student_type'] ?? null));
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
    private function deriveAmountDueFromSchedule(int $studentId, string $academicYear, string $gradingPeriod): ?float {
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
            $schedule = $this->findScheduleByComposite($classId, $academicYear, $gradingPeriod, $studentType);
            
            return $schedule ? (float)($schedule['total_fee'] ?? 0) : null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Find schedule by composite key
     */
    private function findScheduleByComposite($classId, $academicYear, $gradingPeriod, $studentType = null) {
        $sql = "SELECT * FROM fee_schedules WHERE class_id = ? AND academic_year = ? AND grading_period = ?";
        $params = [$classId, $academicYear, $gradingPeriod];
        
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

    /**
     * Show a single student basic info (cashier only)
     */
    public function showStudent($id) {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            $student = $this->studentModel->findById($id);
            if (!$student) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Student not found'
                ]);
                return;
            }

            // Limit to fields needed by cashier
            $studentBasic = [
                'id' => (int)$student['id'],
                'first_name' => $student['first_name'] ?? null,
                'last_name' => $student['last_name'] ?? null,
                'name' => trim(($student['first_name'] ?? '') . ' ' . ($student['last_name'] ?? '')),
                'student_id' => $student['student_id'] ?? null,
                'current_class_id' => $student['current_class_id'] ?? null,
                'student_type' => $student['student_type'] ?? null,
            ];

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $studentBasic,
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
