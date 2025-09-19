<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admission Approval Letter - <?= htmlspecialchars($schoolName) ?></title>
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
        }
        .school-logo {
            max-width: 80px;
            max-height: 60px;
            object-fit: contain;
        }
        .school-info {
            text-align: right;
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
        .approval-notice {
            text-align: center;
            margin: 20px 0;
            padding: 10px 0;
        }
        .approval-text {
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
        .next-steps {
            margin: 20px 0;
        }
        .next-steps h4 {
            font-size: 16px;
            margin: 15px 0 10px 0;
            text-decoration: underline;
        }
        .next-steps ol {
            margin: 0;
            padding-left: 20px;
        }
        .next-steps li {
            margin-bottom: 8px;
        }
        .important-notice {
            margin: 20px 0;
        }
        .important-notice h4 {
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
            <img src="<?= htmlspecialchars($schoolSettings['application_logo'] ?? '') ?>" alt="School Logo" class="school-logo">
            <div class="school-info">
                <div class="school-name"><?= htmlspecialchars($schoolName) ?></div>
                <div class="school-tagline">Excellence in Education</div>
            </div>
        </div>

        <!-- Letter Title -->
        <div class="letter-title">ADMISSION APPROVAL LETTER</div>

        <!-- Letter Content -->
        <div class="letter-content">
            <div class="date-line">
                <strong>Date:</strong> <?= date('F j, Y') ?>
            </div>

            <div class="greeting">
                Dear <?= htmlspecialchars($parentName) ?>,
            </div>

            <div class="content-paragraph">
                We are pleased to inform you that after careful consideration of your child's application, we are delighted to offer admission to <strong><?= htmlspecialchars($studentName) ?></strong> for the <strong><?= htmlspecialchars($academicYear) ?></strong> academic year.
            </div>

            <div class="approval-notice">
                <div class="approval-text">ADMISSION APPROVED</div>
            </div>

            <div class="application-details">
                <h4 style="margin: 0 0 15px 0; text-decoration: underline;">Application Details</h4>
                <table class="details-table">
                    <tr>
                        <td class="label">Student Name:</td>
                        <td><?= htmlspecialchars($studentName) ?></td>
                    </tr>
                    <tr>
                        <td class="label">Application Number:</td>
                        <td><strong><?= htmlspecialchars($applicantNumber) ?></strong></td>
                    </tr>
                    <tr>
                        <td class="label">Level:</td>
                        <td><?= htmlspecialchars($level) ?></td>
                    </tr>
                    <tr>
                        <td class="label">Class:</td>
                        <td><?= htmlspecialchars($class) ?></td>
                    </tr>
                    <?php if (!empty($programme)): ?>
                    <tr>
                        <td class="label">Programme:</td>
                        <td><?= htmlspecialchars($programme) ?></td>
                    </tr>
                    <?php endif; ?>
                    <tr>
                        <td class="label">School Type:</td>
                        <td><?= htmlspecialchars($schoolType) ?></td>
                    </tr>
                </table>
            </div>

            <div class="next-steps">
                <h4>Next Steps for Enrollment:</h4>
                <ol>
                    <li>Contact the school office within <strong>7 days</strong> to confirm your acceptance of this offer</li>
                    <li>Submit the following required documents:
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            <li>Original birth certificate</li>
                            <li>Previous school reports/transcripts</li>
                            <li>Two recent passport photographs</li>
                            <li>Medical certificate (if required)</li>
                        </ul>
                    </li>
                    <li>Complete the enrollment form and pay the required fees</li>
                    <li>Attend the orientation session (date and time will be communicated)</li>
                </ol>
            </div>

            <div class="important-notice">
                <h4>Important Information:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>This admission is valid for the <strong><?= htmlspecialchars($academicYear) ?></strong> academic year only</li>
                    <li>Failure to complete enrollment within 7 days may result in forfeiture of this admission</li>
                    <li>Please bring this letter when visiting the school office</li>
                    <li>All fees must be paid before the commencement of classes</li>
                </ul>
            </div>

            <div class="content-paragraph">
                We look forward to welcoming your child to our school community and supporting their educational journey. Our dedicated staff is committed to providing quality education and fostering academic excellence.
            </div>

            <div class="closing">
                <p>Congratulations on this achievement!</p>
                
                <div class="signature-line">
                    <p><strong>The Admissions Committee</strong><br>
                    <?= htmlspecialchars($schoolName) ?></p>
                </div>
            </div>
        </div>

        <div class="letter-footer">
            <p><strong>This is an official admission letter. Please keep it safe for your records.</strong></p>
            <p>For inquiries, please contact the school office directly.</p>
        </div>
    </div>
</body>
</html>
