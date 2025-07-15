<?php
/**
 * Page Upload Configuration
 * Simple setup for page uploads using UploadCore
 */

// Import the upload core
require_once __DIR__ . '/../core/UploadCore.php';

// Page upload configuration
$PAGE_UPLOAD_CONFIG = [
    'banner' => [
        'upload_path' => 'uploads/pages/',
        'max_size' => 5242880, // 5MB
        'create_thumbnails' => true,
        'thumbnail_sizes' => [
            'small' => [150, 150],
            'medium' => [300, 300],
            'large' => [600, 600]
        ]
    ]
];

/**
 * Upload page banner
 */
function uploadPageBanner($file) {
    global $PAGE_UPLOAD_CONFIG;
    return uploadImage($file, $PAGE_UPLOAD_CONFIG['banner']);
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
    return getFileInfo($bannerPath);
} 