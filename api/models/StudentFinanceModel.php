<?php

class StudentFinanceModel {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Get invoices for a student with optional filters
     */
    public function getInvoices($studentId, $filters = []) {
        $conditions = ['student_id = ?'];
        $params = [$studentId];
        
        if (!empty($filters['academic_year'])) {
            $conditions[] = 'academic_year = ?';
            $params[] = $filters['academic_year'];
        }
        if (!empty($filters['grading_period'])) {
            $conditions[] = 'grading_period = ?';
            $params[] = $filters['grading_period'];
        }
        if (!empty($filters['status'])) {
            $conditions[] = 'status = ?';
            $params[] = $filters['status'];
        }
        
        $where = 'WHERE ' . implode(' AND ', $conditions);
        
        $sql = "
            SELECT 
                i.*,
                fs.total_fee as schedule_fee,
                fs.student_type as schedule_student_type
            FROM fee_invoices i
            LEFT JOIN fee_schedules fs ON i.schedule_id = fs.id
            $where
            ORDER BY i.issue_date DESC, i.id DESC
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get payments for a student with optional filters
     */
    public function getPayments($studentId, $filters = []) {
        $conditions = ['p.student_id = ?'];
        $params = [$studentId];
        
        if (!empty($filters['academic_year'])) {
            $conditions[] = 'i.academic_year = ?';
            $params[] = $filters['academic_year'];
        }
        if (!empty($filters['grading_period'])) {
            $conditions[] = 'i.grading_period = ?';
            $params[] = $filters['grading_period'];
        }
        
        $where = 'WHERE ' . implode(' AND ', $conditions);
        
        $sql = "
            SELECT 
                p.*,
                i.invoice_number,
                i.academic_year,
                i.grading_period,
                r.receipt_number,
                r.printed_on as receipt_printed_on
            FROM fee_payments p
            LEFT JOIN fee_invoices i ON p.invoice_id = i.id
            LEFT JOIN fee_receipts r ON p.id = r.payment_id
            $where
            ORDER BY p.paid_on DESC, p.id DESC
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get finance summary for a student
     */
    public function getFinanceSummary($studentId) {
        $sql = "
            SELECT 
                COUNT(*) as total_invoices,
                SUM(amount_due) as total_invoiced,
                SUM(amount_paid) as total_paid,
                SUM(balance) as total_outstanding,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_invoices
            FROM fee_invoices 
            WHERE student_id = ?
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get recent payments for a student
     */
    public function getRecentPayments($studentId, $limit = 5) {
        // Ensure limit is an integer
        $limit = (int) $limit;
        
        $sql = "
            SELECT 
                p.amount,
                p.paid_on,
                p.method,
                i.academic_year,
                i.grading_period,
                r.receipt_number
            FROM fee_payments p
            LEFT JOIN fee_invoices i ON p.invoice_id = i.id
            LEFT JOIN fee_receipts r ON p.id = r.payment_id
            WHERE p.student_id = ? AND (p.status IS NULL OR p.status != 'voided')
            ORDER BY p.paid_on DESC
            LIMIT $limit
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get outstanding invoices for a student
     */
    public function getOutstandingInvoices($studentId) {
        $sql = "
            SELECT 
                invoice_number,
                academic_year,
                grading_period,
                amount_due,
                amount_paid,
                balance,
                due_date,
                issue_date
            FROM fee_invoices 
            WHERE student_id = ? AND status = 'open' AND balance > 0
            ORDER BY due_date ASC, issue_date ASC
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Group payments by invoice
     */
    public function groupPaymentsByInvoice($payments) {
        $paymentsByInvoice = [];
        foreach ($payments as $payment) {
            $invoiceId = $payment['invoice_id'];
            if (!isset($paymentsByInvoice[$invoiceId])) {
                $paymentsByInvoice[$invoiceId] = [];
            }
            $paymentsByInvoice[$invoiceId][] = $payment;
        }
        return $paymentsByInvoice;
    }

    /**
     * Add payments to invoices
     */
    public function addPaymentsToInvoices($invoices, $paymentsByInvoice) {
        foreach ($invoices as &$invoice) {
            $invoiceId = $invoice['id'];
            $invoice['payments'] = $paymentsByInvoice[$invoiceId] ?? [];
            $invoice['payment_count'] = count($invoice['payments']);
        }
        return $invoices;
    }

    /**
     * Calculate finance statistics from invoices
     */
    public function calculateFinanceStats($invoices) {
        $totalInvoiced = 0;
        $totalPaid = 0;
        $totalOutstanding = 0;
        $paidInvoices = 0;
        $openInvoices = 0;
        
        foreach ($invoices as $invoice) {
            $totalInvoiced += (float)$invoice['amount_due'];
            $totalPaid += (float)$invoice['amount_paid'];
            $totalOutstanding += (float)$invoice['balance'];
            
            if ($invoice['status'] === 'paid') {
                $paidInvoices++;
            } else {
                $openInvoices++;
            }
        }
        
        return [
            'total_invoiced' => $totalInvoiced,
            'total_paid' => $totalPaid,
            'total_outstanding' => $totalOutstanding,
            'paid_invoices' => $paidInvoices,
            'open_invoices' => $openInvoices,
            'total_invoices' => count($invoices)
        ];
    }

    /**
     * Get complete finance records for a student
     */
    public function getFinanceRecords($studentId, $filters = []) {
        // Get invoices and payments
        $invoices = $this->getInvoices($studentId, $filters);
        $payments = $this->getPayments($studentId, $filters);
        
        // Group payments by invoice
        $paymentsByInvoice = $this->groupPaymentsByInvoice($payments);
        
        // Add payments to invoices
        $invoices = $this->addPaymentsToInvoices($invoices, $paymentsByInvoice);
        
        // Calculate statistics
        $summary = $this->calculateFinanceStats($invoices);
        
        return [
            'invoices' => $invoices,
            'payments' => $payments,
            'summary' => $summary
        ];
    }

    /**
     * Get finance summary data for a student
     */
    public function getFinanceSummaryData($studentId) {
        // Get summary statistics
        $summary = $this->getFinanceSummary($studentId);
        
        // Get recent payments
        $recentPayments = $this->getRecentPayments($studentId);
        
        // Get outstanding invoices
        $outstandingInvoices = $this->getOutstandingInvoices($studentId);
        
        return [
            'summary' => [
                'total_invoiced' => (float)($summary['total_invoiced'] ?? 0),
                'total_paid' => (float)($summary['total_paid'] ?? 0),
                'total_outstanding' => (float)($summary['total_outstanding'] ?? 0),
                'paid_invoices' => (int)($summary['paid_invoices'] ?? 0),
                'open_invoices' => (int)($summary['open_invoices'] ?? 0),
                'total_invoices' => (int)($summary['total_invoices'] ?? 0)
            ],
            'recent_payments' => $recentPayments,
            'outstanding_invoices' => $outstandingInvoices
        ];
    }
}
