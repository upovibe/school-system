# Email Configuration

This email system uses environment variables for configuration, similar to Laravel.

## Environment Variables

Create a `.env` file in the `api` directory with the following variables:

```env
# Email Configuration
MAIL_MAILER=smtp
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
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
```

### 2. Mailtrap (for testing)
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
```

### 3. Development (log emails)
```env
MAIL_MAILER=log
```

### 4. PHP Mail (fallback)
```env
MAIL_MAILER=mail
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
api/email/
├── config/
│   └── mail.php          # Email configuration
├── services/
│   └── EmailService.php  # Email service class
├── templates/            # Email templates
│   ├── password-reset.php
│   └── welcome.php
└── README.md            # This file
```

## Available Email Templates

### Password Reset Email
- **Template**: `templates/password-reset.php`
- **Method**: `sendPasswordResetEmail($toEmail, $resetToken, $resetUrl)`
- **Usage**: Sent when user requests password reset

### Welcome Email
- **Template**: `templates/welcome.php`
- **Method**: `sendWelcomeEmail($toEmail, $userName, $loginUrl)`
- **Usage**: Sent when new user account is created 