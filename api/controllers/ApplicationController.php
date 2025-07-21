<?php
// api/controllers/ApplicationController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/ApplicationModel.php';
require_once __DIR__ . '/../core/EmailService.php';

class ApplicationController {
    private $pdo;
    private $model;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->model = new ApplicationModel($pdo);
    }

    /**
     * Store a new guest application (POST /applications)
     */
    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        $required = ['student_first_name', 'student_last_name', 'grade'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
                return;
            }
        }
        try {
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
} 