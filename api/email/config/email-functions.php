<?php
// api/email/config/email-functions.php - Email function definitions

return [
    'password-reset' => [
        'subject' => 'Password Reset Request - School System',
        'template' => 'password-reset',
        'variables' => ['resetUrl']
    ],
    
    'welcome' => [
        'subject' => 'Welcome to School System',
        'template' => 'welcome',
        'variables' => ['userName', 'loginUrl']
    ],
    
    // Add more email types here without touching EmailService
    'account-verification' => [
        'subject' => 'Verify Your Account - School System',
        'template' => 'account-verification',
        'variables' => ['userName', 'verificationUrl']
    ],
    
    'password-changed' => [
        'subject' => 'Password Changed Successfully - School System',
        'template' => 'password-changed',
        'variables' => ['userName', 'loginUrl']
    ],
    
    'account-locked' => [
        'subject' => 'Account Locked - School System',
        'template' => 'account-locked',
        'variables' => ['userName', 'unlockUrl']
    ]
];
?> 