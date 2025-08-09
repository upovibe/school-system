<?php

require_once __DIR__ . '/../core/BaseModel.php';

class FeeSchedule extends BaseModel {
    protected static $table = 'fee_schedules';

    protected static $fillable = [
        'class_id', 'academic_year', 'term', 'student_type', 'total_fee', 'notes', 'is_active'
    ];

    protected static $casts = [
        'total_fee' => 'decimal',
        'is_active' => 'bool'
    ];

    protected static $timestamps = true;
}


