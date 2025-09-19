<?php
// api/utils/pdf_generator.php - PDF generation for admission letters using TCPDF

require_once __DIR__ . '/../vendor/autoload.php';

/**
 * Generate admission approval letter PDF
 */
function generateAdmissionApprovalPDF($data) {
    $html = generateAdmissionApprovalHTML($data);
    return generatePDFFromHTML($html, 'admission_approval_' . $data['applicantNumber'] . '.pdf');
}

/**
 * Generate admission rejection letter PDF
 */
function generateAdmissionRejectionPDF($data) {
    $html = generateAdmissionRejectionHTML($data);
    return generatePDFFromHTML($html, 'admission_rejection_' . $data['applicantNumber'] . '.pdf');
}

/**
 * Generate HTML for admission approval letter
 */
function generateAdmissionApprovalHTML($data) {
    $schoolName = $data['schoolName'];
    $parentName = $data['parentName'];
    $studentName = $data['studentName'];
    $applicantNumber = $data['applicantNumber'];
    $level = $data['level'];
    $class = $data['class'];
    $programme = $data['programme'] ?? '';
    $schoolType = $data['schoolType'];
    $academicYear = $data['academicYear'];
    $schoolSettings = $data['schoolSettings'] ?? [];
    
    return '
    <div style="font-family: times; font-size: 12px; line-height: 1.4;">
        <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px; border-bottom: 2px solid #000;">
            <tr>
                <td style="width: 20%; vertical-align: top;">
                    ' . (!empty($schoolSettings['application_logo']) ? '<img src="' . htmlspecialchars($schoolSettings['application_logo']) . '" style="max-width: 80px; max-height: 60px;" />' : '') . '
                </td>
                <td style="width: 60%; text-align: center; vertical-align: top;">
                    <h1 style="font-size: 24px; font-weight: bold; margin: 0; text-decoration: underline;">ADMISSION APPROVAL LETTER</h1>
                </td>
                <td style="width: 20%; text-align: right; vertical-align: top;">
                    <div style="font-size: 18px; font-weight: bold;">' . htmlspecialchars($schoolName) . '</div>
                    <div style="font-size: 12px; font-style: italic; color: #666;">Excellence in Education</div>
                </td>
            </tr>
        </table>

        <div style="text-align: right; margin-bottom: 20px;">
            <strong>Date:</strong> ' . date('F j, Y') . '
        </div>

        <div style="margin-bottom: 20px;">
            Dear ' . htmlspecialchars($parentName) . ',
        </div>

        <div style="margin-bottom: 15px; text-align: justify;">
            We are pleased to inform you that after careful consideration of your child\'s application, we are delighted to offer admission to <strong>' . htmlspecialchars($studentName) . '</strong> for the <strong>' . htmlspecialchars($academicYear) . '</strong> academic year.
        </div>

        <div style="text-align: center; margin: 20px 0; padding: 10px 0;">
            <div style="font-size: 18px; font-weight: bold; text-decoration: underline;">ADMISSION APPROVED</div>
        </div>

        <div style="margin: 20px 0;">
            <h4 style="margin: 0 0 15px 0; text-decoration: underline; font-size: 14px;">Application Details</h4>
            <table cellpadding="2" cellspacing="0" style="width: 100%;">
                <tr>
                    <td style="width: 30%; font-weight: bold; padding: 2px 0;">Student Name:</td>
                    <td style="width: 70%; padding: 2px 0;">' . htmlspecialchars($studentName) . '</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; padding: 2px 0;">Application Number:</td>
                    <td style="padding: 2px 0;"><strong>' . htmlspecialchars($applicantNumber) . '</strong></td>
                </tr>
                <tr>
                    <td style="font-weight: bold; padding: 2px 0;">Level:</td>
                    <td style="padding: 2px 0;">' . htmlspecialchars($level) . '</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; padding: 2px 0;">Class:</td>
                    <td style="padding: 2px 0;">' . htmlspecialchars($class) . '</td>
                </tr>' .
                (!empty($programme) ? '<tr><td style="font-weight: bold; padding: 2px 0;">Programme:</td><td style="padding: 2px 0;">' . htmlspecialchars($programme) . '</td></tr>' : '') . '
                <tr>
                    <td style="font-weight: bold; padding: 2px 0;">School Type:</td>
                    <td style="padding: 2px 0;">' . htmlspecialchars($schoolType) . '</td>
                </tr>
            </table>
        </div>

        <div style="margin: 20px 0;">
            <h4 style="margin: 15px 0 10px 0; text-decoration: underline; font-size: 14px;">Next Steps for Enrollment:</h4>
            <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Contact the school office within <strong>7 days</strong> to confirm your acceptance of this offer</li>
                <li style="margin-bottom: 8px;">Submit the following required documents:
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Original birth certificate</li>
                        <li>Previous school reports/transcripts</li>
                        <li>Two recent passport photographs</li>
                        <li>Medical certificate (if required)</li>
                    </ul>
                </li>
                <li style="margin-bottom: 8px;">Complete the enrollment form and pay the required fees</li>
                <li style="margin-bottom: 8px;">Attend the orientation session (date and time will be communicated)</li>
            </ol>
        </div>

        <div style="margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; text-decoration: underline; font-size: 14px;">Important Information:</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">This admission is valid for the <strong>' . htmlspecialchars($academicYear) . '</strong> academic year only</li>
                <li style="margin-bottom: 8px;">Failure to complete enrollment within 7 days may result in forfeiture of this admission</li>
                <li style="margin-bottom: 8px;">Please bring this letter when visiting the school office</li>
                <li style="margin-bottom: 8px;">All fees must be paid before the commencement of classes</li>
            </ul>
        </div>

        <div style="margin: 15px 0; text-align: justify;">
            We look forward to welcoming your child to our school community and supporting their educational journey. Our dedicated staff is committed to providing quality education and fostering academic excellence.
        </div>

        <div style="margin-top: 30px;">
            <p>Congratulations on this achievement!</p>
            <div style="margin-top: 40px; text-align: right;">
                <p><strong>The Admissions Committee</strong><br>' . htmlspecialchars($schoolName) . '</p>
            </div>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #000; padding-top: 15px;">
            <p><strong>This is an official admission letter. Please keep it safe for your records.</strong></p>
            <p>For inquiries, please contact the school office directly.</p>
        </div>
    </div>';
}

/**
 * Generate HTML for admission rejection letter
 */
function generateAdmissionRejectionHTML($data) {
    $schoolName = $data['schoolName'];
    $parentName = $data['parentName'];
    $studentName = $data['studentName'];
    $level = $data['level'];
    $class = $data['class'];
    $programme = $data['programme'] ?? '';
    $academicYear = $data['academicYear'];
    $schoolSettings = $data['schoolSettings'] ?? [];
    
    return '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Admission Decision Letter - ' . htmlspecialchars($schoolName) . '</title>
        <style>
            body { font-family: "Times New Roman", serif; margin: 0; padding: 20px; color: #000; line-height: 1.6; }
            .letter-container { max-width: 800px; margin: 0 auto; background: white; }
            .letter-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .school-logo { max-width: 80px; max-height: 60px; object-fit: contain; }
            .school-info { text-align: right; }
            .school-name { font-size: 24px; font-weight: bold; margin: 0; }
            .school-tagline { font-size: 14px; color: #666; margin: 0; font-style: italic; }
            .letter-title { font-size: 20px; font-weight: bold; text-align: center; margin: 30px 0; text-decoration: underline; }
            .letter-content { font-size: 14px; line-height: 1.8; }
            .date-line { text-align: right; margin-bottom: 20px; }
            .greeting { margin-bottom: 20px; }
            .content-paragraph { margin-bottom: 15px; text-align: justify; }
            .decision-notice { text-align: center; margin: 20px 0; padding: 10px 0; }
            .decision-text { font-size: 18px; font-weight: bold; color: #000; margin: 0; text-decoration: underline; }
            .application-details { margin: 20px 0; }
            .details-table { width: 100%; border-collapse: collapse; }
            .details-table td { padding: 1px 0; border: none; vertical-align: top; }
            .details-table .label { font-weight: bold; width: 25%; padding-right: 10px; }
            .decision-explanation { margin: 20px 0; }
            .decision-explanation h4 { font-size: 16px; margin: 15px 0 10px 0; text-decoration: underline; }
            .decision-explanation ul { margin: 0; padding-left: 20px; }
            .decision-explanation li { margin-bottom: 8px; }
            .contact-info { margin: 20px 0; }
            .contact-info h4 { margin: 0 0 10px 0; font-size: 14px; text-decoration: underline; }
            .closing { margin-top: 30px; }
            .signature-line { margin-top: 40px; text-align: right; }
            .letter-footer { margin-top: 30px; text-align: center; font-size: 12px; border-top: 1px solid #000; padding-top: 15px; }
        </style>
    </head>
    <body>
        <div class="letter-container">
            <div class="letter-header">
                <img src="' . htmlspecialchars($schoolSettings['application_logo'] ?? '') . '" alt="School Logo" class="school-logo">
                <div class="school-info">
                    <div class="school-name">' . htmlspecialchars($schoolName) . '</div>
                    <div class="school-tagline">Excellence in Education</div>
                </div>
            </div>

            <div class="letter-title">ADMISSION DECISION LETTER</div>

            <div class="letter-content">
                <div class="date-line"><strong>Date:</strong> ' . date('F j, Y') . '</div>
                <div class="greeting">Dear ' . htmlspecialchars($parentName) . ',</div>
                <div class="content-paragraph">Thank you for your interest in <strong>' . htmlspecialchars($schoolName) . '</strong> and for taking the time to submit an application for your child, <strong>' . htmlspecialchars($studentName) . '</strong>.</div>
                <div class="content-paragraph">After careful consideration of all applications received for the <strong>' . htmlspecialchars($academicYear) . '</strong> academic year, we regret to inform you that we are unable to offer admission to your child at this time.</div>
                <div class="decision-notice"><div class="decision-text">ADMISSION NOT OFFERED</div></div>
                <div class="application-details">
                    <h4 style="margin: 0 0 15px 0; text-decoration: underline;">Application Details</h4>
                    <table class="details-table">
                        <tr><td class="label">Student Name:</td><td>' . htmlspecialchars($studentName) . '</td></tr>
                        <tr><td class="label">Level Applied:</td><td>' . htmlspecialchars($level) . '</td></tr>
                        <tr><td class="label">Class Applied:</td><td>' . htmlspecialchars($class) . '</td></tr>' .
                        (!empty($programme) ? '<tr><td class="label">Programme:</td><td>' . htmlspecialchars($programme) . '</td></tr>' : '') . '
                    </table>
                </div>
                <div class="decision-explanation">
                    <h4>Decision Information:</h4>
                    <ul>
                        <li>This decision was made after careful review of all applications received</li>
                        <li>The number of qualified applicants exceeded the available spaces for this academic year</li>
                        <li>This decision is final for the <strong>' . htmlspecialchars($academicYear) . '</strong> academic year</li>
                    </ul>
                </div>
                <div class="contact-info">
                    <h4>Questions or Concerns:</h4>
                    <p style="margin: 0;">If you have any questions about this decision or would like to discuss your child\'s educational options, please don\'t hesitate to contact our admissions office. We are here to help and support families in finding the best educational path for their children.</p>
                </div>
                <div class="content-paragraph">We appreciate your interest in our school and wish your child every success in their educational journey. Thank you for considering <strong>' . htmlspecialchars($schoolName) . '</strong>.</div>
                <div class="closing">
                    <div class="signature-line">
                        <p><strong>The Admissions Committee</strong><br>' . htmlspecialchars($schoolName) . '</p>
                    </div>
                </div>
            </div>
            <div class="letter-footer">
                <p><strong>This is an official communication. Please keep it for your records.</strong></p>
                <p>For inquiries, please contact the school office directly.</p>
            </div>
        </div>
    </body>
    </html>';
}

/**
 * Generate PDF from HTML using TCPDF
 */
function generatePDFFromHTML($html, $filename) {
    try {
        // Create a temporary directory for the PDF
        $tempDir = __DIR__ . '/../temp/';
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        
        $pdfPath = $tempDir . $filename;
        
        // Create new TCPDF object
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        
        // Set document information
        $pdf->SetCreator('School Management System');
        $pdf->SetAuthor('School Management System');
        $pdf->SetTitle('Admission Letter');
        $pdf->SetSubject('Admission Letter');
        
        // Set default header data
        $pdf->SetHeaderData('', 0, '', '');
        
        // Set header and footer fonts
        $pdf->setHeaderFont(Array(PDF_FONT_NAME_MAIN, '', PDF_FONT_SIZE_MAIN));
        $pdf->setFooterFont(Array(PDF_FONT_NAME_DATA, '', PDF_FONT_SIZE_DATA));
        
        // Set default monospaced font
        $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
        
        // Set margins
        $pdf->SetMargins(15, 15, 15);
        $pdf->SetHeaderMargin(5);
        $pdf->SetFooterMargin(10);
        
        // Set auto page breaks
        $pdf->SetAutoPageBreak(TRUE, 25);
        
        // Set image scale factor
        $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);
        
        // Add a page
        $pdf->AddPage();
        
        // Convert HTML to PDF
        $pdf->writeHTML($html, true, false, true, false, '');
        
        // Save the PDF
        $pdf->Output($pdfPath, 'F');
        
        // Return the path to the actual PDF file
        return $pdfPath;
        
    } catch (Exception $e) {
        error_log('PDF generation error: ' . $e->getMessage());
        return false;
    }
}
