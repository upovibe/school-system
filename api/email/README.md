# Email Configuration

This email system uses environment variables for configuration, similar to Laravel.

## Environment Variables

Create a `.env` file in the `api` directory with the following variables:

```env
# Email Configuration (SMTP Only)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@schoolsystem.com
MAIL_FROM_NAME="School System"
```

## Configuration Options

### 1. Gmail SMTP
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
```

### 2. Mailtrap (for testing)
```env
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
```

### 3. Other SMTP Providers
```env
MAIL_HOST=your-smtp-server.com
MAIL_PORT=587
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
```

## Setup Instructions

### For Gmail:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the App Password in `MAIL_PASSWORD`

### For Mailtrap:
1. Sign up at https://mailtrap.io/ (free)
2. Get your SMTP credentials from your inbox
3. Use those credentials in the .env file

## Usage

The EmailService is automatically loaded in the AuthController and used for password reset emails.

## File Structure

```
api/
├── config/
│   └── mail.php                  # SMTP configuration
├── core/
│   └── EmailService.php          # Email service class
├── email/
│   ├── config/
│   │   └── email-functions.php   # Email function definitions
│   ├── templates/                # Email templates
│   │   ├── password-reset.php
│   │   ├── welcome.php
│   │   ├── account-verification.php
│   │   ├── password-changed.php
│   │   └── account-locked.php
│   └── README.md                # This file
```

## Adding New Email Types

To add a new email type, developers only need to:

1. **Add configuration** in `email/config/email-functions.php`:
```php
'new-email-type' => [
    'subject' => 'Your Subject Here',
    'template' => 'new-email-template',
    'variables' => ['variable1', 'variable2']
]
```

2. **Create template** in `email/templates/new-email-template.php`

3. **Use the method** automatically: `sendNewEmailTypeEmail($toEmail, $variable1, $variable2)`

No code changes needed in EmailService!

## Available Email Templates

### Password Reset Email
- **Template**: `email/templates/password-reset.php`
- **Method**: `sendPasswordResetEmail($toEmail, $resetUrl)`
- **Usage**: Sent when user requests password reset

### Welcome Email
- **Template**: `email/templates/welcome.php`
- **Method**: `sendWelcomeEmail($toEmail, $userName, $loginUrl)`
- **Usage**: Sent when new user account is created

### Account Verification Email
- **Template**: `email/templates/account-verification.php`
- **Method**: `sendAccountVerificationEmail($toEmail, $userName, $verificationUrl)`
- **Usage**: Sent when user needs to verify their account

### Password Changed Email
- **Template**: `email/templates/password-changed.php`
- **Method**: `sendPasswordChangedEmail($toEmail, $userName, $loginUrl)`
- **Usage**: Sent when password is successfully changed

### Account Locked Email
- **Template**: `email/templates/account-locked.php`
- **Method**: `sendAccountLockedEmail($toEmail, $userName, $unlockUrl)`
- **Usage**: Sent when account is locked for security 