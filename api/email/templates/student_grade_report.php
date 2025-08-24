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
            body { margin: 0; }
            .no-print { display: none !important; }
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
        
        .student-info {
            margin-bottom: 30px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .info-left {
            flex: 0 0 auto;
        }
        
        .info-right {
            flex: 0 0 auto;
        }
        
        .info-label {
            font-weight: bold;
            margin-right: 10px;
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
            text-align: center;
            font-weight: bold;
            background-color: #f0f0f0;
        }
        
        .grades-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
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
            text-align: center;
            font-weight: bold;
        }
        

    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <div class="school-name">School Management System</div>
            <div class="report-title">Student Grade Report</div>
            <div class="report-subtitle">Individual Academic Performance</div>
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
                    <span class="info-value"><?php echo htmlspecialchars($student['class_name'] ?? 'Unknown Class'); ?><?php echo $student['class_section'] ? ' - ' . htmlspecialchars($student['class_section']) : ''; ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Grading Period:</span>
                    <span class="info-value"><?php echo htmlspecialchars($gradingPeriodName); ?></span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Academic Year:</span>
                    <span class="info-value"><?php echo htmlspecialchars($academicYear ?? 'N/A'); ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label">Generated Date:</span>
                    <span class="info-value"><?php echo $generatedDate; ?></span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-left">
                    <span class="info-label">Generated Time:</span>
                    <span class="info-value"><?php echo $generatedTime; ?></span>
                </div>
                <div class="info-right">
                    <span class="info-label"></span>
                    <span class="info-value"></span>
                </div>
            </div>
        </div>
        
        <div class="grades-section">
            <div class="section-title">
                Subject Grades Summary
            </div>
            
            <?php if (empty($grades)): ?>
                <div class="no-data">
                    <p>No grades available for this student.</p>
                    <p>Grades may not have been recorded yet.</p>
                </div>
            <?php else: ?>
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Subject</th>
                            <th>Period</th>
                            <th>Assignment Total</th>
                            <th>Exam Total</th>
                            <th>Final %</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($grades as $index => $grade): ?>
                            <tr>
                                <td><?php echo $index + 1; ?></td>
                                <td><?php echo htmlspecialchars($grade['subject_name'] ?? 'N/A'); ?></td>
                                <td><?php echo htmlspecialchars($grade['grading_period_name'] ?? 'N/A'); ?></td>
                                <td class="grade-cell"><?php echo $grade['assignment_total'] !== null ? number_format($grade['assignment_total'], 2) : '—'; ?></td>
                                <td class="grade-cell"><?php echo $grade['exam_total'] !== null ? number_format($grade['exam_total'], 2) : '—'; ?></td>
                                <td class="grade-cell"><?php echo $grade['final_percentage'] !== null ? number_format($grade['final_percentage'], 2) . '%' : '—'; ?></td>
                                <td class="grade-cell"><?php echo htmlspecialchars($grade['final_letter_grade'] ?? 'N/A'); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        
        <div class="report-footer">
            <strong>Generated by:</strong> School Management System | <strong>Report Type:</strong> Student Grade Report
        </div>
    </div>
    

</body>
</html>
