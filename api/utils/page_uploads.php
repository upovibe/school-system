<?php
/**
 * Page Upload Configuration
 * Simple setup for page uploads using UploadCore
 */

// Import the upload core
require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload page banner
 */
function uploadPageBanner($file) {
    $config = [
        'upload_path' => 'uploads/pages/',
        'max_size' => 5242880, // 5MB
        'create_thumbnails' => true,
        'thumbnail_sizes' => [
            'small' => [150, 150],
            'medium' => [300, 300],
            'large' => [600, 600]
        ]
    ];
    return uploadImage($file, $config);
}

/**
 * Delete page banner
 */
function deletePageBanner($bannerPath) {
    return deleteFile($bannerPath);
}

/**
 * Get banner info
 */
function getPageBannerInfo($bannerPath) {
    if (!$bannerPath) {
        return [
            'url' => null,
            'thumbnails' => []
        ];
    }
    
    $fileInfo = getFileInfo($bannerPath);
    if (!$fileInfo) {
        return [
            'url' => null,
            'thumbnails' => []
        ];
    }
    
    // Ensure we return the expected structure
    return [
        'url' => $fileInfo ? ($fileInfo['url'] ?? null) : null,
        'thumbnails' => $fileInfo ? ($fileInfo['thumbnails'] ?? []) : []
    ];
} 