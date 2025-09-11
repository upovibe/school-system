<?php
// api/controllers/CashierController.php - Cashier-specific finance operations

require_once __DIR__ . '/../models/FeeSchedule.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../models/FeeInvoice.php';
require_once __DIR__ . '/../models/FeePayment.php';
require_once __DIR__ . '/../models/FeeReceipt.php';
require_once __DIR__ . '/../models/SettingModel.php';
require_once __DIR__ . '/../models/AnnouncementModel.php';
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
            
            if ($amount <= 0) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'amount must be greater than 0']); return; }

            // Check if we have invoice_id or need to create invoice
            if ($invoiceId <= 0) {
                // Try to create invoice automatically if we have student details
                if (isset($data['student_id']) && isset($data['academic_year']) && isset($data['grading_period'])) {
                    $studentId = (int)$data['student_id'];
                    $academicYear = (string)$data['academic_year'];
                    $gradingPeriod = (string)$data['grading_period'];
                    
                    // Auto-create invoice for this student
                    $invoice = $this->autoCreateInvoiceForStudent($studentId, $academicYear, $gradingPeriod);
                    if (!$invoice) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => 'Could not create invoice for student. Please ensure student is enrolled in a class with fee schedule.']);
                        return;
                    }
                    $invoiceId = $invoice['id'];
                } else {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Either invoice_id OR (student_id + academic_year + grading_period) is required']);
                    return;
                }
            }

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
            
            // Get payment with receipt information
            $sql = "
                SELECT 
                    p.*,
                    r.id as receipt_id,
                    r.receipt_number
                FROM fee_payments p
                LEFT JOIN fee_receipts r ON p.id = r.payment_id
                WHERE p.id = ?
                LIMIT 1
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([(int)$id]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            
            if (!$payment) { 
                http_response_code(404); 
                echo json_encode(['success' => false, 'message' => 'Payment not found']); 
                return; 
            }
            
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



    /**
     * Get school settings for receipt generation
     */
    private function getSchoolSettings() {
        try {
            // Load config for URLs
            $config = require __DIR__ . '/../config/app_config.php';
            
            // Try to get settings from database first
            $settingModel = new SettingModel($this->pdo);
            $settings = $settingModel->getAllAsArray();
            
            // Construct full logo URL if logo exists
            // Use api_url since logo is an API resource
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
            // Find student's current class
            $stmt = $this->pdo->prepare('SELECT current_class_id FROM students WHERE id = ? LIMIT 1');
            $stmt->execute([$studentId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $classId = $row['current_class_id'] ?? null;
            if (!$classId) return null;

            // Resolve student's type if available to match typed schedules (e.g., Day/Boarding)
            $typeStmt = $this->pdo->prepare('SELECT student_type FROM students WHERE id = ? LIMIT 1');
            $typeStmt->execute([$studentId]);
            $studentType = $typeStmt->fetchColumn() ?: null;

            // Normalize inputs and try multiple candidates for year/term
            $yearCandidates = [];
            $trimYear = trim($academicYear);
            $yearCandidates[] = $trimYear;
            if (preg_match('/(\d{4})$/', $trimYear, $m)) {
                $yearCandidates[] = $m[1];
            }
            $yearCandidates = array_values(array_unique($yearCandidates));

            $gradingPeriodCandidates = [];
            $gradingPeriodLower = strtolower(trim($gradingPeriod));
            $gradingPeriodCandidates[] = $gradingPeriodLower;
            // If numeric like '1', add 'term1'
            if (preg_match('/^\s*(\d+)\s*$/', $gradingPeriodLower, $tm)) {
                $gradingPeriodCandidates[] = 'term' . $tm[1];
            }
            // Also remove spaces variant
            $gradingPeriodCandidates[] = str_replace(' ', '', $gradingPeriodLower);
            $gradingPeriodCandidates = array_values(array_unique($gradingPeriodCandidates));

            foreach ($yearCandidates as $y) {
                foreach ($gradingPeriodCandidates as $t) {
                    $schedule = $this->findScheduleByComposite($classId, $y, $t, $studentType);
                    if ($schedule && isset($schedule['total_fee'])) {
                        return (float)$schedule['total_fee'];
                    }
                }
            }

            // Fallback: choose the most recent schedule for the class matching the student's type (if known)
            if ($studentType) {
                $stmt2 = $this->pdo->prepare('SELECT * FROM fee_schedules WHERE class_id = ? AND student_type = ? ORDER BY academic_year DESC, grading_period DESC, id DESC LIMIT 1');
                $stmt2->execute([$classId, $studentType]);
            } else {
                $stmt2 = $this->pdo->prepare('SELECT * FROM fee_schedules WHERE class_id = ? ORDER BY academic_year DESC, grading_period DESC, id DESC LIMIT 1');
                $stmt2->execute([$classId]);
            }
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
     * Auto-create invoice for a student if none exists for the given period
     * Used by the enhanced payment system to create invoices on-demand
     */
    private function autoCreateInvoiceForStudent(int $studentId, string $academicYear, string $gradingPeriod) {
        try {
            // Get student details
            $student = $this->studentModel->findById($studentId);
            if (!$student) return null;

            // Get student's current class
            $classId = $student['current_class_id'] ?? null;
            if (!$classId) return null;

            // Check if invoice already exists for this student/period combination
            $existingInvoice = $this->findInvoiceByStudentAndPeriod($studentId, $academicYear, $gradingPeriod);
            if ($existingInvoice) return $existingInvoice;

            // Get amount due from fee schedule
            $amountDue = $this->deriveAmountDueFromSchedule($studentId, $academicYear, $gradingPeriod);
            if ($amountDue === null || $amountDue <= 0) return null;

            // Create invoice data
            $invoiceData = [
                'student_id' => $studentId,
                'academic_year' => $academicYear,
                'grading_period' => $gradingPeriod,
                'amount_due' => $amountDue,
                'amount_paid' => 0,
                'balance' => $amountDue,
                'status' => 'open',
                'issue_date' => date('Y-m-d'),
                'student_type' => $student['student_type'] ?? null,
                'created_by' => $this->getCurrentUserIdFromToken()
            ];

            // Generate invoice number
            $invoiceData['invoice_number'] = $this->generateInvoiceNumber();

            // Create the invoice
            $invoiceId = $this->feeInvoiceModel->create($invoiceData);
            if (!$invoiceId) return null;

            // Get the created invoice
            $createdInvoice = $this->feeInvoiceModel->findById($invoiceId);
            
            // Log the auto-creation
            $this->logAction('cashier_invoice_auto_created', 'Auto-created invoice for payment', [
                'fee_invoice_id' => $invoiceId,
                'student_id' => $studentId,
                'academic_year' => $academicYear,
                'grading_period' => $gradingPeriod,
                'amount_due' => $amountDue
            ]);

            return $createdInvoice;
        } catch (Exception $e) {
            error_log('Error auto-creating invoice: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Find existing invoice for student and period combination
     */
    private function findInvoiceByStudentAndPeriod(int $studentId, string $academicYear, string $gradingPeriod) {
        try {
            $sql = "SELECT * FROM fee_invoices WHERE student_id = ? AND academic_year = ? AND grading_period = ? LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$studentId, $academicYear, $gradingPeriod]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
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
            RoleMiddleware::requireCashier($pdo);

            $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
            $year = isset($_GET['academic_year']) ? (string)$_GET['academic_year'] : '';
            $gradingPeriod = isset($_GET['grading_period']) ? (string)$_GET['grading_period'] : '';
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

            $gradingPeriodCandidates = [];
            $gradingPeriodLower = strtolower(trim($gradingPeriod));
            if ($gradingPeriodLower !== '') {
                $gradingPeriodCandidates[] = $gradingPeriodLower;
                if (preg_match('/^\\s*(\\d+)\\s*$/', $gradingPeriodLower, $tm)) {
                    $gradingPeriodCandidates[] = 'term' . $tm[1];
                }
                $gradingPeriodCandidates[] = str_replace(' ', '', $gradingPeriodLower);
            }

            // Resolve student's type to match typed schedules; allow override via as_type
            $typeStmt = $this->pdo->prepare('SELECT student_type FROM students WHERE id = ? LIMIT 1');
            $typeStmt->execute([$studentId]);
            $studentType = $typeStmt->fetchColumn() ?: null;
            $overrideType = isset($_GET['as_type']) && $_GET['as_type'] !== '' ? (string)$_GET['as_type'] : null;
            if ($overrideType) { $studentType = $overrideType; }

            $chosen = null;
            if (!empty($yearCandidates) && !empty($gradingPeriodCandidates)) {
                foreach ($yearCandidates as $y) {
                    foreach ($gradingPeriodCandidates as $t) {
                        $s = $this->findScheduleByComposite($classId, $y, $t, $studentType);
                        if ($s) { $chosen = $s; break 2; }
                    }
                }
            }

            if (!$chosen) {
                // Fallback pick most recent/active for the class matching the student's type if present
                if ($studentType) {
                    $stmt2 = $this->pdo->prepare('SELECT * FROM fee_schedules WHERE class_id = ? AND student_type = ? ORDER BY is_active DESC, academic_year DESC, grading_period DESC, id DESC LIMIT 1');
                    $stmt2->execute([$classId, $studentType]);
                } else {
                    $stmt2 = $this->pdo->prepare('SELECT * FROM fee_schedules WHERE class_id = ? ORDER BY is_active DESC, academic_year DESC, grading_period DESC, id DESC LIMIT 1');
                    $stmt2->execute([$classId]);
                }
                $chosen = $stmt2->fetch(PDO::FETCH_ASSOC) ?: null;
            }

            if (!$chosen) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'No schedule found for class and student type']);
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
                        'grading_period' => $chosen['grading_period'] ?? null,
                        'total_fee' => $chosen['total_fee'] ?? null,
                        'is_active' => isset($chosen['is_active']) ? (int)$chosen['is_active'] : null,
                        'student_type' => $chosen['student_type'] ?? null,
                    ]
                ],
                'message' => 'Amount due computed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error computing amount due: ' . $e->getMessage()]);
        }
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

    /**
     * Get announcements for cashiers (cashier only)
     * Shows announcements with target_audience = 'all' or 'cashier'
     */
    public function getAnnouncements() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);
            
            $conditions = [];
            $params = [];
            
            // Filter for announcements relevant to cashiers
            $cashierConditions = [
                'target_audience = "all"',
                'target_audience = "cashier"'
            ];
            $conditions[] = '(' . implode(' OR ', $cashierConditions) . ')';
            
            // Additional filters if provided
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
            
            $where = '';
            if (!empty($conditions)) {
                $where = 'WHERE ' . implode(' AND ', $conditions);
            }
            
            require_once __DIR__ . '/../models/AnnouncementModel.php';
            $announcementModel = new AnnouncementModel($this->pdo);
            $announcements = $announcementModel->getAllWithDetails($where, $params);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $announcements,
                'message' => 'Announcements retrieved successfully for cashier'
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
     * Get monthly income data for cashier dashboard (cashier only)
     * Similar to admin version but accessible to cashiers
     */
    public function getMonthlyIncome() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            // Get current year or from query parameter
            $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
            
            // Query to get monthly income totals
            $sql = "SELECT 
                        MONTH(paid_on) as month,
                        SUM(amount) as total_income
                    FROM fee_payments 
                    WHERE YEAR(paid_on) = ? 
                    AND (status IS NULL OR status <> 'voided')
                    GROUP BY MONTH(paid_on) 
                    ORDER BY month ASC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$year]);
            $monthlyData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Initialize all months with 0 income
            $monthlyIncome = array_fill(1, 12, 0);
            
            // Fill in actual data
            foreach ($monthlyData as $data) {
                $month = (int)$data['month'];
                $monthlyIncome[$month] = (float)$data['total_income'];
            }
            
            // Convert to array with month names
            $monthNames = [
                1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 
                5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Aug',
                9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec'
            ];
            
            $formattedData = [];
            foreach ($monthlyIncome as $month => $income) {
                $formattedData[] = [
                    'month' => $monthNames[$month],
                    'income' => $income
                ];
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $formattedData,
                'year' => $year,
                'message' => 'Monthly income data retrieved successfully for cashier'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving monthly income: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get collection rate by class and grading period (cashier only)
     * Calculates collection rate considering student types (border/day) and fee schedules
     */
    public function getCollectionRate() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);

            // Get parameters
            $academicYearId = isset($_GET['academic_year_id']) ? (int)$_GET['academic_year_id'] : null;
            $gradingPeriodId = isset($_GET['grading_period_id']) ? (int)$_GET['grading_period_id'] : null;
            $classId = isset($_GET['class_id']) ? (int)$_GET['class_id'] : null;

            // Get academic year and grading period names for filtering
            $academicYearName = null;
            $gradingPeriodName = null;
            
            if ($academicYearId) {
                $stmt = $this->pdo->prepare("SELECT year_code FROM academic_years WHERE id = ?");
                $stmt->execute([$academicYearId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $academicYearName = $result ? $result['year_code'] : null;
            }
            
            if ($gradingPeriodId) {
                $stmt = $this->pdo->prepare("SELECT name FROM grading_periods WHERE id = ?");
                $stmt->execute([$gradingPeriodId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $gradingPeriodName = $result ? $result['name'] : null;
            }

            // Build the query to get collection rates by class
            $sql = "
                SELECT 
                    c.id as class_id,
                    c.name as class_name,
                    c.section as class_section,
                    fs.student_type,
                    COUNT(DISTINCT s.id) as total_students,
                    COALESCE(COUNT(DISTINCT s.id) * fs.total_fee, 0) as expected_collection,
                    COALESCE(SUM(DISTINCT fp.amount), 0) as actual_collection,
                    CASE 
                        WHEN COALESCE(COUNT(DISTINCT s.id) * fs.total_fee, 0) > 0 
                        THEN ROUND((COALESCE(SUM(DISTINCT fp.amount), 0) / (COUNT(DISTINCT s.id) * fs.total_fee)) * 100, 2)
                        ELSE 0 
                    END as collection_rate
                FROM classes c
                INNER JOIN students s ON s.current_class_id = c.id AND s.status = 'active'
                INNER JOIN fee_schedules fs ON fs.class_id = c.id 
                    AND fs.academic_year = COALESCE(?, fs.academic_year)
                    AND fs.grading_period = COALESCE(?, fs.grading_period)
                    AND (s.student_type = fs.student_type OR fs.student_type = 'all')
                LEFT JOIN fee_invoices fi ON fi.student_id = s.id 
                    AND fi.academic_year = fs.academic_year
                    AND fi.grading_period = fs.grading_period
                LEFT JOIN fee_payments fp ON fp.invoice_id = fi.id 
                    AND fp.student_id = s.id
                    AND (fp.status IS NULL OR fp.status != 'voided')
                WHERE fs.id IS NOT NULL
            ";

            $params = [$academicYearName, $gradingPeriodName];

            if ($classId) {
                $sql .= " AND c.id = ?";
                $params[] = $classId;
            }

            $sql .= "
                GROUP BY c.id, c.name, c.section, fs.student_type, fs.total_fee
                HAVING total_students > 0
                ORDER BY c.name, c.section, fs.student_type
            ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Process results to group by class
            $collectionRates = [];
            foreach ($results as $row) {
                $classKey = $row['class_id'];
                
                if (!isset($collectionRates[$classKey])) {
                    $collectionRates[$classKey] = [
                        'class_id' => $row['class_id'],
                        'class_name' => $row['class_name'],
                        'class_section' => $row['class_section'],
                        'total_students' => 0,
                        'expected_collection' => 0,
                        'actual_collection' => 0,
                        'collection_rate' => 0,
                        'student_types' => []
                    ];
                }

                $collectionRates[$classKey]['total_students'] += $row['total_students'];
                $collectionRates[$classKey]['expected_collection'] += $row['expected_collection'];
                $collectionRates[$classKey]['actual_collection'] += $row['actual_collection'];
                $collectionRates[$classKey]['student_types'][] = [
                    'type' => $row['student_type'],
                    'students' => $row['total_students'],
                    'expected' => $row['expected_collection'],
                    'actual' => $row['actual_collection'],
                    'rate' => $row['collection_rate']
                ];
            }

            // Calculate overall collection rate for each class
            foreach ($collectionRates as &$class) {
                if ($class['expected_collection'] > 0) {
                    $class['collection_rate'] = round(($class['actual_collection'] / $class['expected_collection']) * 100, 2);
                }
            }

            // Get summary statistics
            $summary = [
                'total_classes' => count($collectionRates),
                'total_students' => array_sum(array_column($collectionRates, 'total_students')),
                'expected_collection' => array_sum(array_column($collectionRates, 'expected_collection')),
                'actual_collection' => array_sum(array_column($collectionRates, 'actual_collection')),
                'overall_collection_rate' => 0
            ];

            if ($summary['expected_collection'] > 0) {
                $summary['overall_collection_rate'] = round(($summary['actual_collection'] / $summary['expected_collection']) * 100, 2);
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => array_values($collectionRates),
                'summary' => $summary,
                'filters' => [
                    'academic_year_id' => $academicYearId,
                    'grading_period_id' => $gradingPeriodId,
                    'class_id' => $classId
                ],
                'message' => 'Collection rate data retrieved successfully for cashier'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving collection rate: ' . $e->getMessage()
            ]);
        }
    }

}
?>
