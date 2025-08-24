<?php
// Student Grade Report Template
// This template displays the exact data from the grades table for a specific student
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Grade Report - <?php echo htmlspecialchars(($student['first_name'] ?? '') . ' ' . ($student['last_name'] ?? '')); ?></title>
    <style>
        @media print {
            body {
                margin: 0;
            }

            .no-print {
                display: none !important;
            }
        }

        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            background-color: white;
            color: #000;
            line-height: 1.4;
        }

        .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }

        .report-header {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }

        .header-top {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
        }

        .school-logo {
            max-width: 80px;
            max-height: 60px;
            object-fit: contain;
        }

        .school-info {
            text-align: center;
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

        .report-title {
            font-size: 20px;
            font-weight: bold;
        }

        .report-subtitle {
            font-size: 14px;
        }

        .student-info {
            margin-bottom: 30px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 14px;
        }

        .info-left {
            flex: 0 0 auto;
        }

        .info-right {
            flex: 0 0 auto;
            text-align: left;
        }

        .info-label {
            font-weight: bold;
            margin-right: 10px;
            text-align: left;
            display: inline-block;
        }

        .info-right .info-label {
            text-align: left;
        }

        .info-value {
            min-width: 50px;
            display: inline-block;
            text-align: left;
        }

        .grades-section {
            margin-top: 30px;
        }

        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            text-decoration: underline;
        }

        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
        }

        .grades-table th {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            background-color: #f0f0f0;
        }

        .grades-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }

        .grades-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .no-data {
            text-align: center;
            padding: 40px;
            font-style: italic;
        }

        .report-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #000;
            padding-top: 20px;
        }

        .grade-cell {
            text-align: left;
            font-weight: bold;
        }

        .grades-table th:nth-child(3),
        .grades-table th:nth-child(4),
        .grades-table th:nth-child(5),
        .grades-table th:nth-child(6) {
            width: auto;
            white-space: nowrap;
        }

        .grades-table td:nth-child(3),
        .grades-table td:nth-child(4),
        .grades-table td:nth-child(5),
        .grades-table td:nth-child(6) {
            width: auto;
            white-space: nowrap;
        }

        .school-contact {
            border-top: 1px solid #ddd;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
        }

        .school-contact p {
            margin: 5px 0;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>

<body>
    <div class="report-container">
        <div class="report-header">
            <div class="header-top">
                <?php if (!empty($schoolSettings['application_logo'])): ?>
                    <img src="<?= htmlspecialchars($schoolSettings['application_logo']) ?>" alt="School Logo" class="school-logo">
                <?php endif; ?>
                <div class="school-info">
                    <div class="school-name"><?= htmlspecialchars($schoolSettings['application_name'] ?? 'School Management System') ?></div>
                    <div class="school-tagline"><?= htmlspecialchars($schoolSettings['application_tagline'] ?? 'Excellence in Education') ?></div>
                </div>
            </div>
            <div class="report-title-container">
                <div class="report-title">Student Grade Report</div>
                <div class="report-subtitle">Individual Academic Performance</div>
            </div>
        </div>

        <div class="student-info">
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Student Name:</span>
                    <span class="info-value"><?php echo htmlspecialchars(($student['first_name'] ?? '') . ' ' . ($student['last_name'] ?? '')); ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Student ID:</span>
                    <span class="info-value"><?php echo htmlspecialchars($student['student_id'] ?? 'Unknown'); ?></span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Class:</span>
                    <span class="info-value"><?php echo htmlspecialchars($class['name'] ?? 'Unknown Class'); ?><?php echo !empty($class['section']) ? ' - ' . htmlspecialchars($class['section']) : ''; ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Class Teacher:</span>
                    <span class="info-value"><?php echo htmlspecialchars($teacherName ?? 'Class Teacher'); ?></span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Grading Period:</span>
                    <span class="info-value"><?php echo htmlspecialchars($gradingPeriodName); ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Academic Year:</span>
                    <span class="info-value"><?php echo htmlspecialchars($academicYear ?? 'N/A'); ?></span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Generated Date:</span>
                    <span class="info-value"><?php echo htmlspecialchars($generatedDate); ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Generated Time:</span>
                    <span class="info-value"><?php echo htmlspecialchars($generatedTime); ?></span>
                </div>
            </div>
        </div>

        <div class="grades-section">
            <div class="section-title">
                Subject Grades Summary
            </div>

            <?php if (empty($classSubjects)): ?>
                <div class="no-data">
                    <p>No subjects assigned to this class.</p>
                </div>
            <?php else: ?>
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Subject</th>
                            <th>Assignment Total</th>
                            <th>Exam Total</th>
                            <th>Final %</th>
                            <th>Grade</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($classSubjects as $index => $subject): ?>
                            <?php
                            // Find if there's a grade for this subject
                            $grade = null;
                            foreach ($grades as $g) {
                                if (isset($g['subject_id']) && isset($subject['subject_id']) && $g['subject_id'] == $subject['subject_id']) {
                                    $grade = $g;
                                    break;
                                }
                            }
                            ?>
                            <tr>
                                <td><?php echo $index + 1; ?></td>
                                <td><?php echo htmlspecialchars($subject['subject_name'] ?? $subject['subject_code'] ?? 'N/A'); ?></td>
                                <td class="grade-cell"><?php echo $grade && $grade['assignment_total'] !== null ? number_format($grade['assignment_total'], 2) : '—'; ?></td>
                                <td class="grade-cell"><?php echo $grade && $grade['exam_total'] !== null ? number_format($grade['exam_total'], 2) : '—'; ?></td>
                                <td class="grade-cell"><?php echo $grade && $grade['final_percentage'] !== null ? number_format($grade['final_percentage'], 2) . '%' : '—'; ?></td>
                                <td class="grade-cell"><?php echo $grade ? htmlspecialchars($grade['final_letter_grade'] ?? 'N/A') : 'Not Graded'; ?></td>
                                <td class="grade-cell"><?php echo $grade && !empty($grade['remarks']) ? htmlspecialchars($grade['remarks']) : '—'; ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <div class="school-contact">
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
        </div>

        <div class="report-footer">
            <strong>Generated by:</strong> <?= htmlspecialchars($schoolSettings['application_name'] ?? 'School Management System') ?> | <strong>Report Type:</strong> Student Grade Report
        </div>
    </div>


</body>

</html>