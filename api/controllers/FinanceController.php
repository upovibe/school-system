<?php
// api/controllers/FinanceController.php - Finance-related endpoints (schedules first)

require_once __DIR__ . '/../models/FeeSchedule.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/FeeInvoice.php';
require_once __DIR__ . '/../models/FeePayment.php';
require_once __DIR__ . '/../models/FeeReceipt.php';
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class FinanceController {
    private $pdo;
    private $feeScheduleModel;
    private $feeInvoiceModel;
    private $feePaymentModel;
    private $feeReceiptModel;
    private $studentModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->feeScheduleModel = new FeeSchedule($pdo);
        $this->feeInvoiceModel = new FeeInvoice($pdo);
        $this->feePaymentModel = new FeePayment($pdo);
        $this->feeReceiptModel = new FeeReceipt($pdo);
        $this->studentModel = new StudentModel($pdo);
    }

    /**
     * List fee schedules with optional filters (admin only)
     * Filters: class_id, academic_year, term, student_type, is_active
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
            if (isset($_GET['academic_year_id']) && $_GET['academic_year_id'] !== '') {
                $conditions[] = 'academic_year_id = ?';
                $params[] = $_GET['academic_year_id'];
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

            // Use the enhanced model method to get schedules with class and academic year details
            if (empty($conditions)) {
                $schedules = $this->feeScheduleModel->getAllWithDetails();
            } else {
                // For filtered results, we'll need to get basic data first, then enhance it
                $sql = "SELECT * FROM fee_schedules $where ORDER BY academic_year DESC, term DESC, id DESC";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($params);
                $basicSchedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Enhance with class and academic year details
                $schedules = [];
                foreach ($basicSchedules as $schedule) {
                    $classSql = "SELECT c.name as class_name, c.section as class_section, c.academic_year_id, 
                                        ay.year_code AS academic_year_code, ay.display_name as academic_year_display_name
                                 FROM classes c 
                                 LEFT JOIN academic_years ay ON c.academic_year_id = ay.id 
                                 WHERE c.id = ?";
                    $classStmt = $this->pdo->prepare($classSql);
                    $classStmt->execute([$schedule['class_id']]);
                    $classDetails = $classStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($classDetails) {
                        $schedule['class_name'] = $classDetails['class_name'];
                        $schedule['class_section'] = $classDetails['class_section'];
                        $schedule['academic_year_code'] = $classDetails['academic_year_code'];
                        $schedule['academic_year_display_name'] = $classDetails['academic_year_display_name'];
                    }
                    $schedules[] = $schedule;
                }
            }

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
      * Required: class_id, academic_year, grading_period, student_type, total_fee
     */
    public function storeSchedule() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Validate required fields (academic_year is auto-populated from class)
            $required = ['class_id', 'grading_period', 'student_type', 'total_fee'];
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

            // Validate that academic_year is provided
            if (!isset($data['academic_year']) || $data['academic_year'] === '') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year is required'
                ]);
                return;
            }

            // Defaults
            if (!isset($data['student_type']) || $data['student_type'] === '') {
                $data['student_type'] = 'Day';
            }

            // Validate that the academic year format is correct (should contain year_code)
            $yearCode = $this->feeScheduleModel->getClassAcademicYear($data['class_id']);
            if (!$yearCode || !str_contains($data['academic_year'], $yearCode['year_code'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'The academic year must match the class\'s academic year'
                ]);
                return;
            }

            // Enforce uniqueness: class_id + academic_year + grading_period + student_type
            $existing = $this->findScheduleByComposite($data['class_id'], $data['academic_year'], $data['grading_period'], $data['student_type']);
            if ($existing) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'A schedule already exists for this class, academic year, grading period and student type'
                ]);
                return;
            }

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

            // If class is being changed, automatically update academic_year to match the new class
            if (isset($data['class_id']) && $data['class_id'] !== $existing['class_id']) {
                $classAcademicYear = $this->feeScheduleModel->getClassAcademicYear($data['class_id']);
                if (!$classAcademicYear) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid class selected or class has no academic year'
                    ]);
                    return;
                }
                
                // Automatically update academic_year to match the new class
                $data['academic_year'] = $classAcademicYear['year_code'];
            }

            // If composite keys are changing, enforce uniqueness
            $newClassId = $data['class_id'] ?? $existing['class_id'];
            $newYear = $data['academic_year'] ?? $existing['academic_year'];
            $newTerm = $data['term'] ?? $existing['term'];
            $newType = $data['student_type'] ?? ($existing['student_type'] ?? 'Day');
            $dup = $this->findScheduleByComposite($newClassId, $newYear, $newTerm, $newType);
            if ($dup && (int)$dup['id'] !== (int)$id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Another schedule already exists for this class, academic year, term and student type'
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
     * Get classes with academic year information for fee schedule creation (admin only)
     */
    public function getClassesForSchedule() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $classes = $this->feeScheduleModel->getClassesWithAcademicYear();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classes,
                'message' => 'Classes retrieved successfully for fee schedule creation'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving classes: ' . $e->getMessage()
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
    private function findScheduleByComposite($classId, $academicYear, $gradingPeriod, $studentType = null) {
        if ($studentType !== null) {
            $sql = 'SELECT * FROM fee_schedules WHERE class_id = ? AND academic_year = ? AND grading_period = ? AND student_type = ? LIMIT 1';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$classId, $academicYear, $gradingPeriod, $studentType]);
        } else {
            $sql = 'SELECT * FROM fee_schedules WHERE class_id = ? AND academic_year = ? AND grading_period = ? LIMIT 1';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$classId, $academicYear, $gradingPeriod]);
        }
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
     * Filters: student_id, academic_year, grading_period, status
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

    /**
     * Create a fee invoice (admin only)
     * Required: student_id, academic_year, grading_period, amount_due
     * Optional: invoice_number (auto-generated if missing), issue_date, due_date, notes
     */
    public function storeInvoice() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
            $studentType = $studentRow['student_type'] ?? null; // assuming column exists; optional
            if ($studentType) {
                $data['student_type'] = $studentType;
            }
            // Try to find matching schedule id using type if present
            $classIdStmt = $this->pdo->prepare('SELECT current_class_id FROM students WHERE id = ? LIMIT 1');
            $classIdStmt->execute([$data['student_id']]);
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
     * Compute amount due for a student based on current class and schedules.
     * Params: student_id (required), academic_year (optional), term (optional)
     */
    public function getAmountDue() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
     * Get all fee schedules for a specific class (for invoice creation)
     * This allows users to see all available grading periods and amounts
     */
    public function getSchedulesByClass() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $classId = isset($_GET['class_id']) ? (int)$_GET['class_id'] : 0;
            $studentType = isset($_GET['student_type']) ? (string)$_GET['student_type'] : null;
            
            if ($classId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'class_id is required']);
                return;
            }

            // Build the query based on whether student_type is specified
            if ($studentType) {
                $sql = "SELECT * FROM fee_schedules WHERE class_id = ? AND student_type = ? ORDER BY academic_year DESC, grading_period ASC, id DESC";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$classId, $studentType]);
            } else {
                $sql = "SELECT * FROM fee_schedules WHERE class_id = ? ORDER BY academic_year DESC, grading_period ASC, id DESC";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$classId]);
            }

            $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Group schedules by academic year for better organization
            $groupedSchedules = [];
            foreach ($schedules as $schedule) {
                $year = $schedule['academic_year'];
                if (!isset($groupedSchedules[$year])) {
                    $groupedSchedules[$year] = [];
                }
                $groupedSchedules[$year][] = $schedule;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'schedules' => $schedules,
                    'grouped_by_year' => $groupedSchedules,
                    'total_count' => count($schedules)
                ],
                'message' => 'Fee schedules retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving fee schedules: ' . $e->getMessage()]);
        }
    }

    // Payments Section
    /**
     * List payments with optional filters: invoice_id, student_id, method, date range
     */
    public function indexPayments() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $conditions = [];
            $params = [];

            if (!empty($_GET['invoice_id'])) { $conditions[] = 'invoice_id = ?'; $params[] = (int)$_GET['invoice_id']; }
            if (!empty($_GET['student_id'])) { $conditions[] = 'student_id = ?'; $params[] = (int)$_GET['student_id']; }
            if (!empty($_GET['method'])) { $conditions[] = 'method = ?'; $params[] = (string)$_GET['method']; }
            if (!empty($_GET['from'])) { $conditions[] = 'DATE(paid_on) >= ?'; $params[] = (string)$_GET['from']; }
            if (!empty($_GET['to'])) { $conditions[] = 'DATE(paid_on) <= ?'; $params[] = (string)$_GET['to']; }

            $where = empty($conditions) ? '' : ('WHERE ' . implode(' AND ', $conditions));
            $sql = "SELECT * FROM fee_payments $where ORDER BY paid_on DESC, id DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $rows, 'message' => 'Payments retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving payments: ' . $e->getMessage()]);
        }
    }

    /**
     * Create a payment for an invoice, then recompute the invoice totals/status and create a receipt
     * Required: invoice_id, amount
     * Optional: method, reference, paid_on, notes
     */
    public function storePayment() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
                // Accept formats like YYYY-MM-DD or YYYY-MM-DDTHH:MM or full datetime
                if (strpos($incomingPaidOn, 'T') !== false) {
                    $incomingPaidOn = str_replace('T', ' ', $incomingPaidOn);
                }
                // If only date or missing seconds, pad to seconds
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $incomingPaidOn)) {
                    // Use current server time when only date is provided
                    $incomingPaidOn .= ' ' . date('H:i:s');
                } elseif (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $incomingPaidOn)) {
                    $incomingPaidOn .= ':00';
                }
            } else {
                $incomingPaidOn = date('Y-m-d H:i:s');
            }

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

            // Recompute invoice totals based on payments
            // Sum only non-voided payments
            $sumStmt = $this->pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE invoice_id = ? AND (status IS NULL OR status <> 'voided')");
            $sumStmt->execute([$invoiceId]);
            $sumPaid = (float)$sumStmt->fetchColumn();

            $newBalance = (float)$invoice['amount_due'] - $sumPaid;
            if ($newBalance < 0) { $newBalance = 0.0; }
            $newStatus = $newBalance <= 0 ? 'paid' : 'open';

            $this->feeInvoiceModel->update($invoiceId, [
                'amount_paid' => $sumPaid,
                'balance' => $newBalance,
                'status' => $newStatus,
            ]);

            // Create receipt
            $receiptNumber = $this->generateReceiptNumber();
            $this->feeReceiptModel->create([
                'payment_id' => $paymentId,
                'receipt_number' => $receiptNumber,
                'printed_on' => date('Y-m-d H:i:s')
            ]);

            $this->logAction('finance_payment_created', 'Payment recorded', [
                'fee_payment_id' => $paymentId,
                'invoice_id' => $invoiceId,
                'amount' => $amount
            ]);

            http_response_code(201);
            echo json_encode(['success' => true, 'data' => ['id' => $paymentId, 'receipt_number' => $receiptNumber], 'message' => 'Payment recorded successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error recording payment: ' . $e->getMessage()]);
        }
    }

    /**
     * Show a payment by id
     */
    public function showPayment($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
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

    /**
     * Delete a payment, then recompute the invoice totals/status
     */
    public function destroyPayment($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
                    $this->feeInvoiceModel->update($invoiceId, [
                        'amount_paid' => $sumPaid,
                        'balance' => $newBalance,
                        'status' => $newStatus,
                    ]);
                }

                $this->logAction('finance_payment_deleted', 'Payment deleted', [ 'fee_payment_id' => (int)$id, 'invoice_id' => $invoiceId ]);

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

    /**
     * Void a payment (soft-cancel). Marks status=voided and recomputes invoice totals excluding voided payments
     * Optional body: { reason: string }
     */
    public function voidPayment($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
                $this->feeInvoiceModel->update($invoiceId, [
                    'amount_paid' => $sumPaid,
                    'balance' => $newBalance,
                    'status' => $newStatus,
                ]);
            }

            $this->logAction('finance_payment_voided', 'Payment voided', [ 'fee_payment_id' => (int)$id, 'invoice_id' => $invoiceId, 'reason' => $reason ]);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Payment voided successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error voiding payment: ' . $e->getMessage()]);
        }
    }

    // Helpers (payments)
    private function generateReceiptNumber() {
        $prefix = 'RCT-' . date('Ymd') . '-';
        
        // Find the next available sequence number by checking existing receipt numbers
        $sql = "SELECT receipt_number FROM fee_receipts WHERE receipt_number LIKE ? ORDER BY receipt_number DESC LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$prefix . '%']);
        $lastReceipt = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($lastReceipt) {
            // Extract the sequence number from the last receipt
            $lastSeq = (int)substr($lastReceipt['receipt_number'], -4);
            $nextSeq = $lastSeq + 1;
        } else {
            // No receipts today, start with 0001
            $nextSeq = 1;
        }
        
        return $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
    }

    // Receipt Management Methods
    /**
     * List all receipts with payment and invoice details
     */
    public function indexReceipts() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
            
            // Format the data
            foreach ($receipts as &$receipt) {
                $receipt['student_display'] = trim($receipt['first_name'] . ' ' . $receipt['last_name']);
                $receipt['voided_by_display'] = $receipt['voided_by_name'] ?: 'Unknown';
                $receipt['is_voided'] = $receipt['payment_status'] === 'voided';
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $receipts]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error fetching receipts: ' . $e->getMessage()]);
        }
    }

    /**
     * Get a specific receipt with full details
     */
    public function showReceipt($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
            
            if (!$receipt) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Receipt not found']);
                return;
            }

            // Format the data
            $receipt['student_display'] = trim($receipt['first_name'] . ' ' . $receipt['last_name']);
            $receipt['voided_by_display'] = $receipt['voided_by_name'] ?: 'Unknown';
            $receipt['is_voided'] = $receipt['payment_status'] === 'voided';

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $receipt]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error fetching receipt: ' . $e->getMessage()]);
        }
    }

    /**
     * Print/download receipt as PDF or HTML
     */
    public function printReceipt($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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

            // For now, return HTML format (can be enhanced to generate PDF)
            $this->renderReceiptHTML($receipt);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error printing receipt: ' . $e->getMessage()]);
        }
    }

    /**
     * Regenerate receipt (useful if receipt was corrupted or needs updating)
     */
    public function regenerateReceipt($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            // Get existing receipt
            $existing = $this->feeReceiptModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Receipt not found']);
                return;
            }

            // Generate new receipt number
            $newReceiptNumber = $this->generateReceiptNumber();
            
            // Update receipt
            $this->feeReceiptModel->update($id, [
                'receipt_number' => $newReceiptNumber,
                'printed_on' => null // Reset printed timestamp
            ]);

            // Fetch the updated receipt data
            $updatedReceipt = $this->feeReceiptModel->findById($id);
            
            http_response_code(200);
            echo json_encode([
                'success' => true, 
                'message' => 'Receipt regenerated successfully',
                'data' => $updatedReceipt
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error regenerating receipt: ' . $e->getMessage()]);
        }
    }

    /**
     * Get school settings for receipt generation
     */
    private function getSchoolSettings() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT setting_key, setting_value 
                FROM settings 
                WHERE category IN ('general', 'contact') 
                AND is_active = 1
            ");
            $stmt->execute();
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $result = [];
            foreach ($settings as $setting) {
                $result[$setting['setting_key']] = $setting['setting_value'];
            }
            
            return $result;
        } catch (Exception $e) {
            // Return default values if settings can't be fetched
            return [
                'application_name' => 'School Name',
                'application_logo' => '',
                'application_tagline' => 'Excellence in Education',
                'contact_address' => 'School Address',
                'contact_phone' => 'Phone Number',
                'contact_email' => 'info@school.com',
                'contact_website' => 'https://school.com'
            ];
        }
    }

    /**
     * Render receipt as HTML (can be enhanced to generate PDF)
     */
    /*
    private function renderReceiptHTML($receipt) {
        $isVoided = $receipt['payment_status'] === 'voided';
        $studentName = trim($receipt['first_name'] . ' ' . $receipt['last_name']);
        
        // Fetch school settings
        $schoolSettings = $this->getSchoolSettings();
        
        // Set content type for HTML
        header('Content-Type: text/html; charset=utf-8');
        
        echo '<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt ' . htmlspecialchars($receipt['receipt_number']) . '</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                .receipt { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .school-logo { max-width: 120px; max-height: 80px; margin-bottom: 15px; }
                .school-name { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 5px; }
                .school-tagline { font-size: 14px; color: #666; margin-bottom: 10px; font-style: italic; }
                .receipt-title { font-size: 18px; color: #666; }
                .receipt-number { font-size: 16px; color: #333; font-weight: bold; }
                .voided-banner { background: #ff4444; color: white; text-align: center; padding: 10px; margin: 20px 0; border-radius: 5px; font-weight: bold; }
                .section { margin: 20px 0; }
                .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .field { margin-bottom: 15px; }
                .label { font-size: 12px; color: #666; margin-bottom: 5px; }
                .value { font-size: 14px; color: #333; font-weight: 500; }
                .amount { font-size: 18px; font-weight: bold; color: #2c5aa0; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                .school-contact { border-top: 1px solid #ddd; padding-top: 20px; }
                .school-contact p { margin: 5px 0; }
                @media print { body { background: white; } .receipt { box-shadow: none; } }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">';
        
        // Add school logo if available
        if (!empty($schoolSettings['application_logo'])) {
            $logoUrl = 'http://localhost:8000/' . $schoolSettings['application_logo'];
            echo '<img src="' . htmlspecialchars($logoUrl) . '" alt="School Logo" class="school-logo">';
        }
        
        echo '<div class="school-name">' . htmlspecialchars($schoolSettings['application_name'] ?? 'SCHOOL SYSTEM') . '</div>';
        if (!empty($schoolSettings['application_tagline'])) {
            echo '<div class="school-tagline">' . htmlspecialchars($schoolSettings['application_tagline']) . '</div>';
        }
        echo '<div class="receipt-title">OFFICIAL RECEIPT</div>
                    <div class="receipt-number">' . htmlspecialchars($receipt['receipt_number']) . '</div>
                </div>';

        if ($isVoided) {
            echo '<div class="voided-banner">⚠️ THIS RECEIPT IS VOIDED</div>';
        }

        echo '
                <div class="section">
                    <div class="section-title">Student Information</div>
                    <div class="grid">
                        <div class="field">
                            <div class="label">Student Name</div>
                            <div class="value">' . htmlspecialchars($studentName) . '</div>
                        </div>
                        <div class="field">
                            <div class="label">Student ID</div>
                            <div class="value">' . htmlspecialchars($receipt['student_number'] ?: 'N/A') . '</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Payment Details</div>
                    <div class="grid">
                        <div class="field">
                            <div class="label">Invoice Number</div>
                            <div class="value">' . htmlspecialchars($receipt['invoice_number'] ?: 'N/A') . '</div>
                        </div>
                        <div class="field">
                            <div class="label">Grading Period & Academic Year</div>
                            <div class="value">' . htmlspecialchars($receipt['grading_period'] . ' ' . $receipt['academic_year']) . '</div>
                        </div>
                        <div class="field">
                            <div class="label">Payment Method</div>
                            <div class="value">' . htmlspecialchars($receipt['method'] ?: 'N/A') . '</div>
                        </div>
                        <div class="field">
                            <div class="label">Reference</div>
                            <div class="value">' . htmlspecialchars($receipt['reference'] ?: 'N/A') . '</div>
                        </div>
                        <div class="field">
                            <div class="label">Amount Paid</div>
                            <div class="value amount">₵' . number_format($receipt['amount'], 2) . '</div>
                        </div>
                        <div class="field">
                            <div class="label">Balance After Payment</div>
                            <div class="value">₵' . number_format($receipt['balance'], 2) . '</div>
                        </div>
                        <div class="field">
                            <div class="label">Payment Date</div>
                            <div class="value">' . date('d M Y', strtotime($receipt['paid_on'])) . '</div>
                        </div>
                        <div class="field">
                            <div class="label">Receipt Generated</div>
                            <div class="value">' . date('d M Y H:i', strtotime($receipt['created_at'])) . '</div>
                        </div>
                    </div>
                </div>';

        if ($isVoided) {
            echo '
                <div class="section">
                    <div class="section-title">Void Information</div>
                    <div class="grid">
                        <div class="field">
                            <div class="label">Voided On</div>
                            <div class="value">' . date('d M Y H:i', strtotime($receipt['voided_at'])) . '</div>
                        </div>
                        <div class="field">
                            <div class="label">Voided By</div>
                            <div class="value">' . htmlspecialchars($receipt['voided_by_display'] ?: 'N/A') . '</div>
                        </div>
                        <div class="field" style="grid-column: 1 / -1;">
                            <div class="label">Reason</div>
                            <div class="value">' . htmlspecialchars($receipt['void_reason'] ?: 'N/A') . '</div>
                        </div>
                    </div>
                </div>';
        }

        if ($receipt['notes']) {
            echo '
                <div class="section">
                    <div class="section-title">Notes</div>
                    <div class="value">' . htmlspecialchars($receipt['notes']) . '</div>
                </div>';
        }

        echo '
                <div class="footer">
                    <div class="school-contact">
                        <p><strong>' . htmlspecialchars($schoolSettings['application_name'] ?? 'School System') . '</strong></p>';
        
        if (!empty($schoolSettings['contact_address'])) {
            echo '<p>' . htmlspecialchars($schoolSettings['contact_address']) . '</p>';
        }
        
        if (!empty($schoolSettings['contact_phone'])) {
            echo '<p>Phone: ' . htmlspecialchars($schoolSettings['contact_phone']) . '</p>';
        }
        
        if (!empty($schoolSettings['contact_email'])) {
            echo '<p>Email: ' . htmlspecialchars($schoolSettings['contact_email']) . '</p>';
        }
        
        if (!empty($schoolSettings['contact_website'])) {
            echo '<p>Website: ' . htmlspecialchars($schoolSettings['contact_website']) . '</p>';
        }
        
        echo '<p>Generated on ' . date('d M Y H:i:s') . '</p>
                    </div>
                </div>
            </div>
        </body>
        </html>';
    }
    */

    private function renderReceiptHTML($receipt) {
        $isVoided = $receipt['payment_status'] === 'voided';
        $studentName = trim($receipt['first_name'] . ' ' . $receipt['last_name']);
        
        // Fetch school settings
        $schoolSettings = $this->getSchoolSettings();
        
        // Set content type for HTML
        header('Content-Type: text/html; charset=utf-8');
        
        // Include the shared PHP template - variables are already in scope
        include __DIR__ . '/../email/templates/receipt.php';
    }

    /**
     * Get monthly income data for the current year (admin only)
     * Returns monthly totals from fee payments
     */
    public function getMonthlyIncome() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

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
                'message' => 'Monthly income data retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving monthly income: ' . $e->getMessage()
            ]);
        }
    }
}


