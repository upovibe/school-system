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

                .report-title-container {
                    text-align: right;
                }

                .report-title {
                    font-size: 20px;
                    font-weight: bold;
                }

                .report-subtitle {
                    font-size: 14px;
                }

                .record-info {
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

                .summary-section {
                    margin-top: 30px;
                }

                .section-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    text-align: center;
                    text-decoration: underline;
                }

                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
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
                    color: #000;
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

                .section-separator {
                    border-top: 2px solid #000;
                    margin: 30px 0;
                }

                .details-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    text-align: center;
                    text-decoration: underline;
                }

                .details-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 12px;
                }

                .details-table th {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                    font-weight: bold;
                    background-color: #f0f0f0;
                }

                .details-table td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                }

                .details-table tr:nth-child(even) {
                    background-color: #f9f9f9;
                }

                .no-data {
                    text-align: center;
                    padding: 40px;
                    font-style: italic;
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

                .report-footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    border-top: 1px solid #000;
                    padding-top: 20px;
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
                        <div class="report-title">Academic Year Record</div>
                        <div class="report-subtitle"><?= htmlspecialchars($yearCode) ?></div>
                    </div>
                </div>

                <div class="record-info">
                    <div class="info-row">
                        <div class="info-left">
                            <span class="info-label">Year Code:</span>
                            <span class="info-value"><?php echo htmlspecialchars($yearCode); ?></span>
                        </div>
                        <div class="info-right">
                            <span class="info-label">Record Type:</span>
                            <span class="info-value"><?php echo htmlspecialchars($recordType); ?></span>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-left">
                            <span class="info-label">Archive Date:</span>
                            <span class="info-value"><?php echo htmlspecialchars($archiveDate); ?></span>
                        </div>
                        <div class="info-right">
                            <span class="info-label">Archived By:</span>
                            <span class="info-value"><?php echo htmlspecialchars($archivedBy); ?></span>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-left">
                            <span class="info-label">Total Records:</span>
                            <span class="info-value"><?php echo number_format($totalRecords); ?></span>
                        </div>
                        <div class="info-right">
                            <span class="info-label">Generated Date:</span>
                            <span class="info-value"><?php echo date('F j, Y g:i A'); ?></span>
                        </div>
                    </div>
                </div>

                <!-- Summary Section -->
                <div class="summary-section">
                    <div class="section-title">Data Summary</div>
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

            <div class="section-separator"></div>

            <!-- Students Details -->
            <?php if (!empty($students)): ?>
            <div class="details-section">
                <div class="details-title">Students (<?php echo count($students); ?>)</div>
                
                <?php
                // Group students by class
                $studentsByClass = [];
                foreach ($students as $student) {
                    $className = $student['class_name'] ?? 'Unknown Class';
                    $classSection = $student['class_section'] ?? '';
                    $classKey = $className . ($classSection ? ' - ' . $classSection : '');
                    
                    if (!isset($studentsByClass[$classKey])) {
                        $studentsByClass[$classKey] = [];
                    }
                    $studentsByClass[$classKey][] = $student;
                }
                
                // Sort classes alphabetically
                ksort($studentsByClass);
                ?>
                
                <?php foreach ($studentsByClass as $classKey => $classStudents): ?>
                <div style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #333; background: #f0f0f0; padding: 8px; border-left: 4px solid #007bff;">
                        <?= htmlspecialchars($classKey) ?> (<?= count($classStudents) ?> students)
                    </h4>
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Admission Number</th>
                                <th>Full Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($classStudents as $index => $student): ?>
                            <tr>
                                <td><?= $index + 1 ?></td>
                                <td><?= htmlspecialchars($student['admission_number'] ?? $student['student_id'] ?? '—') ?></td>
                                <td><?= htmlspecialchars($student['full_name'] ?? $student['first_name'] . ' ' . $student['last_name']) ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

            <div class="section-separator"></div>

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

            <div class="section-separator"></div>

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

            <div class="section-separator"></div>

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
                    <strong>Generated by:</strong> <?= htmlspecialchars($schoolSettings['application_name'] ?? 'School Management System') ?> | <strong>Report Type:</strong> Academic Year Record
                </div>
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
