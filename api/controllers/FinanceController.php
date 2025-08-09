<?php

require_once __DIR__ . '/../models/FeeSchedule.php';
require_once __DIR__ . '/../models/FeeInvoice.php';
require_once __DIR__ . '/../models/FeePayment.php';
require_once __DIR__ . '/../models/FeeReceipt.php';
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../controllers/ResponseHelper.php';

class FinanceController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * GET /finance/fee-schedules
     * Optional query: class_id, academic_year, term
     */
    public function listSchedules() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $classId = $_GET['class_id'] ?? null;
            $year = $_GET['academic_year'] ?? null;
            $term = $_GET['term'] ?? null;

            $sql = 'SELECT * FROM fee_schedules WHERE 1=1';
            $params = [];
            if ($classId) { $sql .= ' AND class_id = ?'; $params[] = $classId; }
            if ($year) { $sql .= ' AND academic_year = ?'; $params[] = $year; }
            if ($term) { $sql .= ' AND term = ?'; $params[] = $term; }
            $sql .= ' ORDER BY academic_year DESC, term ASC, class_id ASC';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            ResponseHelper::success($data, 'Fee schedules retrieved successfully');
        } catch (Exception $e) {
            ResponseHelper::error('Failed to retrieve fee schedules: ' . $e->getMessage());
        }
    }

    /**
     * POST /finance/fee-schedules
     * Body: class_id, academic_year, term, total_fee, is_active (optional)
     */
    public function createSchedule() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $classId = (int)($input['class_id'] ?? 0);
            $year = trim($input['academic_year'] ?? '');
            $term = trim($input['term'] ?? '');
            $totalFee = (float)($input['total_fee'] ?? 0);
            $isActive = isset($input['is_active']) ? (int)!!$input['is_active'] : 1;

            if (!$classId || !$year || !$term || $totalFee <= 0) {
                ResponseHelper::badRequest('class_id, academic_year, term, total_fee are required');
                return;
            }

            // Enforce unique (class, year, term)
            $stmt = $this->pdo->prepare('SELECT id FROM fee_schedules WHERE class_id = ? AND academic_year = ? AND term = ?');
            $stmt->execute([$classId, $year, $term]);
            if ($stmt->fetch()) {
                ResponseHelper::badRequest('Fee schedule already exists for this class and period');
                return;
            }

            $model = new FeeSchedule($this->pdo);
            $schedule = $model->create([
                'class_id' => $classId,
                'academic_year' => $year,
                'term' => $term,
                'total_fee' => $totalFee,
                'is_active' => $isActive,
            ]);

            ResponseHelper::success($schedule, 'Fee schedule created');
        } catch (Exception $e) {
            ResponseHelper::error('Failed to create fee schedule: ' . $e->getMessage());
        }
    }

    /**
     * GET /finance/invoices
     * Query: student_id (required), academic_year optional, term optional
     */
    public function listInvoices() {
        try {
            AuthMiddleware::requireAuth($this->pdo);
            $studentId = $_GET['student_id'] ?? null;
            if (!$studentId) { ResponseHelper::badRequest('student_id is required'); return; }

            $sql = 'SELECT * FROM fee_invoices WHERE student_id = ?';
            $params = [$studentId];
            if (!empty($_GET['academic_year'])) { $sql .= ' AND academic_year = ?'; $params[] = $_GET['academic_year']; }
            if (!empty($_GET['term'])) { $sql .= ' AND term = ?'; $params[] = $_GET['term']; }
            $sql .= ' ORDER BY issue_date DESC, id DESC';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            ResponseHelper::success($data, 'Invoices retrieved');
        } catch (Exception $e) {
            ResponseHelper::error('Failed to retrieve invoices: ' . $e->getMessage());
        }
    }

    /**
     * POST /finance/invoices
     * Body: student_id, academic_year, term, amount_due (optional)
     * - If amount_due empty, derive from fee_schedules using student's class
     */
    public function createInvoice() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $studentId = (int)($input['student_id'] ?? 0);
            $year = trim($input['academic_year'] ?? '');
            $term = trim($input['term'] ?? '');
            $amountDueInput = isset($input['amount_due']) ? (float)$input['amount_due'] : null;

            if (!$studentId || !$year || !$term) { ResponseHelper::badRequest('student_id, academic_year, term required'); return; }

            // Check existing invoice for this period
            $exists = $this->pdo->prepare('SELECT id FROM fee_invoices WHERE student_id=? AND academic_year=? AND term=?');
            $exists->execute([$studentId, $year, $term]);
            if ($exists->fetch()) { ResponseHelper::badRequest('Invoice already exists for this student and period'); return; }

            // Resolve amount_due
            $amountDue = $amountDueInput;
            if ($amountDue === null) {
                // Get student's class
                $studentStmt = $this->pdo->prepare('SELECT class_id FROM students WHERE id = ?');
                $studentStmt->execute([$studentId]);
                $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
                if (!$student || !$student['class_id']) { ResponseHelper::badRequest('Student class not found'); return; }

                $schedStmt = $this->pdo->prepare('SELECT total_fee FROM fee_schedules WHERE class_id=? AND academic_year=? AND term=?');
                $schedStmt->execute([$student['class_id'], $year, $term]);
                $sched = $schedStmt->fetch(PDO::FETCH_ASSOC);
                if (!$sched) { ResponseHelper::badRequest('No fee schedule for this class and period'); return; }
                $amountDue = (float)$sched['total_fee'];
            }

            // Generate invoice number simple format: INV-YYYYMMDD-<uniqid>
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . substr(uniqid('', true), -6);
            $issueDate = date('Y-m-d');

            $model = new FeeInvoice($this->pdo);
            $invoice = $model->create([
                'student_id' => $studentId,
                'academic_year' => $year,
                'term' => $term,
                'invoice_number' => $invoiceNumber,
                'status' => 'open',
                'issue_date' => $issueDate,
                'due_date' => null,
                'amount_due' => $amountDue,
                'amount_paid' => 0,
                'balance' => $amountDue,
                'notes' => $input['notes'] ?? null,
                'created_by' => null,
            ]);

            ResponseHelper::success($invoice, 'Invoice created');
        } catch (Exception $e) {
            ResponseHelper::error('Failed to create invoice: ' . $e->getMessage());
        }
    }

    /**
     * POST /finance/payments
     * Body: invoice_id, amount, paid_on (optional), reference (optional), notes (optional)
     * Updates invoice amount_paid and balance; creates receipt
     */
    public function recordPayment() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $invoiceId = (int)($input['invoice_id'] ?? 0);
            $amount = (float)($input['amount'] ?? 0);
            $reference = $input['reference'] ?? null;
            $notes = $input['notes'] ?? null;
            $paidOn = !empty($input['paid_on']) ? $input['paid_on'] : date('Y-m-d H:i:s');

            if (!$invoiceId || $amount <= 0) { ResponseHelper::badRequest('invoice_id and positive amount are required'); return; }

            // Load invoice
            $invStmt = $this->pdo->prepare('SELECT * FROM fee_invoices WHERE id = ?');
            $invStmt->execute([$invoiceId]);
            $invoice = $invStmt->fetch(PDO::FETCH_ASSOC);
            if (!$invoice) { ResponseHelper::badRequest('Invoice not found'); return; }

            // Create payment
            $payModel = new FeePayment($this->pdo);
            $payment = $payModel->create([
                'invoice_id' => $invoice['id'],
                'student_id' => $invoice['student_id'],
                'amount' => $amount,
                'method' => 'cash',
                'reference' => $reference,
                'paid_on' => $paidOn,
                'received_by' => null,
                'notes' => $notes,
            ]);

            // Update invoice amounts
            $newPaid = (float)$invoice['amount_paid'] + $amount;
            $newBalance = max(0, (float)$invoice['amount_due'] - $newPaid);
            $newStatus = $newBalance <= 0.00001 ? 'paid' : 'open';
            $upd = $this->pdo->prepare('UPDATE fee_invoices SET amount_paid = ?, balance = ?, status = ?, updated_at = NOW() WHERE id = ?');
            $upd->execute([$newPaid, $newBalance, $newStatus, $invoice['id']]);

            // Create receipt
            $receiptNo = 'REC-' . date('Ymd') . '-' . substr(uniqid('', true), -6);
            $recModel = new FeeReceipt($this->pdo);
            $receipt = $recModel->create([
                'payment_id' => $payment['id'],
                'receipt_number' => $receiptNo,
                'printed_on' => date('Y-m-d H:i:s'),
            ]);

            ResponseHelper::success([
                'payment' => $payment,
                'invoice' => [
                    'id' => $invoice['id'],
                    'amount_paid' => $newPaid,
                    'balance' => $newBalance,
                    'status' => $newStatus
                ],
                'receipt' => $receipt
            ], 'Payment recorded');
        } catch (Exception $e) {
            ResponseHelper::error('Failed to record payment: ' . $e->getMessage());
        }
    }
}


