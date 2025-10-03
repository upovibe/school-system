<?php
// api/utils/student_uploads.php - Upload utilities for student passport photos

require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload student passport photo
 * 
 * @param array $file - The uploaded file array from $_FILES
 * @return array - Array containing original and thumbnail paths
 */
function uploadStudentPassport($file) {
    $config = [
        'upload_path' => 'uploads/profiles/',
        'max_size' => 2097152, // 2MB - smaller than news/events since it's a profile photo
        'create_thumbnails' => true,
        'thumbnail_sizes' => [
            'small' => [100, 100],   // Small thumbnail for lists
            'medium' => [200, 200],  // Medium for cards
            'large' => [400, 400]    // Large for profile views
        ],
        'allowed_types' => ['jpg', 'jpeg', 'png', 'webp'],
        'aspect_ratio' => 'square' // Force square aspect ratio for passport photos
    ];
    
    $result = uploadImage($file, $config);
    if (!$result['success']) {
        throw new Exception($result['message']);
    }
    
    return [
        'original' => 'uploads/profiles/' . $result['filename'],
        'thumbnails' => $result['thumbnails'] ?? []
    ];
}

/**
 * Delete student passport photo and its thumbnails
 * 
 * @param string $imagePath - The image path to delete
 * @return bool - True if deletion was successful
 */
function deleteStudentPassport($imagePath) {
    if (empty($imagePath)) {
        return true;
    }
    
    $baseDir = __DIR__ . '/../';
    $originalPath = $baseDir . $imagePath;
    $result = deleteFile($originalPath);
    return $result['success'] ?? true;
}

/**
 * Update student passport photo (delete old, upload new)
 * 
 * @param array $newFile - The new uploaded file array
 * @param string $oldImagePath - The old image path to delete
 * @return array - Array containing new original and thumbnail paths
 */
function updateStudentPassport($newFile, $oldImagePath = null) {
    // Delete old image if it exists
    if ($oldImagePath) {
        deleteStudentPassport($oldImagePath);
    }
    
    // Upload new image
    return uploadStudentPassport($newFile);
}

/**
 * Get student passport photo info for display
 * 
 * @param string $imagePath - The image path
 * @return array - Array containing display information
 */
function getStudentPassportInfo($imagePath) {
    if (empty($imagePath)) {
        return [
            'has_image' => false,
            'original' => null,
            'thumbnails' => []
        ];
    }
    
    $baseDir = __DIR__ . '/../';
    $originalPath = $baseDir . $imagePath;
    
    return [
        'has_image' => file_exists($originalPath),
        'original' => $imagePath,
        'thumbnails' => [
            'small' => str_replace('.', '_small.', $imagePath),
            'medium' => str_replace('.', '_medium.', $imagePath),
            'large' => str_replace('.', '_large.', $imagePath)
        ]
    ];
}
?>
