<?php

require_once __DIR__ . '/../core/BaseModel.php';

class FeeReceipt extends BaseModel {
    protected static $table = 'fee_receipts';

    protected static $fillable = [
        'payment_id', 'receipt_number', 'printed_on'
    ];

    protected static $timestamps = false; // created_at only
}


