<?php
// api/controllers/ContactController.php - Handle contact form submissions

require_once __DIR__ . '/../core/EmailService.php';

class ContactController {
    private $pdo;
    private $config;

    public function __construct() {
        $this->pdo = require __DIR__ . '/../database/connection.php';
        $this->config = require __DIR__ . '/../config/app_config.php';
    }

    /**
     * Handle contact form submission
     */
    public function submit() {
        try {
            ob_clean();
            
            // Get form data
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Name, email, and message are required'
                ], JSON_PRETTY_PRINT);
                return;
            }

            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Please provide a valid email address'
                ], JSON_PRETTY_PRINT);
                return;
            }

            // Sanitize input data
            $name = htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8');
            $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
            $subject = isset($data['subject']) ? htmlspecialchars(trim($data['subject']), ENT_QUOTES, 'UTF-8') : 'Contact Form Submission';
            $message = htmlspecialchars(trim($data['message']), ENT_QUOTES, 'UTF-8');
            $phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone']), ENT_QUOTES, 'UTF-8') : '';

            // Prepare email data
            $emailData = [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'subject' => $subject,
                'message' => $message,
                'submissionDate' => date('F j, Y \a\t g:i A')
            ];

            // Send email notification
            try {
                $emailService = new EmailService();
                
                // Send to school email
                $schoolEmail = $this->config['mail']['from_address'];
                $emailSent = $emailService->sendContactFormEmail(
                    $schoolEmail,
                    $name,
                    $email,
                    $phone,
                    $message,
                    $emailData['submissionDate']
                );

                if ($emailSent) {
                    // Log the contact form submission
                    error_log("Contact form submitted successfully from: {$email}");
                    
                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'message' => 'Thank you for your message! We\'ll get back to you soon.',
                        'data' => [
                            'name' => $name,
                            'email' => $email,
                            'submitted_at' => $emailData['submissionDate']
                        ]
                    ], JSON_PRETTY_PRINT);
                } else {
                    error_log("Failed to send contact form email from: {$email}");
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to send message. Please try again later.'
                    ], JSON_PRETTY_PRINT);
                }
            } catch (Exception $emailError) {
                error_log("Contact form email error: " . $emailError->getMessage());
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to send message. Please try again later.'
                ], JSON_PRETTY_PRINT);
            }

        } catch (Exception $e) {
            error_log("Contact form submission error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'An error occurred. Please try again later.'
            ], JSON_PRETTY_PRINT);
        }
    }
}
