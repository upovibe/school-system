<?php
// api/core/Emailer.php - Email testing and management

class Emailer {
    
    private static function getEmailerEnv($key, $default = null) {
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue; // Skip comments
                if (strpos($line, '=') === false) continue; // Skip lines without =
                list($envKey, $value) = explode('=', $line, 2);
                if (trim($envKey) === $key) {
                    return trim($value);
                }
            }
        }
        return $default;
    }
    
    public static function test($emailAddress) {
        echo "📧 Testing Email System\n";
        echo "======================\n\n";
        
        if (!filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) {
            echo "❌ Invalid email address: $emailAddress\n";
            echo "Usage: php index.php --email:user@example.com\n";
            return false;
        }
        
        echo "📧 Testing email sending to: $emailAddress\n\n";
        
        // Load EmailService
        require_once __DIR__ . '/EmailService.php';
        
        try {
            $emailService = new EmailService();
            
            // Test email configuration
            echo "🔧 Checking email configuration...\n";
            
            // Simple test - just send a basic welcome email
            echo "\n📨 Testing basic email sending...\n";
            echo "   To: $emailAddress\n";
            echo "   Subject: Test Email - School System\n";
            
            try {
                // Use APP_URL from environment for testing
                $appUrl = self::getEmailerEnv('APP_URL', 'http://localhost:8000');
                $testUrl = $appUrl . '/email-test';
                
                // Test with a simple welcome email
                $result = $emailService->sendWelcomeEmail($emailAddress, 'Test User', $testUrl);
                
                if ($result) {
                    echo "   ✅ SUCCESS: Email sent successfully!\n";
                    echo "\n🎉 Email system is working properly!\n";
                    echo "   - SMTP configuration is correct\n";
                    echo "   - Email templates are loading\n";
                    echo "   - Email functions are working\n";
                    echo "   - Email sent to: $emailAddress\n";
                    return true;
                } else {
                    echo "   ❌ FAILED: Email not sent\n";
                    echo "\n🔧 Troubleshooting:\n";
                    echo "   - Check your .env file SMTP configuration\n";
                    echo "   - Verify MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD\n";
                    echo "   - For development, consider using Mailtrap\n";
                    echo "   - Check server logs for detailed error messages\n";
                    
                    // Show current SMTP configuration (without password)
                    echo "\n📋 Current SMTP Configuration:\n";
                    $mailConfig = require __DIR__ . '/../config/mail.php';
                    echo "   Host: " . $mailConfig['smtp']['host'] . "\n";
                    echo "   Port: " . $mailConfig['smtp']['port'] . "\n";
                    echo "   Encryption: " . $mailConfig['smtp']['encryption'] . "\n";
                    echo "   Username: " . $mailConfig['smtp']['username'] . "\n";
                    echo "   Password: " . (empty($mailConfig['smtp']['password']) ? '❌ NOT SET' : '✅ SET') . "\n";
                    echo "   From: " . $mailConfig['from']['address'] . "\n";
                    return false;
                }
                
            } catch (Exception $e) {
                echo "   ❌ ERROR: " . $e->getMessage() . "\n";
                echo "\n🔧 Troubleshooting:\n";
                echo "   - Check if email templates exist in email/templates/\n";
                echo "   - Verify email-functions.php configuration\n";
                echo "   - Check SMTP settings in .env file\n";
                
                // Show current SMTP configuration on error too
                echo "\n📋 Current SMTP Configuration:\n";
                try {
                    $mailConfig = require __DIR__ . '/../config/mail.php';
                    echo "   Host: " . $mailConfig['smtp']['host'] . "\n";
                    echo "   Port: " . $mailConfig['smtp']['port'] . "\n";
                    echo "   Encryption: " . $mailConfig['smtp']['encryption'] . "\n";
                    echo "   Username: " . $mailConfig['smtp']['username'] . "\n";
                    echo "   Password: " . (empty($mailConfig['smtp']['password']) ? '❌ NOT SET' : '✅ SET') . "\n";
                    echo "   From: " . $mailConfig['from']['address'] . "\n";
                } catch (Exception $configError) {
                    echo "   ❌ Could not load mail configuration: " . $configError->getMessage() . "\n";
                }
                return false;
            }
            
            echo "\n💡 Usage: php index.php --email:user@example.com\n";
            
        } catch (Exception $e) {
            echo "❌ Error initializing email service: " . $e->getMessage() . "\n";
            echo "\n💡 Make sure:\n";
            echo "- config/mail.php exists\n";
            echo "- email/config/email-functions.php exists\n";
            echo "- email/templates/ directory contains template files\n";
            return false;
        }
    }
    
    public static function run() {
        echo "📧 Emailer - Email Management System\n";
        echo "===================================\n\n";
        
        echo "Available commands:\n";
        echo "  --email:user@example.com  - Test email sending\n";
        echo "  --email:config            - Show email configuration\n";
        echo "  --email:templates         - List available email templates\n";
        echo "\n";
    }
}
?> 