<?php
// Class Grade Report Template
// This template displays the exact data from the grades table
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Class Grade Report - <?php echo htmlspecialchars($class['name'] ?? 'Unknown Class'); ?></title>
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
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }

        .school-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .report-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .report-subtitle {
            font-size: 14px;
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

        .no-data-cell {
            text-align: center;
            padding: 20px;
            font-style: italic;
            color: #666;
            vertical-align: middle;
            text-align: center;
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
            <div class="school-name">School Management System</div>
            <div class="report-title">Class Grade Report</div>
            <div class="report-subtitle">Academic Performance Overview</div>
        </div>

        <div class="report-info">
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Class:</span>
                    <span class="info-value"><?php echo htmlspecialchars($class['name'] ?? 'Unknown Class'); ?><?php echo $class['section'] ? ' - ' . htmlspecialchars($class['section']) : ''; ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Teacher:</span>
                    <span class="info-value"><?php echo htmlspecialchars($teacherName); ?></span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Subject:</span>
                    <span class="info-value"><?php echo htmlspecialchars($subjectName ?? 'All Subjects'); ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Total Students:</span>
                    <span class="info-value"><?php echo count($students); ?></span>
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
                    <span class="info-value"><?php echo $generatedDate; ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Generated Time:</span>
                    <span class="info-value"><?php echo $generatedTime; ?></span>
                </div>
            </div>
        </div>

        <div class="grades-section">
            <div class="section-title">
                Student Grades Summary
            </div>

            <table class="grades-table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Subject</th>
                        <th>Period</th>
                        <th>Assignment Total</th>
                        <th>Exam Total</th>
                        <th>Final %</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($students)): ?>
                        <tr>
                            <td colspan="9" class="no-data-cell">No students available in this class.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($students as $index => $student): ?>
                            <?php
                            // Find grade for this student
                            $studentGrade = null;
                            foreach ($grades as $grade) {
                                if ($grade['student_number'] === $student['id']) {
                                    $studentGrade = $grade;
                                    break;
                                }
                            }
                            ?>
                            <tr>
                                <td><?php echo $index + 1; ?></td>
                                <td><?php echo htmlspecialchars($student['student_id'] ?? 'N/A'); ?></td>
                                <td><?php echo htmlspecialchars(($student['first_name'] ?? '') . ' ' . ($student['last_name'] ?? '')); ?></td>
                                <td><?php echo htmlspecialchars($subjectName ?? 'All Subjects'); ?></td>
                                <td><?php echo htmlspecialchars($gradingPeriodName); ?></td>
                                <td class="grade-cell"><?php echo $studentGrade && $studentGrade['assignment_total'] !== null ? number_format($studentGrade['assignment_total'], 2) : '—'; ?></td>
                                <td class="grade-cell"><?php echo $studentGrade && $studentGrade['exam_total'] !== null ? number_format($studentGrade['exam_total'], 2) : '—'; ?></td>
                                <td class="grade-cell"><?php echo $studentGrade && $studentGrade['final_percentage'] !== null ? number_format($studentGrade['final_percentage'], 2) . '%' : '—'; ?></td>
                                <td class="grade-cell"><?php echo $studentGrade && $studentGrade['final_letter_grade'] ? htmlspecialchars($studentGrade['final_letter_grade']) : 'Not Graded'; ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <div class="report-footer">
            <strong>Generated by:</strong> School Management System | <strong>Report Type:</strong> Class Grade Report
        </div>
    </div>


</body>

</html>