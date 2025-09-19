<?php
// api/controllers/AcademicYearRecordController.php - Controller for viewing archived academic year records

require_once __DIR__ . '/../models/AcademicYearRecordModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class AcademicYearRecordController {
    private $pdo;
    private $academicYearRecordModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->academicYearRecordModel = new AcademicYearRecordModel($pdo);
    }

    /**
     * Get all archived records (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecords = $this->academicYearRecordModel->findAllWithUserInfo();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $archivedRecords,
                'message' => 'Archived records retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving archived records: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get archived records by academic year ID (admin only)
     */
    public function getByAcademicYear($academicYearId) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecords = $this->academicYearRecordModel->getByAcademicYear($academicYearId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $archivedRecords,
                'message' => 'Archived records for academic year retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving archived records: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get archived records by year code (admin only)
     */
    public function getByYearCode($yearCode) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecords = $this->academicYearRecordModel->getByYearCode($yearCode);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $archivedRecords,
                'message' => 'Archived records for year code retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving archived records: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a single archived record by ID (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecord = $this->academicYearRecordModel->findById($id);
            
            if (!$archivedRecord) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Archived record not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $archivedRecord,
                'message' => 'Archived record retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving archived record: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Export archived record data (admin only)
     */
    public function export($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $archivedRecord = $this->academicYearRecordModel->findById($id);
            
            if (!$archivedRecord) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Archived record not found'
                ]);
                return;
            }

            // Decode the JSON data
            $recordData = json_decode($archivedRecord['record_data'], true);
            
            // Prepare export data
            $exportData = [
                'archive_info' => [
                    'id' => $archivedRecord['id'],
                    'year_code' => $archivedRecord['year_code'],
                    'archive_date' => $archivedRecord['archive_date'],
                    'total_records' => $archivedRecord['total_records'],
                    'notes' => $archivedRecord['notes']
                ],
                'data' => $recordData
            ];
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $exportData,
                'message' => 'Archived record exported successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error exporting archived record: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search archived records (admin only)
     */
    public function search() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $input = json_decode(file_get_contents('php://input'), true);
            
            $searchTerm = $input['search'] ?? '';
            $yearCode = $input['year_code'] ?? '';
            $recordType = $input['record_type'] ?? '';
            
            // Build search query
            $whereConditions = [];
            $params = [];
            
            if (!empty($searchTerm)) {
                $whereConditions[] = "notes LIKE ?";
                $params[] = "%$searchTerm%";
            }
            
            if (!empty($yearCode)) {
                $whereConditions[] = "year_code = ?";
                $params[] = $yearCode;
            }
            
            if (!empty($recordType)) {
                $whereConditions[] = "record_type = ?";
                $params[] = $recordType;
            }
            
            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
            
            $sql = "SELECT * FROM academic_year_records $whereClause ORDER BY archive_date DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $results,
                'message' => 'Search completed successfully',
                'total_results' => count($results)
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching archived records: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Print academic year record (admin only)
     */
    public function print($id) {
        try {
            global $pdo;
            // Allow both admin and teacher roles (following the same pattern as StudentGradeController)
            $currentUserId = $this->getCurrentUserId();
            $isAdmin = $this->isCurrentUserAdmin();
            
            if (!$isAdmin) {
                RoleMiddleware::requireTeacher($pdo);
            }

            $archivedRecord = $this->academicYearRecordModel->findById($id);
            
            if (!$archivedRecord) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Archived record not found'
                ]);
                return;
            }

            // Get the record data (it might already be an array or a JSON string)
            $recordData = $archivedRecord['record_data'];
            if (is_string($recordData)) {
                $recordData = json_decode($recordData, true);
            }
            
            // Get school settings for header
            $schoolSettings = $this->getSchoolSettings();
            
            // Generate print HTML
            $printHTML = $this->generatePrintHTML($archivedRecord, $recordData, $schoolSettings);
            
            // Set content type to HTML
            header('Content-Type: text/html; charset=UTF-8');
            echo $printHTML;
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error generating print view: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get school settings for print header
     */
    private function getSchoolSettings() {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM school_settings LIMIT 1");
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Generate print HTML for academic year record
     */
    private function generatePrintHTML($archivedRecord, $recordData, $schoolSettings) {
        $schoolName = $schoolSettings['school_name'] ?? 'School Name';
        $schoolTagline = $schoolSettings['school_tagline'] ?? 'Excellence in Education';
        $schoolLogo = $schoolSettings['school_logo'] ?? '';
        
        $yearCode = $archivedRecord['year_code'];
        $archiveDate = date('F j, Y', strtotime($archivedRecord['archive_date']));
        $archivedBy = $archivedRecord['archived_by_name'] ?? 'System';
        $totalRecords = $archivedRecord['total_records'];
        $notes = $archivedRecord['notes'] ?? '';
        
        // Format record type
        $recordType = ucwords(str_replace('_', ' ', $archivedRecord['record_type']));
        
        // Get summary data
        $summary = $recordData['summary'] ?? [];
        $classes = $recordData['classes'] ?? [];
        $students = $recordData['students'] ?? [];
        $teachers = $recordData['teachers'] ?? [];
        $subjects = $recordData['subjects'] ?? [];
        $grades = $recordData['grades'] ?? [];
        $fees = $recordData['fees'] ?? [];
        $gradingPeriods = $recordData['grading_periods'] ?? [];
        
        ob_start();
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Academic Year Record - <?php echo htmlspecialchars($yearCode); ?></title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    line-height: 1.6;
                    color: #333;
                }
                .print-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 20px;
                }
                .school-logo {
                    max-width: 80px;
                    max-height: 60px;
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
                .title {
                    font-size: 20px;
                    font-weight: bold;
                    text-align: center;
                    margin: 30px 0;
                    text-decoration: underline;
                }
                .record-info {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .info-item {
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #007bff;
                }
                .info-label {
                    font-weight: bold;
                    color: #666;
                    font-size: 12px;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .info-value {
                    font-size: 16px;
                    color: #333;
                }
                .summary-section {
                    margin-bottom: 30px;
                }
                .summary-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #333;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 5px;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                }
                .summary-item {
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px;
                    border: 1px solid #dee2e6;
                }
                .summary-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                    margin-bottom: 5px;
                }
                .summary-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                }
                .details-section {
                    margin-bottom: 30px;
                }
                .details-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #333;
                    border-bottom: 2px solid #28a745;
                    padding-bottom: 5px;
                }
                .details-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .details-table th,
                .details-table td {
                    border: 1px solid #dee2e6;
                    padding: 12px;
                    text-align: left;
                }
                .details-table th {
                    background: #f8f9fa;
                    font-weight: bold;
                    color: #333;
                }
                .details-table tr:nth-child(even) {
                    background: #f8f9fa;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #dee2e6;
                    padding-top: 20px;
                }
                @media print {
                    body { margin: 0; padding: 15px; }
                    .print-header { page-break-inside: avoid; }
                    .summary-section { page-break-inside: avoid; }
                    .details-section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <!-- Header -->
            <div class="print-header">
                <div class="school-logo">
                    <?php if ($schoolLogo): ?>
                        <img src="<?php echo htmlspecialchars($schoolLogo); ?>" alt="School Logo" class="school-logo">
                    <?php else: ?>
                        <div class="school-logo" style="width: 80px; height: 60px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">LOGO</div>
                    <?php endif; ?>
                </div>
                <div class="school-info">
                    <div class="school-name"><?php echo htmlspecialchars($schoolName); ?></div>
                    <div class="school-tagline"><?php echo htmlspecialchars($schoolTagline); ?></div>
                </div>
            </div>

            <!-- Title -->
            <div class="title">ACADEMIC YEAR RECORD</div>

            <!-- Record Information -->
            <div class="record-info">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Year Code</div>
                        <div class="info-value"><?php echo htmlspecialchars($yearCode); ?></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Record Type</div>
                        <div class="info-value"><?php echo htmlspecialchars($recordType); ?></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Total Records</div>
                        <div class="info-value"><?php echo number_format($totalRecords); ?></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Archive Date</div>
                        <div class="info-value"><?php echo htmlspecialchars($archiveDate); ?></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Archived By</div>
                        <div class="info-value"><?php echo htmlspecialchars($archivedBy); ?></div>
                    </div>
                    <?php if ($notes): ?>
                    <div class="info-item">
                        <div class="info-label">Notes</div>
                        <div class="info-value"><?php echo htmlspecialchars($notes); ?></div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Summary Section -->
            <div class="summary-section">
                <div class="summary-title">Data Summary</div>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-number"><?php echo count($classes); ?></div>
                        <div class="summary-label">Classes</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number"><?php echo count($students); ?></div>
                        <div class="summary-label">Students</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number"><?php echo count($teachers); ?></div>
                        <div class="summary-label">Teachers</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number"><?php echo count($subjects); ?></div>
                        <div class="summary-label">Subjects</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number"><?php echo count($grades); ?></div>
                        <div class="summary-label">Grade Records</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number"><?php echo count($fees); ?></div>
                        <div class="summary-label">Fee Records</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number"><?php echo count($gradingPeriods); ?></div>
                        <div class="summary-label">Grading Periods</div>
                    </div>
                </div>
            </div>

            <!-- Classes Details -->
            <?php if (!empty($classes)): ?>
            <div class="details-section">
                <div class="details-title">Classes (<?php echo count($classes); ?>)</div>
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Class Name</th>
                            <th>Section</th>
                            <th>Students</th>
                            <th>Teachers</th>
                            <th>Subjects</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($classes as $class): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($class['name']); ?></td>
                            <td><?php echo htmlspecialchars($class['section'] ?? '—'); ?></td>
                            <td><?php echo $class['student_count'] ?? 0; ?></td>
                            <td><?php echo $class['teacher_count'] ?? 0; ?></td>
                            <td><?php echo $class['subject_count'] ?? 0; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>

            <!-- Students Details -->
            <?php if (!empty($students)): ?>
            <div class="details-section">
                <div class="details-title">Students (<?php echo count($students); ?>)</div>
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Admission Number</th>
                            <th>Full Name</th>
                            <th>Class</th>
                            <th>Section</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach (array_slice($students, 0, 50) as $student): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($student['admission_number'] ?? $student['student_id'] ?? '—'); ?></td>
                            <td><?php echo htmlspecialchars($student['full_name'] ?? $student['first_name'] . ' ' . $student['last_name']); ?></td>
                            <td><?php echo htmlspecialchars($student['class_name'] ?? '—'); ?></td>
                            <td><?php echo htmlspecialchars($student['class_section'] ?? '—'); ?></td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if (count($students) > 50): ?>
                        <tr>
                            <td colspan="4" style="text-align: center; font-style: italic; color: #666;">
                                ... and <?php echo count($students) - 50; ?> more students
                            </td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>

            <!-- Teachers Details -->
            <?php if (!empty($teachers)): ?>
            <div class="details-section">
                <div class="details-title">Teachers (<?php echo count($teachers); ?>)</div>
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($teachers as $teacher): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($teacher['employee_id'] ?? '—'); ?></td>
                            <td><?php echo htmlspecialchars($teacher['first_name'] . ' ' . $teacher['last_name']); ?></td>
                            <td><?php echo htmlspecialchars($teacher['email'] ?? '—'); ?></td>
                            <td><?php echo htmlspecialchars($teacher['phone'] ?? '—'); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>

            <!-- Subjects Details -->
            <?php if (!empty($subjects)): ?>
            <div class="details-section">
                <div class="details-title">Subjects (<?php echo count($subjects); ?>)</div>
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Subject Name</th>
                            <th>Code</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($subjects as $subject): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($subject['name']); ?></td>
                            <td><?php echo htmlspecialchars($subject['code'] ?? '—'); ?></td>
                            <td><?php echo htmlspecialchars($subject['description'] ?? '—'); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>

            <!-- Grading Periods Details -->
            <?php if (!empty($gradingPeriods)): ?>
            <div class="details-section">
                <div class="details-title">Grading Periods (<?php echo count($gradingPeriods); ?>)</div>
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Period Name</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($gradingPeriods as $period): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($period['name']); ?></td>
                            <td><?php echo date('M j, Y', strtotime($period['start_date'])); ?></td>
                            <td><?php echo date('M j, Y', strtotime($period['end_date'])); ?></td>
                            <td><?php echo $period['weight'] ?? '—'; ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>

            <!-- Footer -->
            <div class="footer">
                <p><strong>This is an official academic year record. Please keep it safe for your records.</strong></p>
                <p>Generated on <?php echo date('F j, Y \a\t g:i A'); ?> | For inquiries, please contact the school office directly.</p>
            </div>

            <script>
                // Auto-print when page loads
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Get current user ID from JWT token
     */
    private function getCurrentUserId() {
        try {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
                $parts = explode('.', $token);
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                return $payload['user_id'] ?? null;
            }
        } catch (Exception $e) {
            return null;
        }
        return null;
    }

    /**
     * Check if current user is admin
     */
    private function isCurrentUserAdmin() {
        try {
            // RoleMiddleware stores $currentUserRole globally on success
            global $currentUserRole;
            if (!empty($currentUserRole) && isset($currentUserRole['name'])) {
                return $currentUserRole['name'] === 'admin';
            }
        } catch (Exception $e) {
            // ignore
        }
        return false;
    }
}
?>
