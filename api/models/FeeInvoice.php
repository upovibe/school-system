<?php

require_once __DIR__ . '/../core/BaseModel.php';

class FeeInvoice extends BaseModel {
    protected static $table = 'fee_invoices';

    protected static $fillable = [
        'student_id', 'academic_year', 'grading_period', 'student_type', 'invoice_number', 'status',
        'issue_date', 'due_date', 'amount_due', 'amount_paid', 'balance', 'notes', 'schedule_id', 'created_by'
    ];

    protected static $casts = [
        'amount_due' => 'decimal',
        'amount_paid' => 'decimal',
        'balance' => 'decimal'
    ];

    protected static $timestamps = true;
}


