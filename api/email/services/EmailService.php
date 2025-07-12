<?php
// api/email/services/EmailService.php - Email service with environment-based configuration

class EmailService {
    private $config;

    public function __construct() {
        $this->config = require __DIR__ . '/../config/mail.php';
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail($toEmail, $resetToken, $resetUrl) {
        $subject = 'Password Reset Request - School System';
        $message = $this->getPasswordResetEmailTemplate($resetUrl);
        
        return $this->send($toEmail, $subject, $message);
    }

    /**
     * Send welcome email
     */
    public function sendWelcomeEmail($toEmail, $userName, $loginUrl) {
        $subject = 'Welcome to School System';
        $message = $this->getWelcomeEmailTemplate($userName, $loginUrl);
        
        return $this->send($toEmail, $subject, $message);
    }

    /**
     * Send email using SMTP
     */
    private function send($to, $subject, $message) {
        return $this->sendViaSmtp($to, $subject, $message, $this->config['smtp']);
    }

    /**
     * Send email using SMTP
     */
    private function sendViaSmtp($to, $subject, $message, $config) {
        if (!$config['host'] || !$config['username'] || !$config['password']) {
            error_log('SMTP configuration incomplete. Please check your .env file.');
            return false;
        }

        // Create SMTP connection
        $smtp = fsockopen($config['host'], $config['port'], $errno, $errstr, $config['timeout']);
        if (!$smtp) {
            error_log("SMTP connection failed: $errstr ($errno)");
            return false;
        }

        // Read server greeting
        $response = fgets($smtp, 515);
        if (substr($response, 0, 3) != '220') {
            error_log("SMTP greeting failed: $response");
            fclose($smtp);
            return false;
        }

        // Send EHLO
        fputs($smtp, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
        $response = fgets($smtp, 515);

        // Start TLS if required
        if ($config['encryption'] == 'tls') {
            fputs($smtp, "STARTTLS\r\n");
            $response = fgets($smtp, 515);
            if (substr($response, 0, 3) != '220') {
                error_log("STARTTLS failed: $response");
                fclose($smtp);
                return false;
            }
            stream_socket_enable_crypto($smtp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            
            // Send EHLO again after TLS
            fputs($smtp, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
            $response = fgets($smtp, 515);
        }

        // Authenticate
        fputs($smtp, "AUTH LOGIN\r\n");
        $response = fgets($smtp, 515);
        if (substr($response, 0, 3) != '334') {
            error_log("AUTH LOGIN failed: $response");
            fclose($smtp);
            return false;
        }

        fputs($smtp, base64_encode($config['username']) . "\r\n");
        $response = fgets($smtp, 515);
        if (substr($response, 0, 3) != '334') {
            error_log("Username authentication failed: $response");
            fclose($smtp);
            return false;
        }

        fputs($smtp, base64_encode($config['password']) . "\r\n");
        $response = fgets($smtp, 515);
        if (substr($response, 0, 3) != '235') {
            error_log("Password authentication failed: $response");
            fclose($smtp);
            return false;
        }

        // Send MAIL FROM
        fputs($smtp, "MAIL FROM: <" . $this->config['from']['address'] . ">\r\n");
        $response = fgets($smtp, 515);
        if (substr($response, 0, 3) != '250') {
            error_log("MAIL FROM failed: $response");
            fclose($smtp);
            return false;
        }

        // Send RCPT TO
        fputs($smtp, "RCPT TO: <$to>\r\n");
        $response = fgets($smtp, 515);
        if (substr($response, 0, 3) != '250') {
            error_log("RCPT TO failed: $response");
            fclose($smtp);
            return false;
        }

        // Send DATA
        fputs($smtp, "DATA\r\n");
        $response = fgets($smtp, 515);
        if (substr($response, 0, 3) != '354') {
            error_log("DATA command failed: $response");
            fclose($smtp);
            return false;
        }

        // Send message
        $headers = [
            'From: ' . $this->config['from']['name'] . ' <' . $this->config['from']['address'] . '>',
            'Reply-To: ' . $this->config['from']['address'],
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'X-Mailer: PHP/' . phpversion()
        ];
        
        $headerString = implode("\r\n", $headers);
        fputs($smtp, $headerString . "\r\n\r\n" . $message . "\r\n.\r\n");
        $response = fgets($smtp, 515);
        if (substr($response, 0, 3) != '250') {
            error_log("Message sending failed: $response");
            fclose($smtp);
            return false;
        }

        // Quit
        fputs($smtp, "QUIT\r\n");
        fclose($smtp);
        
        return true;
    }

    /**
     * Get password reset email template
     */
    private function getPasswordResetEmailTemplate($resetUrl) {
        require_once __DIR__ . '/../templates/password-reset.php';
        return getPasswordResetEmailTemplate($resetUrl);
    }

    /**
     * Get welcome email template
     */
    private function getWelcomeEmailTemplate($userName, $loginUrl) {
        require_once __DIR__ . '/../templates/welcome.php';
        return getWelcomeEmailTemplate($userName, $loginUrl);
    }
}
?> 