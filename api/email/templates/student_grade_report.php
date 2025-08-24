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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        
        .report-container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .report-header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .school-logo {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
        }
        
        .school-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .report-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .report-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .student-info {
            background: #f8f9fa;
            padding: 25px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .student-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .student-photo {
            width: 120px;
            height: 120px;
            background: #e9ecef;
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: #6c757d;
            border: 4px solid #dee2e6;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #495057;
        }
        
        .student-name-large {
            font-size: 24px;
            font-weight: 700;
            color: #212529;
            text-align: center;
            margin-bottom: 10px;
        }
        
        .student-id-large {
            font-size: 18px;
            color: #6c757d;
            text-align: center;
            font-family: 'Courier New', monospace;
        }
        
        .grades-section {
            padding: 25px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #495057;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
        
        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 14px;
        }
        
        .grades-table th {
            background: #f8f9fa;
            color: #495057;
            font-weight: 600;
            text-align: left;
            padding: 12px 15px;
            border: 1px solid #dee2e6;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .grades-table td {
            padding: 12px 15px;
            border: 1px solid #dee2e6;
            vertical-align: middle;
        }
        
        .grades-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .grades-table tbody tr:hover {
            background-color: #e9ecef;
        }
        
        .performance-summary {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
            border-left: 4px solid #1976d2;
        }
        
        .summary-title {
            font-size: 18px;
            font-weight: 600;
            color: #1976d2;
            margin-bottom: 15px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-value {
            font-size: 24px;
            font-weight: 700;
            color: #1976d2;
            margin-bottom: 5px;
        }
        
        .summary-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .report-footer {
            background: #f8f9fa;
            padding: 20px 25px;
            border-top: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            color: #6c757d;
        }
        
        .print-button {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        
        .print-button:hover {
            background: #218838;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            font-style: italic;
        }
        
        @media (max-width: 768px) {
            .student-details {
                grid-template-columns: 1fr;
            }
            
            .grades-table {
                font-size: 12px;
            }
            
            .grades-table th,
            .grades-table td {
                padding: 8px 10px;
            }
            
            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Report Header -->
        <div class="report-header">
            <div class="school-logo">S</div>
            <div class="school-name">School Management System</div>
            <div class="report-title">Student Grade Report</div>
            <div class="report-subtitle">Individual Academic Performance</div>
        </div>
        
        <!-- Student Information -->
        <div class="student-info">
            <div class="student-photo">
                <i class="fas fa-user-graduate"></i>
            </div>
            <div class="student-name-large"><?php echo htmlspecialchars(($student['first_name'] ?? '') . ' ' . ($student['last_name'] ?? '')); ?></div>
            <div class="student-id-large"><?php echo htmlspecialchars($student['student_number'] ?? 'Unknown'); ?></div>
            
            <div class="student-details">
                <div class="info-item">
                    <div class="info-label">Class</div>
                    <div class="info-value"><?php echo htmlspecialchars($student['class_name'] ?? 'Unknown Class'); ?><?php echo !empty($student['class_section']) ? ' - ' . htmlspecialchars($student['class_section']) : ''; ?></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Grading Period</div>
                    <div class="info-value"><?php echo htmlspecialchars($gradingPeriodName); ?></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Generated Date</div>
                    <div class="info-value"><?php echo $generatedDate; ?></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Generated Time</div>
                    <div class="info-value"><?php echo $generatedTime; ?></div>
                </div>
            </div>
        </div>
        
        <!-- Grades Section -->
        <div class="grades-section">
            <div class="section-title">
                <i class="fas fa-chart-bar"></i>
                Subject Grades Breakdown
            </div>
            
            <?php if (empty($grades) || count($grades) === 0): ?>
                <div class="no-data">
                    <p>No grades available for this student.</p>
                    <p>Grades may not have been recorded yet.</p>
                </div>
            <?php else: ?>
                <!-- Display the exact grades data from the table -->
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Subject</th>
                            <th>Class</th>
                            <th>Grading Period</th>
                            <th>Assignment Total</th>
                            <th>Exam Total</th>
                            <th>Final Percentage</th>
                            <th>Letter Grade</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($grades as $grade): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($grade['id'] ?? ''); ?></td>
                                <td><?php echo htmlspecialchars($grade['subject_name'] ?? ''); ?></td>
                                <td><?php echo htmlspecialchars($grade['class_name'] ?? '') . ' (' . htmlspecialchars($grade['class_section'] ?? '') . ')'; ?></td>
                                <td><?php echo htmlspecialchars($grade['grading_period_name'] ?? ''); ?></td>
                                <td><?php echo isset($grade['assignment_total']) ? number_format($grade['assignment_total'], 2) : '—'; ?></td>
                                <td><?php echo isset($grade['exam_total']) ? number_format($grade['exam_total'], 2) : '—'; ?></td>
                                <td><?php echo isset($grade['final_percentage']) ? number_format($grade['final_percentage'], 2) . '%' : '—'; ?></td>
                                <td><?php echo htmlspecialchars($grade['final_letter_grade'] ?? 'Not Graded'); ?></td>
                                <td><?php echo isset($grade['created_at']) ? date('m/d/Y', strtotime($grade['created_at'])) : ''; ?></td>
                                <td><?php echo htmlspecialchars($grade['remarks'] ?? 'Pending'); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <!-- Performance Summary -->
                <div class="performance-summary">
                    <div class="summary-title">
                        <i class="fas fa-chart-pie"></i>
                        Performance Summary
                    </div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-value" id="total-subjects">-</div>
                            <div class="summary-label">Total Subjects</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value" id="average-score">-</div>
                            <div class="summary-label">Average Score</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value" id="highest-score">-</div>
                            <div class="summary-label">Highest Score</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value" id="lowest-score">-</div>
                            <div class="summary-label">Lowest Score</div>
                        </div>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        
        <!-- Report Footer -->
        <div class="report-footer">
            <div>
                <strong>Generated by:</strong> School Management System<br>
                <strong>Report Type:</strong> Student Grade Report<br>
                <strong>Student:</strong> <?php echo htmlspecialchars(($student['first_name'] ?? '') . ' ' . ($student['last_name'] ?? '')); ?>
            </div>
            <div class="no-print">
                <button class="print-button" onclick="window.print()">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
        </div>
    </div>
    
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    
    <script>
        // Calculate and display performance summary
        document.addEventListener('DOMContentLoaded', function() {
            const gradeRows = document.querySelectorAll('.grades-table tbody tr');
            if (gradeRows.length > 0) {
                let totalScore = 0;
                let validScores = 0;
                let scores = [];
                
                gradeRows.forEach(row => {
                    const finalScoreCell = row.querySelector('td:nth-child(7)'); // Final Percentage column
                    if (finalScoreCell) {
                        const scoreText = finalScoreCell.textContent.replace('%', '');
                        const score = parseFloat(scoreText);
                        if (!isNaN(score)) {
                            totalScore += score;
                            validScores++;
                            scores.push(score);
                        }
                    }
                });
                
                if (validScores > 0) {
                    const average = totalScore / validScores;
                    const highest = Math.max(...scores);
                    const lowest = Math.min(...scores);
                    
                    document.getElementById('total-subjects').textContent = validScores;
                    document.getElementById('average-score').textContent = average.toFixed(1) + '%';
                    document.getElementById('highest-score').textContent = highest.toFixed(1) + '%';
                    document.getElementById('lowest-score').textContent = lowest.toFixed(1) + '%';
                }
            }
        });
    </script>
</body>
</html>
