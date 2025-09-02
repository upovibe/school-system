<?php
// Student Terminal Report Template
// This template displays the student's grades across all subjects for a specific grading period
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Terminal Report - <?php echo htmlspecialchars($student['first_name'] . ' ' . $student['last_name']); ?></title>
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

        .student-name {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
        }

        .report-info {
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

        .no-data-cell {
            text-align: center;
            padding: 20px;
            font-style: italic;
            color: #666;
            vertical-align: middle;
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
                <div class="report-title">Student Terminal Report</div>
                <div class="report-subtitle">Academic Performance Overview</div>
            </div>
        </div>

        <div class="student-name">
            <?= htmlspecialchars($student['first_name'] . ' ' . $student['last_name']) ?>
        </div>

        <div class="report-info">
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Student ID:</span>
                    <span class="info-value"><?php echo htmlspecialchars($student['student_id'] ?? 'N/A'); ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Class:</span>
                    <span class="info-value"><?php echo htmlspecialchars($class['name'] . ' (' . $class['section'] . ')'); ?></span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Class Teacher:</span>
                    <span class="info-value"><?php echo htmlspecialchars($teacherName); ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Total Subjects:</span>
                    <span class="info-value"><?php echo count($classSubjects); ?></span>
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
                    <span class="info-value"><?php echo date('F j, Y'); ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Generated Time:</span>
                    <span class="info-value"><?php echo date('g:i A'); ?></span>
                </div>
            </div>
        </div>

        <div class="grades-section">
            <div class="section-title">
                Academic Performance Summary
            </div>

            <table class="grades-table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Subject</th>
                        <th>Assignment Total</th>
                        <th>Exam Total</th>
                        <th>Final %</th>
                        <th>Letter Grade</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($classSubjects)): ?>
                        <tr>
                            <td colspan="7" class="no-data-cell">No subjects available for this class.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($classSubjects as $index => $subject): ?>
                            <?php
                            // Find grade for this subject
                            $subjectId = $subject['subject_id'];
                            $grade = null;
                            
                            foreach ($grades as $g) {
                                if ($g['subject_id'] == $subjectId) {
                                    $grade = $g;
                                    break;
                                }
                            }
                            ?>
                            <tr>
                                <td><?php echo $index + 1; ?></td>
                                <td><?php echo htmlspecialchars($subject['subject_name'] ?? $subject['subject_code']); ?></td>
                                <td class="grade-cell"><?php echo $grade && $grade['assignment_total'] !== null ? number_format($grade['assignment_total'], 2) : '—'; ?></td>
                                <td class="grade-cell"><?php echo $grade && $grade['exam_total'] !== null ? number_format($grade['exam_total'], 2) : '—'; ?></td>
                                <td class="grade-cell"><?php echo $grade && $grade['final_percentage'] !== null ? number_format($grade['final_percentage'], 2) . '%' : '—'; ?></td>
                                <td class="grade-cell"><?php echo $grade && $grade['final_letter_grade'] ? htmlspecialchars($grade['final_letter_grade']) : 'Not Graded'; ?></td>
                                <td><?php echo htmlspecialchars($grade['remarks'] ?? ''); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <div class="report-footer">
            <strong>Generated by:</strong> <?= htmlspecialchars($schoolSettings['application_name'] ?? 'School Management System') ?> | <strong>Report Type:</strong> Student Terminal Report
        </div>
    </div>
</body>

</html>
