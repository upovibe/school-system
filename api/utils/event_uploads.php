<?php
// api/utils/event_uploads.php - Event upload utilities

/**
 * Upload event banner image
 * 
 * @param array $file The uploaded file array from $_FILES or a manually parsed request
 * @return array The uploaded file path(s)
 */
function uploadEventBanner($file) {
    $uploadDir = __DIR__ . '/../uploads/events/';
    $thumbnailsDir = $uploadDir . 'thumbnails/';
    
    // Create directories if they don't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    if (!is_dir($thumbnailsDir)) {
        mkdir($thumbnailsDir, 0755, true);
    }
    
    // Validate file
    if (!isValidImageFile($file)) {
        throw new Exception('Invalid file. Only JPEG, PNG, GIF, and WebP images are allowed (max 5MB).');
    }
    
    // Generate unique filename
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Move uploaded file.
    // move_uploaded_file() is for POST requests. For PUT requests where we parse the body manually,
    // the file is already in a temporary location, so we can use rename() to move it.
    if (!rename($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to upload file.');
    }
    
    // Generate thumbnails
    $thumbnails = generateEventThumbnails($filepath, $filename, $thumbnailsDir);
    
    return [
        'original' => 'uploads/events/' . $filename,
        'thumbnails' => $thumbnails
    ];
}

/**
 * Upload multiple event banner images
 * 
 * @param array $files The uploaded files array from $_FILES
 * @return array Array of uploaded file paths
 */
function uploadEventBanners($files) {
    $uploadedFiles = [];
    
    // Handle single file
    if (!is_array($files['name'])) {
        return uploadEventBanner($files);
    }
    
    // Handle multiple files
    $fileCount = count($files['name']);
    for ($i = 0; $i < $fileCount; $i++) {
        if ($files['error'][$i] === UPLOAD_ERR_OK) {
            $file = [
                'name' => $files['name'][$i],
                'type' => $files['type'][$i],
                'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i],
                'size' => $files['size'][$i]
            ];
            
            try {
                $uploadedFiles[] = uploadEventBanner($file);
            } catch (Exception $e) {
                // Log error but continue with other files
                error_log('Error uploading event banner: ' . $e->getMessage());
            }
        }
    }
    
    return $uploadedFiles;
}

/**
 * Validate image file
 * 
 * @param array $file The uploaded file array
 * @return bool True if valid, false otherwise
 */
function isValidImageFile($file) {
    // Check file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        return false;
    }
    
    // Check file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        return false;
    }
    
    // Additional validation using getimagesize
    $imageInfo = getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        return false;
    }
    
    return true;
}

/**
 * Generate thumbnails for event banner
 * 
 * @param string $originalPath Full path to original image
 * @param string $filename Original filename
 * @param string $thumbnailsDir Directory for thumbnails
 * @return array Array of thumbnail paths
 */
function generateEventThumbnails($originalPath, $filename, $thumbnailsDir) {
    $thumbnails = [];
    $sizes = [
        'small' => [150, 150],
        'medium' => [300, 300],
        'large' => [600, 600]
    ];
    
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $nameWithoutExt = pathinfo($filename, PATHINFO_FILENAME);
    
    foreach ($sizes as $size => $dimensions) {
        $thumbnailFilename = $nameWithoutExt . '_' . $size . '.' . $extension;
        $thumbnailPath = $thumbnailsDir . $thumbnailFilename;
        
        if (createThumbnail($originalPath, $thumbnailPath, $dimensions[0], $dimensions[1])) {
            $thumbnails[$size] = 'uploads/events/thumbnails/' . $thumbnailFilename;
        }
    }
    
    return $thumbnails;
}

/**
 * Create thumbnail from image
 * 
 * @param string $sourcePath Source image path
 * @param string $destPath Destination thumbnail path
 * @param int $width Target width
 * @param int $height Target height
 * @return bool True if successful, false otherwise
 */
function createThumbnail($sourcePath, $destPath, $width, $height) {
    try {
        $imageInfo = getimagesize($sourcePath);
        if ($imageInfo === false) {
            return false;
        }
        
        $sourceWidth = $imageInfo[0];
        $sourceHeight = $imageInfo[1];
        $mimeType = $imageInfo['mime'];
        
        // Create source image resource
        $sourceImage = createImageResource($sourcePath, $mimeType);
        if (!$sourceImage) {
            return false;
        }
        
        // Calculate aspect ratio
        $aspectRatio = $sourceWidth / $sourceHeight;
        $targetAspectRatio = $width / $height;
        
        if ($aspectRatio > $targetAspectRatio) {
            // Source is wider
            $cropWidth = round($sourceHeight * $targetAspectRatio);
            $cropHeight = $sourceHeight;
            $cropX = round(($sourceWidth - $cropWidth) / 2);
            $cropY = 0;
        } else {
            // Source is taller
            $cropWidth = $sourceWidth;
            $cropHeight = round($sourceWidth / $targetAspectRatio);
            $cropX = 0;
            $cropY = round(($sourceHeight - $cropHeight) / 2);
        }
        
        // Create thumbnail image
        $thumbnail = imagecreatetruecolor($width, $height);
        
        // Preserve transparency for PNG and GIF
        if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
            imagealphablending($thumbnail, false);
            imagesavealpha($thumbnail, true);
            $transparent = imagecolorallocatealpha($thumbnail, 255, 255, 255, 127);
            imagefill($thumbnail, 0, 0, $transparent);
        }
        
        // Resize and crop
        imagecopyresampled(
            $thumbnail, $sourceImage,
            0, 0, $cropX, $cropY,
            $width, $height, $cropWidth, $cropHeight
        );
        
        // Save thumbnail
        $result = saveImage($thumbnail, $destPath, $mimeType);
        
        // Clean up
        imagedestroy($sourceImage);
        imagedestroy($thumbnail);
        
        return $result;
    } catch (Exception $e) {
        error_log('Error creating thumbnail: ' . $e->getMessage());
        return false;
    }
}

/**
 * Create image resource from file
 * 
 * @param string $path Image file path
 * @param string $mimeType MIME type
 * @return GdImage|false Image resource or false on failure
 */
function createImageResource($path, $mimeType) {
    switch ($mimeType) {
        case 'image/jpeg':
        case 'image/jpg':
            return imagecreatefromjpeg($path);
        case 'image/png':
            return imagecreatefrompng($path);
        case 'image/gif':
            return imagecreatefromgif($path);
        case 'image/webp':
            return imagecreatefromwebp($path);
        default:
            return false;
    }
}

/**
 * Save image to file
 * 
 * @param GdImage $image Image resource
 * @param string $path Output file path
 * @param string $mimeType MIME type
 * @return bool True if successful, false otherwise
 */
function saveImage($image, $path, $mimeType) {
    switch ($mimeType) {
        case 'image/jpeg':
        case 'image/jpg':
            return imagejpeg($image, $path, 85);
        case 'image/png':
            return imagepng($image, $path, 8);
        case 'image/gif':
            return imagegif($image, $path);
        case 'image/webp':
            return imagewebp($image, $path, 85);
        default:
            return false;
    }
}

/**
 * Get event banner info for API response
 * 
 * @param string|array $bannerPath Banner path(s)
 * @return array Banner information
 */
function getEventBannerInfo($bannerPath) {
    if (empty($bannerPath)) {
        return null;
    }
    
    if (is_array($bannerPath)) {
        $info = [];
        foreach ($bannerPath as $path) {
            $info[] = getEventBannerInfo($path);
        }
        return $info;
    }
    
    $fullPath = __DIR__ . '/../' . $bannerPath;
    if (!file_exists($fullPath)) {
        return null;
    }
    
    $imageInfo = getimagesize($fullPath);
    if ($imageInfo === false) {
        return null;
    }
    
    return [
        'path' => $bannerPath,
        'url' => '/api/' . $bannerPath,
        'width' => $imageInfo[0],
        'height' => $imageInfo[1],
        'size' => filesize($fullPath),
        'mime_type' => $imageInfo['mime']
    ];
}

/**
 * Delete event banner and thumbnails
 * 
 * @param string $bannerPath Banner path
 * @return bool True if successful, false otherwise
 */
function deleteEventBanner($bannerPath) {
    if (empty($bannerPath)) {
        return true;
    }
    
    $fullPath = __DIR__ . '/../' . $bannerPath;
    $thumbnailsDir = __DIR__ . '/../uploads/events/thumbnails/';
    
    // Delete original file
    if (file_exists($fullPath)) {
        unlink($fullPath);
    }
    
    // Delete thumbnails
    $filename = basename($bannerPath);
    $nameWithoutExt = pathinfo($filename, PATHINFO_FILENAME);
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    
    $sizes = ['small', 'medium', 'large'];
    foreach ($sizes as $size) {
        $thumbnailPath = $thumbnailsDir . $nameWithoutExt . '_' . $size . '.' . $extension;
        if (file_exists($thumbnailPath)) {
            unlink($thumbnailPath);
        }
    }
    
    return true;
}
?> 