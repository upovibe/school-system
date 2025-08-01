<?php
// api/utils/assignment_uploads.php - Utility functions for assignment file uploads

require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload assignment attachment (for teachers)
 */
function uploadAssignmentAttachment($file) {
    $config = [
        'upload_path' => 'uploads/assignments/attachments/',
        'max_size' => 10485760, // 10MB
        'allowed_types' => [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ],
        'allowed_extensions' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif']
    ];
    
    return UploadCore::uploadFile($file, $config);
}

/**
 * Upload student submission file
 */
function uploadStudentSubmission($file) {
    $config = [
        'upload_path' => 'uploads/assignments/submissions/',
        'max_size' => 10485760, // 10MB
        'allowed_types' => [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed'
        ],
        'allowed_extensions' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar', '7z']
    ];
    
    return UploadCore::uploadFile($file, $config);
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