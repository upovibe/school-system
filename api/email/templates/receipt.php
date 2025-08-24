<?php
// api/email/templates/receipt.php - Receipt template
// Variables expected in scope:
// $receipt, $isVoided, $studentName, $schoolSettings
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt <?= htmlspecialchars($receipt['receipt_number']) ?></title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .receipt { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .header-top { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
        .school-logo { max-width: 120px; max-height: 80px; object-fit: contain; }
        .school-info { text-align: center; }
        .school-name { font-size: 24px; font-weight: bold; color: #333; margin: 0 0 5px 0; }
        .school-tagline { font-size: 14px; color: #666; margin: 0; font-style: italic; }
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
        <div class="header">
            <div class="header-top">
                <?php if (!empty($schoolSettings['application_logo'])): ?>
                    <img src="<?= htmlspecialchars($schoolSettings['application_logo']) ?>" alt="School Logo" class="school-logo">
                <?php endif; ?>
                <div class="school-info">
                    <div class="school-name"><?= htmlspecialchars($schoolSettings['application_name'] ?? 'SCHOOL SYSTEM') ?></div>
                    <div class="school-tagline"><?= htmlspecialchars($schoolSettings['application_tagline'] ?? 'Excellence in Education') ?></div>
                </div>
            </div>
            <div class="receipt-title">OFFICIAL RECEIPT</div>
            <div class="receipt-number"><?= htmlspecialchars($receipt['receipt_number']) ?></div>
        </div>

        <?php if ($isVoided): ?>
            <div class="voided-banner">⚠️ THIS RECEIPT IS VOIDED</div>
        <?php endif; ?>

        <div class="section">
            <div class="section-title">Student Information</div>
            <div class="grid">
                <div class="field">
                    <div class="label">Student Name</div>
                    <div class="value"><?= htmlspecialchars($studentName) ?></div>
                </div>
                <div class="field">
                    <div class="label">Student ID</div>
                    <div class="value"><?= htmlspecialchars($receipt['student_number'] ?? 'N/A') ?></div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="grid">
                <div class="field">
                    <div class="label">Invoice Number</div>
                    <div class="value"><?= htmlspecialchars($receipt['invoice_number'] ?? 'N/A') ?></div>
                </div>
                <div class="field">
                    <div class="label">Grading Period & Academic Year</div>
                    <div class="value"><?= htmlspecialchars(($receipt['grading_period'] ?? '') . ' ' . ($receipt['academic_year'] ?? '')) ?></div>
                </div>
                <div class="field">
                    <div class="label">Payment Method</div>
                    <div class="value"><?= htmlspecialchars($receipt['method'] ?? 'N/A') ?></div>
                </div>
                <div class="field">
                    <div class="label">Reference</div>
                    <div class="value"><?= htmlspecialchars($receipt['reference'] ?? 'N/A') ?></div>
                </div>
                <div class="field">
                    <div class="label">Amount Paid</div>
                    <div class="value amount">₵<?= number_format((float)($receipt['amount'] ?? 0), 2) ?></div>
                </div>
                <div class="field">
                    <div class="label">Balance After Payment</div>
                    <div class="value">₵<?= number_format((float)($receipt['balance'] ?? 0), 2) ?></div>
                </div>
                <div class="field">
                    <div class="label">Payment Date</div>
                    <div class="value"><?= htmlspecialchars(date('d M Y', strtotime($receipt['paid_on']))) ?></div>
                </div>
                <div class="field">
                    <div class="label">Receipt Generated</div>
                    <div class="value"><?= htmlspecialchars(date('d M Y H:i', strtotime($receipt['created_at']))) ?></div>
                </div>
            </div>
        </div>

        <?php if ($isVoided): ?>
            <div class="section">
                <div class="section-title">Void Information</div>
                <div class="grid">
                    <div class="field">
                        <div class="label">Voided On</div>
                        <div class="value"><?= htmlspecialchars(date('d M Y H:i', strtotime($receipt['voided_at']))) ?></div>
                    </div>
                    <div class="field">
                        <div class="label">Voided By</div>
                        <div class="value"><?= htmlspecialchars($receipt['voided_by_name'] ?? 'N/A') ?></div>
                    </div>
                    <div class="field" style="grid-column: 1 / -1;">
                        <div class="label">Reason</div>
                        <div class="value"><?= htmlspecialchars($receipt['void_reason'] ?? 'N/A') ?></div>
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($receipt['notes'])): ?>
            <div class="section">
                <div class="section-title">Notes</div>
                <div class="value"><?= htmlspecialchars($receipt['notes']) ?></div>
            </div>
        <?php endif; ?>

        <div class="footer">
            <div class="school-contact">
                <p><strong><?= htmlspecialchars($schoolSettings['application_name'] ?? 'School System') ?></strong></p>
                <?php if (!empty($schoolSettings['contact_address'])): ?>
                    <p><?= htmlspecialchars($schoolSettings['contact_address']) ?></p>
                <?php endif; ?>
                <?php if (!empty($schoolSettings['contact_phone'])): ?>
                    <p>Phone: <?= htmlspecialchars($schoolSettings['contact_phone']) ?></p>
                <?php endif; ?>
                <?php if (!empty($schoolSettings['contact_email'])): ?>
                    <p>Email: <?= htmlspecialchars($schoolSettings['contact_email']) ?></p>
                <?php endif; ?>
                <?php if (!empty($schoolSettings['contact_website'])): ?>
                    <p>Website: <?= htmlspecialchars($schoolSettings['contact_website']) ?></p>
                <?php endif; ?>
                <p>Generated on <?= date('d M Y H:i:s') ?></p>
            </div>
        </div>
    </div>
</body>
</html>
