<?php
// api/utils/assignment_uploads.php - Utility functions for assignment file uploads

/**
 * Upload assignment attachment (for teachers)
 */
function uploadAssignmentAttachment($file) {
    $uploadDir = __DIR__ . '/../uploads/assignments/attachments/';
    
    // Create directories if they don't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Validate file
    if (!isValidAssignmentFile($file)) {
        return [
            'success' => false,
            'message' => 'Invalid file. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF files are allowed (max 10MB).'
        ];
    }
    
    // Generate unique filename
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Move uploaded file.
    // move_uploaded_file() is for POST requests. For PUT requests where we parse the body manually,
    // the file is already in a temporary location, so we can use rename() to move it.
    if (!rename($file['tmp_name'], $filepath)) {
        return [
            'success' => false,
            'message' => 'Failed to upload file.'
        ];
    }
    
    return [
        'success' => true,
        'message' => 'File uploaded successfully',
        'filepath' => 'uploads/assignments/attachments/' . $filename,
        'filename' => $filename,
        'size' => $file['size']
    ];
}

/**
 * Validate assignment file
 * 
 * @param array $file The uploaded file array
 * @return bool True if valid, false otherwise
 */
function isValidAssignmentFile($file) {
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
 * Upload student submission file
 */
function uploadStudentSubmission($file) {
    $uploadDir = __DIR__ . '/../uploads/assignments/submissions/';
    
    // Create directories if they don't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Validate file
    if (!isValidAssignmentFile($file)) {
        return [
            'success' => false,
            'message' => 'Invalid file. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF files are allowed (max 10MB).'
        ];
    }
    
    // Generate unique filename
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Move uploaded file.
    // move_uploaded_file() is for POST requests. For PUT requests where we parse the body manually,
    // the file is already in a temporary location, so we can use rename() to move it.
    if (!rename($file['tmp_name'], $filepath)) {
        return [
            'success' => false,
            'message' => 'Failed to upload file.'
        ];
    }
    
    return [
        'success' => true,
        'message' => 'File uploaded successfully',
        'filepath' => 'uploads/assignments/submissions/' . $filename,
        'filename' => $filename,
        'size' => $file['size']
    ];
}

/**
 * Delete assignment files
 */
function deleteAssignmentFiles($filepath) {
    if (file_exists($filepath)) {
        unlink($filepath);
        return true;
    }
    return false;
}

/**
 * Get file size in human readable format
 */
function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } elseif ($bytes > 1) {
        return $bytes . ' bytes';
    } elseif ($bytes == 1) {
        return $bytes . ' byte';
    } else {
        return '0 bytes';
    }
}

/**
 * Get file extension from filename
 */
function getFileExtension($filename) {
    return strtolower(pathinfo($filename, PATHINFO_EXTENSION));
}

/**
 * Check if file type is allowed
 */
function isAllowedFileType($filename, $allowedExtensions) {
    $extension = getFileExtension($filename);
    return in_array($extension, $allowedExtensions);
}
?> 