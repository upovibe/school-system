<?php
// api/email/config/mail.php - Email configuration with environment variables

// Load environment variables
function getMailEnv($key, $default = null) {
    $envFile = __DIR__ . '/../../../.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue; // Skip comments
            list($envKey, $value) = explode('=', $line, 2);
            if (trim($envKey) === $key) {
                return trim($value);
            }
        }
    }
    return $default;
}

return [
    'smtp' => [
        'host' => getMailEnv('MAIL_HOST', 'smtp.gmail.com'),
        'port' => getMailEnv('MAIL_PORT', 587),
        'encryption' => getMailEnv('MAIL_ENCRYPTION', 'tls'),
        'username' => getMailEnv('MAIL_USERNAME', ''),
        'password' => getMailEnv('MAIL_PASSWORD', ''),
        'timeout' => 30,
    ],
    
    'from' => [
        'address' => getMailEnv('MAIL_FROM_ADDRESS', 'noreply@schoolsystem.com'),
        'name' => getMailEnv('MAIL_FROM_NAME', 'School System'),
    ],
];
?> 