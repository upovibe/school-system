<div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">✅ Application Received</h1>
        <h2 style="margin: 10px 0 0 0; font-size: 20px; font-weight: normal;">Thank you for applying!</h2>
    </div>
    
    <!-- Main Content -->
    <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Dear <strong><?= htmlspecialchars($applicantName) ?></strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We have successfully received your application to <strong><?= htmlspecialchars($schoolName) ?></strong>. Thank you for choosing our school for your child's education.
        </p>
        
        <!-- Application Details Box -->
        <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 25px 0; border-radius: 0 5px 5px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📋 Application Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; width: 40%;">Student Name:</td>
                    <td style="padding: 8px 0;"><?= htmlspecialchars($applicantName) ?></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Grade Applied For:</td>
                    <td style="padding: 8px 0;"><?= htmlspecialchars($grade) ?></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Application Status:</td>
                    <td style="padding: 8px 0; color: #ffc107; font-weight: bold;">Under Review</td>
                </tr>
            </table>
        </div>
        
        <!-- Important Information -->
        <div style="background: #e3f2fd; border: 1px solid #2196f3; padding: 20px; margin: 25px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 15px 0; color: #1976d2; font-size: 18px;">ℹ️ Important Information</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6; color: #1976d2;">
                <li style="margin-bottom: 10px;">Your application is currently under review by our admissions team</li>
                <li style="margin-bottom: 10px;">You will receive your <strong>Application Number</strong> when your application is approved</li>
                <li style="margin-bottom: 10px;">We will contact you if any additional information is needed</li>
                <li style="margin-bottom: 10px;">You will be notified of the final decision via email</li>
            </ul>
        </div>
        
        <!-- Next Steps -->
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 25px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">⏳ What Happens Next?</h3>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.6;">
                <li style="margin-bottom: 10px;">Our admissions team will review your application thoroughly</li>
                <li style="margin-bottom: 10px;">We may contact you for additional information if needed</li>
                <li style="margin-bottom: 10px;">You will receive an email with the final decision</li>
                <li style="margin-bottom: 10px;">If approved, you'll receive your application number and enrollment instructions</li>
            </ol>
        </div>
        
        <!-- Contact Information -->
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; margin: 25px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 15px 0; color: #856404; font-size: 18px;">📞 Questions?</h3>
            <p style="margin: 0; line-height: 1.6; color: #856404;">
                If you have any questions about your application or need to provide additional information, please don't hesitate to contact our admissions office.
            </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for your interest in our school. We look forward to reviewing your application.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6;">
            Best regards,<br><br>
            <strong>The Admissions Team</strong><br>
            <?= htmlspecialchars($schoolName) ?><br>
            <span style="color: #666; font-size: 14px;">This is an automated confirmation. Please keep this email for your records.</span>
        </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #666; font-size: 12px;">
        <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
        <p style="margin: 5px 0 0 0;">For inquiries, please contact the school office directly.</p>
    </div>
</div> 