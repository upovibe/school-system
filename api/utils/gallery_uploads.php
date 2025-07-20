<?php
// api/utils/gallery_uploads.php - Upload utilities for gallery images

require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload multiple gallery images
 * 
 * @param array $files - Array of uploaded files from $_FILES['images']
 * @return array - Array containing uploaded image paths
 */
function uploadGalleryImages($files) {
    $uploadDir = __DIR__ . '/../uploads/galleries/';
    $thumbnailsDir = $uploadDir . 'thumbnails/';
    
    // Create directories if they don't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    if (!is_dir($thumbnailsDir)) {
        mkdir($thumbnailsDir, 0755, true);
    }
    
    // Validate files
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB per image
    $maxFiles = 20; // Maximum 20 images per upload
    
    $uploadedImages = [];
    
    // Handle single file or multiple files
    $fileArray = [];
    if (isset($files['name']) && is_array($files['name'])) {
        // Multiple files
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $fileArray[] = [
                    'name' => $files['name'][$i],
                    'type' => $files['type'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'error' => $files['error'][$i],
                    'size' => $files['size'][$i]
                ];
            }
        }
    } else {
        // Single file
        if ($files['error'] === UPLOAD_ERR_OK) {
            $fileArray[] = $files;
        }
    }
    
    // Check file count limit
    if (count($fileArray) > $maxFiles) {
        throw new Exception("Too many files. Maximum {$maxFiles} images allowed per upload.");
    }
    
    foreach ($fileArray as $file) {
        // Validate file type
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        }
        
        // Validate file size
        if ($file['size'] > $maxSize) {
            throw new Exception('File size too large. Maximum size is 5MB per image.');
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $originalPath = $uploadDir . $filename;
        
        // Move uploaded file
        if (!rename($file['tmp_name'], $originalPath)) {
            throw new Exception('Failed to upload file: ' . $file['name']);
        }
        
        // Create thumbnails
        $thumbnails = generateGalleryThumbnails($originalPath, $filename, $thumbnailsDir);
        
        $uploadedImages[] = [
            'original' => 'uploads/galleries/' . $filename,
            'thumbnails' => $thumbnails
        ];
    }
    
    return $uploadedImages;
}

/**
 * Delete gallery images and their thumbnails
 * 
 * @param array $imagePaths - Array of image paths to delete
 * @return bool - True if deletion was successful
 */
function deleteGalleryImages($imagePaths) {
    if (empty($imagePaths) || !is_array($imagePaths)) {
        return true;
    }
    
    $baseDir = __DIR__ . '/../';
    
    foreach ($imagePaths as $imagePath) {
        if (empty($imagePath)) {
            continue;
        }
        
        $originalPath = $baseDir . $imagePath;
        
        // Delete original file
        if (file_exists($originalPath)) {
            unlink($originalPath);
        }
        
        // Delete thumbnails
        $filename = basename($imagePath);
        $thumbnailsDir = $baseDir . 'uploads/galleries/thumbnails/';
        
        $thumbnailSizes = ['small', 'medium', 'large'];
        foreach ($thumbnailSizes as $size) {
            $thumbnailPath = $thumbnailsDir . str_replace('.' . pathinfo($filename, PATHINFO_EXTENSION), '_' . $size . '.' . pathinfo($filename, PATHINFO_EXTENSION), $filename);
            if (file_exists($thumbnailPath)) {
                unlink($thumbnailPath);
            }
        }
    }
    
    return true;
}

/**
 * Add images to existing gallery
 * 
 * @param array $files - Array of uploaded files
 * @param array $existingImages - Array of existing image paths
 * @return array - Array containing all image paths (existing + new)
 */
function addGalleryImages($files, $existingImages = []) {
    $newImages = uploadGalleryImages($files);
    
    // Extract just the original paths for storage
    $newImagePaths = array_map(function($image) {
        return $image['original'];
    }, $newImages);
    
    // Combine existing and new images
    $allImages = array_merge($existingImages, $newImagePaths);
    
    return $allImages;
}

/**
 * Remove specific images from gallery
 * 
 * @param array $imagesToRemove - Array of image paths to remove
 * @param array $existingImages - Array of existing image paths
 * @return array - Array containing remaining image paths
 */
function removeGalleryImages($imagesToRemove, $existingImages) {
    // Delete the files
    deleteGalleryImages($imagesToRemove);
    
    // Remove from array
    $remainingImages = array_diff($existingImages, $imagesToRemove);
    
    return array_values($remainingImages); // Re-index array
}

/**
 * Generate thumbnails for gallery images
 * 
 * @param string $originalPath Full path to original image
 * @param string $filename Original filename
 * @param string $thumbnailsDir Directory for thumbnails
 * @return array Array of thumbnail paths
 */
function generateGalleryThumbnails($originalPath, $filename, $thumbnailsDir) {
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
            $thumbnails[$size] = 'uploads/galleries/thumbnails/' . $thumbnailFilename;
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
?> 