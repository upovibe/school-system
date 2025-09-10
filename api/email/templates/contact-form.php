<?php
/**
 * Contact Form Email Template
 * 
 * Template for contact form submission notifications
 */

$name = $variables['name'] ?? 'Unknown';
$email = $variables['email'] ?? 'Unknown';
$phone = $variables['phone'] ?? 'Not provided';
$message = $variables['message'] ?? 'No message provided';
$submissionDate = $variables['submissionDate'] ?? date('F j, Y \a\t g:i A');
$subject = $variables['subject'] ?? 'No subject';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .info-item.full-width {
            grid-column: 1 / -1;
        }
        .info-label {
            font-weight: 600;
            color: #555;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-value {
            color: #333;
            font-size: 16px;
        }
        .message-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        .message-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
        }
        .message-content {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            white-space: pre-wrap;
            font-size: 15px;
            line-height: 1.6;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        .school-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        .school-info h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
            font-size: 18px;
        }
        .school-info p {
            margin: 0;
            color: #555;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            .info-item.full-width {
                grid-column: 1;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📧 New Contact Form Submission</h1>
            <p>Someone has contacted your school through the website</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- School Info -->
            <div class="school-info">
                <h3>🏫 School System Contact Form</h3>
                <p>This message was submitted through your school's contact form</p>
            </div>
            
            <!-- Contact Information -->
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value"><?php echo htmlspecialchars($name); ?></div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">
                        <a href="mailto:<?php echo htmlspecialchars($email); ?>" style="color: #667eea; text-decoration: none;">
                            <?php echo htmlspecialchars($email); ?>
                        </a>
                    </div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value"><?php echo htmlspecialchars($phone); ?></div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Submitted</div>
                    <div class="info-value"><?php echo htmlspecialchars($submissionDate); ?></div>
                </div>
                
                <?php if (!empty($subject)): ?>
                <div class="info-item full-width">
                    <div class="info-label">Subject</div>
                    <div class="info-value"><?php echo htmlspecialchars($subject); ?></div>
                </div>
                <?php endif; ?>
            </div>
            
            <!-- Message -->
            <div class="message-section">
                <h3>💬 Message</h3>
                <div class="message-content"><?php echo htmlspecialchars($message); ?></div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>This email was automatically generated by your school's contact form system.</p>
            <p>Please respond directly to the sender using the email address provided above.</p>
        </div>
    </div>
</body>
</html>
