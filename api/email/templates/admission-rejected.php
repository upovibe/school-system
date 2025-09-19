<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admission Decision Letter - <?= htmlspecialchars($schoolName) ?></title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            background-color: white;
            color: #000;
            line-height: 1.6;
        }
        .letter-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        .letter-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            width: 100%;
        }
        .school-logo {
            max-width: 80px;
            max-height: 60px;
            object-fit: contain;
            flex-shrink: 0;
        }
        .school-info {
            text-align: right;
            flex-grow: 1;
            margin-left: 20px;
        }
        .school-name {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .school-tagline {
            font-size: 14px;
            color: #666;
            margin: 0;
            font-style: italic;
        }
        .letter-title {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            text-decoration: underline;
        }
        .letter-content {
            font-size: 14px;
            line-height: 1.8;
        }
        .date-line {
            text-align: right;
            margin-bottom: 20px;
        }
        .greeting {
            margin-bottom: 20px;
        }
        .content-paragraph {
            margin-bottom: 15px;
            text-align: justify;
        }
        .decision-notice {
            text-align: center;
            margin: 20px 0;
            padding: 10px 0;
        }
        .decision-text {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin: 0;
            text-decoration: underline;
        }
        .application-details {
            margin: 20px 0;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
        }
        .details-table td {
            padding: 1px 0;
            border: none;
            vertical-align: top;
        }
        .details-table .label {
            font-weight: bold;
            width: 25%;
            padding-right: 10px;
        }
        .decision-explanation {
            margin: 20px 0;
        }
        .decision-explanation h4 {
            font-size: 16px;
            margin: 15px 0 10px 0;
            text-decoration: underline;
        }
        .decision-explanation ul {
            margin: 0;
            padding-left: 20px;
        }
        .decision-explanation li {
            margin-bottom: 8px;
        }
        .contact-info {
            margin: 20px 0;
        }
        .contact-info h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            text-decoration: underline;
        }
        .closing {
            margin-top: 30px;
        }
        .signature-line {
            margin-top: 40px;
            text-align: right;
        }
        .letter-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #000;
            padding-top: 15px;
        }
    </style>
</head>
<body>
    <div class="letter-container">
        <!-- Letter Header -->
        <div class="letter-header">
            <?php if (!empty($schoolSettings['application_logo'])): ?>
            <img src="<?= htmlspecialchars($schoolSettings['application_logo']) ?>" alt="School Logo" class="school-logo">
            <?php else: ?>
            <div class="school-logo"></div>
            <?php endif; ?>
            <div class="school-info">
                <div class="school-name"><?= htmlspecialchars($schoolName) ?></div>
                <div class="school-tagline">Excellence in Education</div>
            </div>
        </div>

        <!-- Letter Title -->
        <div class="letter-title">ADMISSION DECISION LETTER</div>

        <!-- Letter Content -->
        <div class="letter-content">
            <div class="date-line">
                <strong>Date:</strong> <?= date('F j, Y') ?>
            </div>

            <div class="greeting">
                Dear <?= htmlspecialchars($parentName) ?>,
            </div>

            <div class="content-paragraph">
                Thank you for your interest in <strong><?= htmlspecialchars($schoolName) ?></strong> and for taking the time to submit an application for your child, <strong><?= htmlspecialchars($studentName) ?></strong>. After careful consideration of all applications received for the <strong><?= htmlspecialchars($academicYear) ?></strong> academic year, we regret to inform you that we are unable to offer admission to your child at this time. Your application for <strong><?= htmlspecialchars($level) ?> - <?= htmlspecialchars($class) ?></strong><?= !empty($programme) ? ' in the <strong>' . htmlspecialchars($programme) . '</strong> programme' : '' ?> was not successful.
            </div>

            <div class="decision-explanation">
                <h4>Decision Information:</h4>
                <ul>
                    <li>This decision was made after careful review of all applications received</li>
                    <li>The number of qualified applicants exceeded the available spaces for this academic year</li>
                    <li>This decision is final for the <strong><?= htmlspecialchars($academicYear) ?></strong> academic year</li>
                </ul>
            </div>

            <div class="contact-info">
                <h4>Questions or Concerns:</h4>
                <p style="margin: 0;">
                    If you have any questions about this decision or would like to discuss your child's educational options, please don't hesitate to contact our admissions office. We are here to help and support families in finding the best educational path for their children.
                </p>
            </div>

            <div class="content-paragraph">
                We appreciate your interest in our school and wish your child every success in their educational journey. Thank you for considering <strong><?= htmlspecialchars($schoolName) ?></strong>.
            </div>

            <div class="closing">
                <div class="signature-line">
                    <p><strong>The Admissions Committee</strong><br>
                    <?= htmlspecialchars($schoolName) ?></p>
                </div>
            </div>
        </div>

        <div class="letter-footer">
            <p><strong>This is an official communication. Please keep it for your records.</strong></p>
            <p>For inquiries, please contact the school office directly.</p>
        </div>
    </div>
</body>
</html>
