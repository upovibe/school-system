<?php
/**
 * Assignment Upload Configuration
 * Handles file uploads for assignments and student submissions
 */

// Import the upload core
require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload assignment attachment (teacher uploads)
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
        'create_thumbnails' => false
    ];
    return uploadFile($file, $config);
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
            'application/x-rar-compressed'
        ],
        'create_thumbnails' => false
    ];
    return uploadFile($file, $config);
}

/**
 * Upload multiple assignment attachments
 */
function uploadAssignmentAttachments($files) {
    $uploadedFiles = [];

    // Handle empty or invalid files array
    if (empty($files) || !is_array($files)) {
        return $uploadedFiles;
    }

    // Check if this is a single file upload
    if (!isset($files['name']) || !is_array($files['name'])) {
        $result = uploadAssignmentAttachment($files);
        if ($result['success']) {
            $uploadedFiles[] = $result['filepath'];
        }
    } else {
        // This is a standard multiple file upload
        $fileCount = count($files['name']);
        
        // Validate that all required arrays have the same length
        $requiredKeys = ['name', 'type', 'tmp_name', 'error', 'size'];
        foreach ($requiredKeys as $key) {
            if (!isset($files[$key]) || !is_array($files[$key]) || count($files[$key]) !== $fileCount) {
                return $uploadedFiles;
            }
        }
        
        foreach ($files['name'] as $key => $name) {
            
            // Skip empty file inputs
            if ($files['error'][$key] === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            
            // Skip files with upload errors
            if ($files['error'][$key] !== UPLOAD_ERR_OK) {
                continue;
            }
            
            $file = [
                'name' => $name,
                'type' => $files['type'][$key],
                'tmp_name' => $files['tmp_name'][$key],
                'error' => $files['error'][$key],
                'size' => $files['size'][$key]
            ];
            $result = uploadAssignmentAttachment($file);
            if ($result['success']) {
                $uploadedFiles[] = $result['filepath'];
            }
        }
    }
    
    return $uploadedFiles;
}

/**
 * Upload multiple student submission files
 */
function uploadStudentSubmissions($files) {
    $uploadedFiles = [];

    // Handle empty or invalid files array
    if (empty($files) || !is_array($files)) {
        return $uploadedFiles;
    }

    // Check if this is a single file upload
    if (!isset($files['name']) || !is_array($files['name'])) {
        $result = uploadStudentSubmission($files);
        if ($result['success']) {
            $uploadedFiles[] = $result['filepath'];
        }
    } else {
        // This is a standard multiple file upload
        $fileCount = count($files['name']);
        
        // Validate that all required arrays have the same length
        $requiredKeys = ['name', 'type', 'tmp_name', 'error', 'size'];
        foreach ($requiredKeys as $key) {
            if (!isset($files[$key]) || !is_array($files[$key]) || count($files[$key]) !== $fileCount) {
                return $uploadedFiles;
            }
        }
        
        foreach ($files['name'] as $key => $name) {
            
            // Skip empty file inputs
            if ($files['error'][$key] === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            
            // Skip files with upload errors
            if ($files['error'][$key] !== UPLOAD_ERR_OK) {
                continue;
            }
            
            $file = [
                'name' => $name,
                'type' => $files['type'][$key],
                'tmp_name' => $files['tmp_name'][$key],
                'error' => $files['error'][$key],
                'size' => $files['size'][$key]
            ];
            $result = uploadStudentSubmission($file);
            if ($result['success']) {
                $uploadedFiles[] = $result['filepath'];
            }
        }
    }
    
    return $uploadedFiles;
}

/**
 * Delete assignment file(s)
 */
function deleteAssignmentFiles($filePaths) {
    if (empty($filePaths)) {
        return true;
    }

    $pathsToDelete = [];
    if (is_string($filePaths)) {
        $decoded = json_decode($filePaths, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $pathsToDelete = $decoded;
        } else {
            $pathsToDelete = [$filePaths];
        }
    } elseif (is_array($filePaths)) {
        $pathsToDelete = $filePaths;
    } else {
        return false;
    }

    $success = true;
    foreach ($pathsToDelete as $path) {
        if (!empty($path)) {
            $result = deleteFile($path);
            if (!$result) {
                $success = false;
            }
        }
    }

    return $success;
}

/**
 * Get assignment file info
 */
function getAssignmentFileInfo($filePaths) {
    if (empty($filePaths)) {
        return [];
    }

    $pathsToCheck = [];
    if (is_string($filePaths)) {
        $decoded = json_decode($filePaths, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $pathsToCheck = $decoded;
        } else {
            $pathsToCheck = [$filePaths];
        }
    } elseif (is_array($filePaths)) {
        $pathsToCheck = $filePaths;
    } else {
        return [];
    }

    $fileInfo = [];
    foreach ($pathsToCheck as $path) {
        if (!empty($path)) {
            $info = getFileInfo($path);
            if ($info) {
                $fileInfo[] = $info;
            }
        }
    }

    return $fileInfo;
} 