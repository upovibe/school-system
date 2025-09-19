<?php
// api/email/config/email-functions.php - Email function definitions

return [
    'test-email' => [
        'subject' => 'Email Test - School System',
        'template' => 'test-email',
        'variables' => ['to', 'testUrl']
    ],
    
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
    ],
    
    'user-created' => [
        'subject' => 'Welcome to School System - Your Account Details',
        'template' => 'user-created',
        'variables' => ['userName', 'userEmail', 'initialPassword', 'loginUrl']
    ],
    
    'account-update' => [
        'subject' => 'Your Account Has Been Updated - School System',
        'template' => 'account-update',
        'variables' => ['userName', 'changes', 'oldEmail']
    ],
    'application-received' => [
        'subject' => 'Your Application Was Received - School System',
        'template' => 'application-received',
        'variables' => ['applicantName', 'applicantNumber', 'grade', 'schoolName']
    ],
    'application-notification' => [
        'subject' => 'New Application Submitted - School System',
        'template' => 'application-notification',
        'variables' => ['applicantName', 'applicantNumber', 'grade', 'schoolName', 'applicantEmail', 'parentPhone']
    ],
    
    'contact-form' => [
        'subject' => 'New Contact Form Submission - School System',
        'template' => 'contact-form',
        'variables' => ['name', 'email', 'phone', 'message', 'submissionDate']
    ],
    
    'admission-approved' => [
        'subject' => '🎉 Admission Approved - School System',
        'template' => 'admission-approved',
        'variables' => ['parentName', 'studentName', 'schoolName', 'applicantNumber', 'level', 'class', 'programme', 'schoolType', 'academicYear']
    ],
    
    'admission-rejected' => [
        'subject' => 'Application Status Update - School System',
        'template' => 'admission-rejected',
        'variables' => ['parentName', 'studentName', 'schoolName', 'applicantNumber', 'level', 'class', 'programme', 'academicYear']
    ]
]; 

?>