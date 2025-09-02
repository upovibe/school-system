<?php
// api/utils/timetable_resource_uploads.php - Utility functions for timetable resource file uploads

/**
 * Upload timetable resource file
 */
function uploadTimetableResourceFile($file) {
    $uploadDir = __DIR__ . '/../uploads/timetable-resources/';
    
    // Create directories if they don't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Validate file
    if (!isValidTimetableResourceFile($file)) {
        return [
            'success' => false,
            'message' => 'Invalid file. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF files are allowed (max 10MB).'
        ];
    }
    
    // Generate unique filename
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Move uploaded file
    if (!rename($file['tmp_name'], $filepath)) {
        return [
            'success' => false,
            'message' => 'Failed to upload file.'
        ];
    }
    
    return [
        'success' => true,
        'message' => 'File uploaded successfully',
        'filepath' => 'uploads/timetable-resources/' . $filename,
        'filename' => $filename,
        'size' => $file['size']
    ];
}

/**
 * Validate timetable resource file
 * 
 * @param array $file The uploaded file array
 * @return bool True if valid, false otherwise
 */
function isValidTimetableResourceFile($file) {
    // Check file size (max 10MB)
    if ($file['size'] > 10 * 1024 * 1024) {
        return false;
    }
    
    // Check file type
    $allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif'
    ];
    
    if (!in_array($file['type'], $allowedTypes)) {
        return false;
    }
    
    // Check file extension
    $allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    if (!in_array($extension, $allowedExtensions)) {
        return false;
    }
    
    return true;
}

/**
 * Download timetable resource file
 * 
 * @param string $filepath The file path to download
 * @param string $originalFilename The original filename to show to user
 */
function downloadTimetableResourceFile($filepath, $originalFilename = null) {
    $fullPath = __DIR__ . '/../' . $filepath;
    
    if (!file_exists($fullPath)) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        return;
    }
    
    // Get file info
    $fileSize = filesize($fullPath);
    $fileType = mime_content_type($fullPath);
    
    // Set headers for download
    header('Content-Type: ' . $fileType);
    header('Content-Length: ' . $fileSize);
    header('Content-Disposition: attachment; filename="' . ($originalFilename ?: basename($filepath)) . '"');
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    
    // Output file content
    readfile($fullPath);
    exit;
}

/**
 * Delete timetable resource file
 * 
 * @param string $filepath The file path to delete
 * @return bool True if deleted, false otherwise
 */
function deleteTimetableResourceFile($filepath) {
    $fullPath = __DIR__ . '/../' . $filepath;
    
    if (file_exists($fullPath)) {
        return unlink($fullPath);
    }
    
    return false;
}
?>
