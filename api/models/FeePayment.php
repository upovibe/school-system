<?php

require_once __DIR__ . '/../core/BaseModel.php';

class FeePayment extends BaseModel {
    protected static $table = 'fee_payments';

    protected static $fillable = [
        'invoice_id', 'student_id', 'amount', 'method', 'reference', 'paid_on', 'received_by', 'notes'
    ];

    protected static $casts = [
        'amount' => 'decimal'
    ];

    protected static $timestamps = false; // only created_at present
}


