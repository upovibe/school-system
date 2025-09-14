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

            // Validate IP limit
            if (!$this->model->checkIPLimit($_SERVER['REMOTE_ADDR'] ?? '')) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Too many applications from this IP address. Please try again later.'
                ]);
                return;
            }

            // Add academic year ID to data
            $data['academic_year_id'] = $config['academic_year_id'];
            $id = $this->model->create($data);
            // Fetch the created application (to get applicant_number)
            $application = (new ApplicationModel($this->pdo))->findById($id);
            // Prepare email variables
            $applicantName = $application['student_first_name'] . ' ' . $application['student_last_name'];
            $applicantNumber = $application['applicant_number'];
            $grade = $application['grade'];
            $schoolName = $this->getSchoolName();
            $applicantEmail = $application['email'];
            $parentPhone = $application['parent_phone'];
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
     */
    private function getRequiredFields($config) {
        $requiredFields = [];
        
        // Check student info fields
        if (isset($config['student_info_fields'])) {
            foreach ($config['student_info_fields'] as $field) {
                if ($field['required'] && $field['enabled']) {
                    $requiredFields[] = $field['name'];
                }
            }
        }
        
        // Check parent/guardian fields
        if (isset($config['parent_guardian_fields'])) {
            foreach ($config['parent_guardian_fields'] as $field) {
                if ($field['required'] && $field['enabled']) {
                    $requiredFields[] = $field['name'];
                }
            }
        }
        
        // Check academic background fields
        if (isset($config['academic_background_fields'])) {
            foreach ($config['academic_background_fields'] as $field) {
                if ($field['required'] && $field['enabled']) {
                    $requiredFields[] = $field['name'];
                }
            }
        }
        
        // Check admission details fields
        if (isset($config['admission_details_fields'])) {
            foreach ($config['admission_details_fields'] as $field) {
                if ($field['required'] && $field['enabled']) {
                    $requiredFields[] = $field['name'];
                }
            }
        }
        
        // Check health info fields
        if (isset($config['health_info_fields'])) {
            foreach ($config['health_info_fields'] as $field) {
                if ($field['required'] && $field['enabled']) {
                    $requiredFields[] = $field['name'];
                }
            }
        }
        
        // Check document upload fields
        if (isset($config['document_upload_fields'])) {
            foreach ($config['document_upload_fields'] as $field) {
                if ($field['required'] && $field['enabled']) {
                    $requiredFields[] = $field['name'];
                }
            }
        }
        
        return $requiredFields;
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
                'required_documents' => json_decode($config['required_documents'], true),
                'student_info_fields' => json_decode($config['student_info_fields'], true),
                'parent_guardian_fields' => json_decode($config['parent_guardian_fields'], true),
                'academic_background_fields' => json_decode($config['academic_background_fields'], true),
                'health_info_fields' => json_decode($config['health_info_fields'], true),
                'document_upload_fields' => json_decode($config['document_upload_fields'], true)
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

            $validStatuses = ['pending', 'under_review', 'accepted', 'rejected', 'waitlisted'];
            if (!in_array($data['status'], $validStatuses)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid status. Must be one of: ' . implode(', ', $validStatuses)
                ]);
                return;
            }

            $this->model->updateStatus($id, $data['status'], $data['notes'] ?? null);
            
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