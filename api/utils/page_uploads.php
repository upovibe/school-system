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
 * Upload multiple page banners
 */
function uploadPageBanners($files) {
    $uploadedBanners = [];
    foreach ($files['name'] as $key => $name) {
        $file = [
            'name' => $name,
            'type' => $files['type'][$key],
            'tmp_name' => $files['tmp_name'][$key],
            'error' => $files['error'][$key],
            'size' => $files['size'][$key]
        ];
        $result = uploadPageBanner($file);
        if ($result['success']) {
            $uploadedBanners[] = $result['filepath'];
        }
    }
    return $uploadedBanners;
}

/**
 * Delete page banner(s)
 */
function deletePageBanner($bannerPaths) {
    if (is_array($bannerPaths)) {
        foreach ($bannerPaths as $path) {
            deleteFile($path);
        }
        return true;
    } else {
        return deleteFile($bannerPaths);
    }
}

/**
 * Get banner info for multiple banners
 */
function getPageBannerInfo($bannerPaths) {
    if (empty($bannerPaths)) {
        return [];
    }

    $bannerInfo = [];
    foreach ($bannerPaths as $path) {
        $fileInfo = getFileInfo($path);
        if ($fileInfo) {
            $bannerInfo[] = [
                'url' => $fileInfo['url'] ?? null,
                'thumbnails' => $fileInfo['thumbnails'] ?? []
            ];
        }
    }
    return $bannerInfo;
} 