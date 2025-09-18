<?php
// api/utils/event_uploads.php - Upload utilities for events

require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload event banner image
 * 
 * @param array $file - The uploaded file array from $_FILES
 * @return array - Array containing original and thumbnail paths
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
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }
    
    if ($file['size'] > $maxSize) {
        throw new Exception('File size too large. Maximum size is 5MB.');
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $originalPath = $uploadDir . $filename;
    
    // Move uploaded file.
    // move_uploaded_file() is for POST requests. For PUT requests where we parse the body manually,
    // the file is already in a temporary location, so we can use rename() to move it.
    if (!rename($file['tmp_name'], $originalPath)) {
        throw new Exception('Failed to upload file.');
    }
    
    // Create thumbnails only if GD extension is available
    $thumbnails = [];
    if (extension_loaded('gd')) {
        $thumbnails = generateEventThumbnails($originalPath, $filename, $thumbnailsDir);
    } else {
        error_log('GD extension not available. Skipping thumbnail generation.');
    }
    
    return [
        'original' => 'uploads/events/' . $filename,
        'thumbnails' => $thumbnails
    ];
}

/**
 * Delete event banner image and its thumbnails
 * 
 * @param string $imagePath - The image path to delete
 * @return bool - True if deletion was successful
 */
function deleteEventBanner($imagePath) {
    if (empty($imagePath)) {
        return true;
    }
    
    $baseDir = __DIR__ . '/../';
    $originalPath = $baseDir . $imagePath;
    
    // Delete original file
    if (file_exists($originalPath)) {
        unlink($originalPath);
    }
    
    // Delete thumbnails
    $filename = basename($imagePath);
    $thumbnailsDir = $baseDir . 'uploads/events/thumbnails/';
    
    $thumbnailSizes = ['small', 'medium', 'large'];
    foreach ($thumbnailSizes as $size) {
        $thumbnailPath = $thumbnailsDir . str_replace('.' . pathinfo($filename, PATHINFO_EXTENSION), '_' . $size . '.' . pathinfo($filename, PATHINFO_EXTENSION), $filename);
        if (file_exists($thumbnailPath)) {
            unlink($thumbnailPath);
        }
    }
    
    return true;
}

/**
 * Update event banner image (delete old, upload new)
 * 
 * @param array $newFile - The new uploaded file array
 * @param string $oldImagePath - The old image path to delete
 * @return array - Array containing new original and thumbnail paths
 */
function updateEventBanner($newFile, $oldImagePath = null) {
    // Delete old image if it exists
    if ($oldImagePath) {
        deleteEventBanner($oldImagePath);
    }
    
    // Upload new image
    return uploadEventBanner($newFile);
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
    // Check if GD extension is available
    if (!extension_loaded('gd')) {
        error_log('GD extension not available. Cannot generate thumbnails.');
        return [];
    }
    
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
        // Check if GD extension is available
        if (!extension_loaded('gd')) {
            error_log('GD extension not available. Cannot create thumbnail.');
            return false;
        }
        
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
    // Check if GD extension is available
    if (!extension_loaded('gd')) {
        error_log('GD extension not available. Cannot create image resource.');
        return false;
    }
    
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
    // Check if GD extension is available
    if (!extension_loaded('gd')) {
        error_log('GD extension not available. Cannot save image.');
        return false;
    }
    
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
?>