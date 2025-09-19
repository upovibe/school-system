<?php
// api/controllers/ApplicationController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/ApplicationModel.php';
require_once __DIR__ . '/../models/AdmissionConfigModel.php';
require_once __DIR__ . '/../core/EmailService.php';

class ApplicationController {
    private $pdo;
    private $model;
    private $admissionConfigModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->model = new ApplicationModel($pdo);
        $this->admissionConfigModel = new AdmissionConfigModel($pdo);
    }

    /**
     * Store a new guest application (POST /applications)
     */
    public function store() {
        try {
            // Check if admission is open
            $config = $this->admissionConfigModel->getCurrentConfig();
            if (!$config || $config['admission_status'] !== 'open') {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Admission is currently closed'
                ]);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            
            // Debug: Log the received data to see what's being sent
            error_log('Received application data: ' . json_encode($data));
            
            // Get required fields from configuration
            $requiredFields = $this->getRequiredFields($config);
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false, 
                        'message' => "Missing required field: $field"
                    ]);
                    return;
                }
            }

            // Validate phone numbers
            $phoneFields = ['phone_number', 'student_phone', 'emergency_contact'];
            foreach ($phoneFields as $phoneField) {
                if (isset($data[$phoneField]) && !empty($data[$phoneField])) {
                    if (!$this->validatePhoneNumber($data[$phoneField])) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false, 
                            'message' => "Invalid phone number format. Phone number must be at least 10 digits long."
                        ]);
                        return;
                    }
                }
            }

            // Check if user has already submitted an application
            $userIP = $_SERVER['REMOTE_ADDR'] ?? '';
            $existingApplication = $this->checkExistingApplication($userIP);
            if ($existingApplication) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'You have already submitted an application. Your application number is: ' . $existingApplication['applicant_number'],
                    'application_data' => [
                        'applicant_number' => $existingApplication['applicant_number'],
                        'submitted_at' => $existingApplication['created_at'],
                        'status' => $existingApplication['status']
                    ]
                ]);
                return;
            }

            // Validate IP limit with detailed info
            $ipRateLimitInfo = $this->model->getIPRateLimitInfo($userIP);
            if (!$ipRateLimitInfo['can_apply']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => "You have reached the daily limit of {$ipRateLimitInfo['max_per_day']} applications. You can apply again {$ipRateLimitInfo['next_available_human']}.",
                    'rate_limit_info' => $ipRateLimitInfo
                ]);
                return;
            }

            // Process health information fields
            $healthInfo = $this->processHealthInfo($data, $config);
            if ($healthInfo === false) {
                return; // Validation failed, error already sent
            }
            
            // Store health info in JSON column
            if (!empty($healthInfo)) {
                $data['health_info'] = json_encode($healthInfo);
            }

            // Add academic year ID and IP address to data
            $data['academic_year_id'] = $config['academic_year_id'];
            $data['applicant_ip'] = $userIP;
            
            // Debug: Log the final data being sent to the model
            error_log('Final data for model: ' . json_encode($data));
            
            $id = $this->model->create($data);
            // Fetch the created application (to get applicant_number)
            $application = (new ApplicationModel($this->pdo))->findById($id);
            // Prepare email variables
            $applicantName = $application['first_name'] . ' ' . $application['last_name'];
            $applicantNumber = $application['applicant_number'];
            $grade = $application['class_applying'];
            $schoolName = $this->getSchoolName();
            $applicantEmail = $application['email'];
            $parentPhone = $application['phone_number'];
            // Send email to applicant (if email provided)
            $emailService = new EmailService();
            $applicantEmailSent = false;
            if ($applicantEmail) {
                try {
                    $applicantEmailSent = $emailService->applicationReceived(
                        $applicantEmail,
                        $applicantName,
                        $applicantNumber,
                        $grade,
                        $schoolName
                    );
                } catch (Exception $e) {
                    error_log('Failed to send applicant confirmation email: ' . $e->getMessage());
                }
            }
            // Send email to admin/receiver
            $adminEmail = $this->getAdminEmail();
            $adminEmailSent = false;
            if ($adminEmail) {
                try {
                    $adminEmailSent = $emailService->applicationNotification(
                        $adminEmail,
                        $applicantName,
                        $applicantNumber,
                        $grade,
                        $schoolName,
                        $applicantEmail,
                        $parentPhone
                    );
                } catch (Exception $e) {
                    error_log('Failed to send admin notification email: ' . $e->getMessage());
                }
            }
            echo json_encode([
                'success' => true,
                'message' => 'Application submitted successfully',
                'id' => $id,
                'applicant_number' => $applicantNumber,
                'applicant_email_sent' => $applicantEmailSent,
                'admin_email_sent' => $adminEmailSent
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to submit application', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get all guest applications (GET /applications) - Admin only
     */
    public function index() {
        RoleMiddleware::requireAdmin($this->pdo);
        try {
            $applications = (new ApplicationModel($this->pdo))->findAll();
            echo json_encode(['success' => true, 'data' => $applications]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to fetch applications', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get a single application by ID (GET /applications/{id}) - Admin only
     */
    public function show($id) {
        RoleMiddleware::requireAdmin($this->pdo);
        try {
            $application = (new ApplicationModel($this->pdo))->findById($id);
            if (!$application) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Application not found']);
                return;
            }
            echo json_encode(['success' => true, 'data' => $application]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to fetch application', 'error' => $e->getMessage()]);
        }
    }

    // Helper to get school name from settings
    private function getSchoolName() {
        try {
            $stmt = $this->pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1');
            $stmt->execute(['school_name']);
            $row = $stmt->fetch();
            return $row ? $row['setting_value'] : 'Our School';
        } catch (Exception $e) {
            return 'Our School';
        }
    }

    // Helper to get admin/receiver email from settings or config
    private function getAdminEmail() {
        // Try to get from settings first
        try {
            $stmt = $this->pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1');
            $stmt->execute(['contact_email']);
            $row = $stmt->fetch();
            if ($row && !empty($row['setting_value'])) {
                return $row['setting_value'];
            }
        } catch (Exception $e) {}
        // Fallback to mail.php config
        $mailConfig = require __DIR__ . '/../config/mail.php';
        return $mailConfig['from']['address'] ?? null;
    }

    /**
     * Get required fields from admission configuration
     * Returns database column names (not config field names)
     */
    private function getRequiredFields($config) {
        $requiredFields = [];
        
        // Field mapping from config names to database column names
        $fieldMapping = [
            // Student Information fields - now match exactly
            'first_name' => 'first_name',
            'middle_name' => 'middle_name',
            'last_name' => 'last_name',
            'student_phone' => 'student_phone',
            // gender, date_of_birth, place_of_birth, nationality, religion stay the same
            
            // Parent/Guardian fields - now match exactly
            'parent_full_name' => 'parent_full_name',
            'phone_number' => 'phone_number',
            'email' => 'email',
            'occupation' => 'occupation',
            'relationship' => 'relationship',
            'emergency_contact' => 'emergency_contact',
            'residential_address' => 'residential_address',
            
            // Academic Background fields - now match exactly
            'previous_school' => 'previous_school',
            'last_class_completed' => 'last_class_completed',
            
            // School Setup fields - now match exactly
            'level_applying' => 'level_applying',
            'class_applying' => 'class_applying',
            'academic_programme' => 'academic_programme',
            'school_type' => 'school_type',
        ];
        
        // Check student info fields
        if (isset($config['student_info_fields'])) {
            $studentFields = is_string($config['student_info_fields']) 
                ? json_decode($config['student_info_fields'], true) 
                : $config['student_info_fields'];
            if (is_array($studentFields)) {
                foreach ($studentFields as $field) {
                    if (isset($field['required']) && isset($field['enabled']) && $field['required'] && $field['enabled']) {
                        // Map config field name to database column name
                        $dbFieldName = isset($fieldMapping[$field['name']]) ? $fieldMapping[$field['name']] : $field['name'];
                        $requiredFields[] = $dbFieldName;
                    }
                }
            }
        }
        
        // Check parent/guardian fields
        if (isset($config['parent_guardian_fields'])) {
            $parentFields = is_string($config['parent_guardian_fields']) 
                ? json_decode($config['parent_guardian_fields'], true) 
                : $config['parent_guardian_fields'];
            if (is_array($parentFields)) {
                foreach ($parentFields as $field) {
                    if (isset($field['required']) && isset($field['enabled']) && $field['required'] && $field['enabled']) {
                        // Map config field name to database column name
                        $dbFieldName = isset($fieldMapping[$field['name']]) ? $fieldMapping[$field['name']] : $field['name'];
                        $requiredFields[] = $dbFieldName;
                    }
                }
            }
        }
        
        // Check academic background fields
        if (isset($config['academic_background_fields'])) {
            $academicFields = is_string($config['academic_background_fields']) 
                ? json_decode($config['academic_background_fields'], true) 
                : $config['academic_background_fields'];
            if (is_array($academicFields)) {
                foreach ($academicFields as $field) {
                    if (isset($field['required']) && isset($field['enabled']) && $field['required'] && $field['enabled']) {
                        // Map config field name to database column name
                        $dbFieldName = isset($fieldMapping[$field['name']]) ? $fieldMapping[$field['name']] : $field['name'];
                        $requiredFields[] = $dbFieldName;
                    }
                }
            }
        }
        
        // Check admission details fields
        if (isset($config['admission_details_fields'])) {
            $admissionFields = is_string($config['admission_details_fields']) 
                ? json_decode($config['admission_details_fields'], true) 
                : $config['admission_details_fields'];
            if (is_array($admissionFields)) {
                foreach ($admissionFields as $field) {
                    if (isset($field['required']) && isset($field['enabled']) && $field['required'] && $field['enabled']) {
                        // Map config field name to database column name
                        $dbFieldName = isset($fieldMapping[$field['name']]) ? $fieldMapping[$field['name']] : $field['name'];
                        $requiredFields[] = $dbFieldName;
                    }
                }
            }
        }
        
        // Note: Health info fields are processed separately and stored in health_info JSON column
        // They are not added to requiredFields as they are handled in the store() method
        
        
        // Always require school setup fields if they exist
        $requiredFields[] = 'level_applying';
        $requiredFields[] = 'class_applying';
        
        return array_unique($requiredFields); // Remove duplicates
    }

    /**
     * Validate phone number format
     */
    private function validatePhoneNumber($phone) {
        // Remove all non-digit characters
        $digitsOnly = preg_replace('/\D/', '', $phone);
        
        // Check if it has at least 10 digits
        if (strlen($digitsOnly) < 10) {
            return false;
        }
        
        // Check if it's not too long (max 15 digits for international numbers)
        if (strlen($digitsOnly) > 15) {
            return false;
        }
        
        return true;
    }

    /**
     * Process and validate health information fields
     */
    private function processHealthInfo(&$data, $config) {
        $healthInfo = [];
        $healthFields = ['blood_group', 'allergies', 'medical_conditions'];
        
        // Get health field configuration
        $healthFieldConfig = [];
        if (isset($config['health_info_fields'])) {
            $healthFieldConfig = is_string($config['health_info_fields']) 
                ? json_decode($config['health_info_fields'], true) 
                : $config['health_info_fields'];
        }
        
        foreach ($healthFields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];
                
                // Check if field is required
                $isRequired = false;
                foreach ($healthFieldConfig as $fieldConfig) {
                    if (isset($fieldConfig['name']) && $fieldConfig['name'] === $field) {
                        $isRequired = $fieldConfig['required'] ?? false;
                        break;
                    }
                }
                
                // Validate required fields
                if ($isRequired && (empty($value) || $value === '')) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false, 
                        'message' => "Health information field '$field' is required"
                    ]);
                    return false;
                }
                
                // Only add non-empty values
                if (!empty($value) && $value !== '') {
                    $healthInfo[$field] = $value;
                }
                
                // Remove from main data array
                unset($data[$field]);
            }
        }
        
        return $healthInfo;
    }

    /**
     * Check if user has already submitted an application from this IP
     */
    private function checkExistingApplication($ip) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT applicant_number, created_at, status 
                FROM applications 
                WHERE applicant_ip = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            ");
            $stmt->execute([$ip]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log('Error checking existing application: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send status change email notification to parent
     */
    private function sendStatusChangeEmail($application, $status) {
        try {
            error_log("Starting sendStatusChangeEmail for status: " . $status);
            
            $emailService = new EmailService();
            $schoolName = $this->getSchoolName();
            $parentEmail = $application['email'];
            $studentName = $application['first_name'] . ' ' . $application['last_name'];
            $parentName = $application['parent_full_name'] ?? 'Parent/Guardian';
            $applicantNumber = $application['applicant_number'];
            
            error_log("Email details - To: $parentEmail, Student: $studentName, Parent: $parentName, Number: $applicantNumber");
            
            // Get academic year name
            $academicYear = $this->getAcademicYearName($application['academic_year_id']);
            
            if ($status === 'approved') {
                $subject = "Admission Approval Letter - {$schoolName}";
                $template = 'admission-approved.php';
            } else {
                $subject = "Admission Decision Letter - {$schoolName}";
                $template = 'admission-rejected.php';
            }
            
            error_log("Using template: $template with subject: $subject");
            
            // Get school settings for logo
            $schoolSettings = $this->getSchoolSettings();
            
            // Prepare template variables
            $templateVars = [
                'parentName' => $parentName,
                'studentName' => $studentName,
                'schoolName' => $schoolName,
                'applicantNumber' => $applicantNumber,
                'level' => $application['level_applying'] ?? 'N/A',
                'class' => $application['class_applying'] ?? 'N/A',
                'programme' => $application['academic_programme'] ?? '',
                'schoolType' => $application['school_type'] ?? 'N/A',
                'academicYear' => $academicYear,
                'schoolSettings' => $schoolSettings
            ];
            
            error_log("Template variables: " . json_encode($templateVars));
            
            // Load and render template
            $templatePath = __DIR__ . '/../email/templates/' . $template;
            error_log("Looking for template at: $templatePath");
            
            if (file_exists($templatePath)) {
                error_log("Template found, rendering...");
                ob_start();
                extract($templateVars);
                include $templatePath;
                $htmlBody = ob_get_clean();
                error_log("Template rendered successfully, body length: " . strlen($htmlBody));
            } else {
                error_log("Template not found, using fallback");
                // Fallback to simple email if template not found
                $htmlBody = $this->getFallbackEmailBody($application, $status, $schoolName, $academicYear);
            }
            
            // No PDF attachments - email only
            $attachments = [];
            
            error_log("Sending email via EmailService...");
            $result = $emailService->sendEmail($parentEmail, $subject, $htmlBody, $attachments);
            error_log("EmailService result: " . ($result ? 'SUCCESS' : 'FAILED'));
            
            // Clean up temporary PDF file
            if (!empty($attachments)) {
                foreach ($attachments as $attachment) {
                    if (file_exists($attachment['path'])) {
                        unlink($attachment['path']);
                    }
                }
            }
            
            return $result;
            
        } catch (Exception $e) {
            error_log('Failed to send status change email: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            return false;
        }
    }
    
    /**
     * Get academic year name by ID
     */
    private function getAcademicYearName($academicYearId) {
        try {
            $stmt = $this->pdo->prepare('SELECT year_code, display_name FROM academic_years WHERE id = ?');
            $stmt->execute([$academicYearId]);
            $year = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($year) {
                return $year['display_name'] ? $year['display_name'] : $year['year_code'];
            }
            return 'Current Academic Year';
        } catch (Exception $e) {
            return 'Current Academic Year';
        }
    }
    
    /**
     * Get school settings for logo and other details
     */
    private function getSchoolSettings() {
        try {
            $stmt = $this->pdo->prepare('SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?, ?, ?, ?, ?, ?)');
            $stmt->execute(['application_logo', 'application_name', 'application_tagline', 'contact_address', 'contact_phone', 'contact_email']);
            $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            return [
                'application_logo' => $settings['application_logo'] ?? '',
                'application_name' => $settings['application_name'] ?? 'School Management System',
                'application_tagline' => $settings['application_tagline'] ?? 'Excellence in Education',
                'contact_address' => $settings['contact_address'] ?? '',
                'contact_phone' => $settings['contact_phone'] ?? '',
                'contact_email' => $settings['contact_email'] ?? ''
            ];
        } catch (Exception $e) {
            return [
                'application_logo' => '',
                'application_name' => 'School Management System',
                'application_tagline' => 'Excellence in Education',
                'contact_address' => '',
                'contact_phone' => '',
                'contact_email' => ''
            ];
        }
    }
    
    /**
     * Fallback email body if template is not found
     */
    private function getFallbackEmailBody($application, $status, $schoolName, $academicYear) {
        $studentName = $application['first_name'] . ' ' . $application['last_name'];
        $applicantNumber = $application['applicant_number'];
        $statusText = $status === 'approved' ? 'approved' : 'rejected';
        $statusMessage = $status === 'approved' 
            ? 'Congratulations! Your child\'s application has been approved.'
            : 'We regret to inform you that your child\'s application was not successful at this time.';
            
        $nextSteps = $status === 'approved'
            ? 'Please contact the school office for enrollment procedures and required documents.'
            : 'Thank you for your interest in our school. You may apply again in the next admission period.';
        
        return "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;'>
                    <h2 style='color: #333; margin: 0;'>{$schoolName}</h2>
                    <h3 style='color: " . ($status === 'approved' ? '#28a745' : '#dc3545') . "; margin: 10px 0;'>Application {$statusText}</h3>
                </div>
                
                <div style='background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                    <p>Dear Parent/Guardian,</p>
                    
                    <p><strong>{$statusMessage}</strong></p>
                    
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                        <h4 style='margin: 0 0 10px 0; color: #333;'>Application Details:</h4>
                        <p style='margin: 5px 0;'><strong>Student Name:</strong> {$studentName}</p>
                        <p style='margin: 5px 0;'><strong>Application Number:</strong> {$applicantNumber}</p>
                        <p style='margin: 5px 0;'><strong>Level:</strong> {$application['level_applying']}</p>
                        <p style='margin: 5px 0;'><strong>Class:</strong> {$application['class_applying']}</p>
                        <p style='margin: 5px 0;'><strong>Academic Year:</strong> {$academicYear}</p>
                        <p style='margin: 5px 0;'><strong>Status:</strong> <span style='color: " . ($status === 'approved' ? '#28a745' : '#dc3545') . "; font-weight: bold;'>" . ucfirst($statusText) . "</span></p>
                    </div>
                    
                    <p><strong>Next Steps:</strong><br>{$nextSteps}</p>
                    
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p>Best regards,<br>
                    <strong>{$schoolName} Admissions Team</strong></p>
                </div>
                
                <div style='text-align: center; margin-top: 20px; padding: 10px; font-size: 12px; color: #666;'>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        ";
    }

    /**
     * Get admission configuration for public form (GET /admission/config)
     */
    public function getConfig() {
        try {
            $config = $this->admissionConfigModel->getCurrentConfig();
            
            if (!$config) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Admission configuration not found'
                ]);
                return;
            }

            // Return only public configuration (no sensitive data)
            $publicConfig = [
                'id' => $config['id'],
                'academic_year_id' => $config['academic_year_id'],
                'academic_year_name' => $config['academic_year_name'],
                'admission_status' => $config['admission_status'],
                'max_applications_per_ip_per_day' => $config['max_applications_per_ip_per_day'],
                'enabled_levels' => json_decode($config['enabled_levels'], true),
                'level_classes' => json_decode($config['level_classes'], true),
                'shs_programmes' => json_decode($config['shs_programmes'], true),
                'school_types' => json_decode($config['school_types'], true),
                'student_info_fields' => json_decode($config['student_info_fields'], true),
                'parent_guardian_fields' => json_decode($config['parent_guardian_fields'], true),
                'academic_background_fields' => json_decode($config['academic_background_fields'], true),
                'health_info_fields' => json_decode($config['health_info_fields'], true)
            ];

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $publicConfig,
                'message' => 'Admission configuration retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving admission configuration: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update application status (admin only)
     */
    public function updateStatus($id) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['status'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Status is required'
                ]);
                return;
            }

            // Map frontend statuses to backend statuses
            $statusMapping = [
                'approved' => 'approved',
                'rejected' => 'rejected',
                'pending' => 'pending'
            ];
            
            $backendStatus = $statusMapping[$data['status']] ?? $data['status'];
            $validStatuses = ['pending', 'approved', 'rejected'];
            
            if (!in_array($backendStatus, $validStatuses)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid status. Must be one of: ' . implode(', ', $validStatuses)
                ]);
                return;
            }

            // Get application data before updating for email
            $application = $this->model->findById($id);
            if (!$application) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Application not found'
                ]);
                return;
            }

            // Update status
            $this->model->updateStatus($id, $backendStatus);
            
            // Send email notification to parent if status changed to approved or rejected
            if (in_array($backendStatus, ['approved', 'rejected']) && !empty($application['email'])) {
                error_log("Attempting to send status change email to: " . $application['email'] . " for status: " . $backendStatus);
                $emailSent = $this->sendStatusChangeEmail($application, $backendStatus);
                error_log("Email send result: " . ($emailSent ? 'SUCCESS' : 'FAILED'));
            } else {
                error_log("Skipping email send - Status: " . $backendStatus . ", Email: " . ($application['email'] ?? 'EMPTY'));
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Application status updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating application status: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get application statistics (admin only)
     */
    public function getStatistics() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            
            $stats = $this->model->getStatistics();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $stats,
                'message' => 'Application statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving application statistics: ' . $e->getMessage()
            ]);
        }
    }
} 