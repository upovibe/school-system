<?php
// api/email/services/EmailService.php - Email service with environment-based configuration

class EmailService {
    private $config;
    private $templatesPath;
    private $emailFunctions;

    public function __construct() {
        $this->config = require __DIR__ . '/../config/mail.php';
        $this->templatesPath = __DIR__ . '/../email/templates/';
        $this->emailFunctions = require __DIR__ . '/../email/config/email-functions.php';
    }

    /**
     * Magic method to handle dynamic email function calls
     */
    public function __call($method, $arguments) {
        // Convert method name to email type (e.g., sendPasswordResetEmail -> password-reset)
        $emailType = $this->methodToEmailType($method);
        
        if (!$emailType || !isset($this->emailFunctions[$emailType])) {
            throw new Exception("Email function not found: $method");
        }
        
        $emailConfig = $this->emailFunctions[$emailType];
        $variables = $this->mapArgumentsToVariables($arguments, $emailConfig['variables']);
        
        $message = $this->loadTemplate($emailConfig['template'], $variables);
        
        // Debug: Check what subject is being passed
        $subject = $emailConfig['subject'];
        error_log("Email subject: " . $subject);
        
        return $this->send($arguments[0], $subject, $message);
    }

    /**
     * Convert method name to email type
     */
    private function methodToEmailType($method) {
        // Remove 'send' prefix and 'Email' suffix, convert to kebab-case
        $type = preg_replace('/^send/', '', $method);
        $type = preg_replace('/Email$/', '', $type);
        $type = strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', $type));
        
        return $type;
    }

    /**
     * Map function arguments to template variables
     */
    private function mapArgumentsToVariables($arguments, $expectedVariables) {
        $variables = [];
        
        // First argument is always the email address
        $email = array_shift($arguments);
        
        // Map remaining arguments to expected variables
        foreach ($expectedVariables as $index => $variableName) {
            if (isset($arguments[$index])) {
                $variables[$variableName] = $arguments[$index];
            }
        }
        
        return $variables;
    }

    /**
     * Load template with variables
     */
    private function loadTemplate($templateName, $variables = []) {
        $templateFile = $this->templatesPath . $templateName . '.php';
        
        if (!file_exists($templateFile)) {
            error_log("Email template not found: $templateFile");
            return false;
        }

        // Extract variables to make them available in template
        extract($variables);
        
        // Start output buffering to capture template content
        ob_start();
        include $templateFile;
        $content = ob_get_clean();
        
        return $content;
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

        // Create SMTP connection based on encryption type
        if ($config['encryption'] == 'ssl') {
            // Use SSL connection
            $context = stream_context_create([
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ]
            ]);
            
            $connectionString = "ssl://{$config['host']}:{$config['port']}";
            $smtp = @stream_socket_client(
                $connectionString, 
                $errno, 
                $errstr, 
                $config['timeout'],
                STREAM_CLIENT_CONNECT,
                $context
            );
        } else {
            // Use regular connection
            $smtp = @fsockopen($config['host'], $config['port'], $errno, $errstr, $config['timeout']);
        }

        if (!$smtp) {
            error_log("SMTP connection failed: $errstr ($errno)");
            return false;
        }

        // Read server greeting
        $response = fgets($smtp, 515);
        if (!$response) {
            fclose($smtp);
            return false;
        }
        
        if (substr($response, 0, 3) != '220') {
            error_log("SMTP greeting failed: $response");
            fclose($smtp);
            return false;
        }

        // Send EHLO
        $serverName = isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost';
        fputs($smtp, "EHLO $serverName\r\n");
        
        // Read multi-line EHLO response
        do {
        $response = fgets($smtp, 515);
        } while (substr($response, 3, 1) == '-');
        
        if (substr($response, 0, 3) != '250') {
            fclose($smtp);
            return false;
        }

        // Start TLS if required (only for non-SSL connections)
        if ($config['encryption'] == 'tls') {
            fputs($smtp, "STARTTLS\r\n");
            $response = fgets($smtp, 515);
            
            if (substr($response, 0, 3) != '220') {
                error_log("STARTTLS failed: $response");
                fclose($smtp);
                return false;
            }
            
            if (!stream_socket_enable_crypto($smtp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($smtp);
                return false;
            }
            
            // Send EHLO again after TLS
            fputs($smtp, "EHLO $serverName\r\n");
            do {
            $response = fgets($smtp, 515);
            } while (substr($response, 3, 1) == '-');
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
            'Subject: ' . $subject,
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
} 