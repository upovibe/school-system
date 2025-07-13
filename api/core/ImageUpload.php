<?php

namespace Core;

class ImageUpload
{
    private $uploadDir;
    private $allowedTypes;
    private $maxFileSize;
    private $thumbnails;
    private $logFile;

    public function __construct($uploadDir = 'uploads', $maxFileSize = 5242880) // 5MB default
    {
        $this->uploadDir = rtrim($uploadDir, '/');
        $this->maxFileSize = $maxFileSize;
        $this->allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        $this->thumbnails = true;
        $this->logFile = $this->uploadDir . '/upload_log.txt';
        
        // Create upload directory if it doesn't exist
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }

    /**
     * Upload a single image
     * @param array $file $_FILES array element
     * @param string $category Category folder (profiles, pages, settings, temp)
     * @param string $source Source identifier for replacement
     * @return array Response with status, message, and file info
     */
    public function uploadSingle($file, $category = 'temp', $source = null)
    {
        try {
            // Validate file
            $validation = $this->validateFile($file);
            if (!$validation['valid']) {
                return $validation;
            }

            // Create category directory
            $categoryDir = $this->uploadDir . '/' . $category;
            if (!is_dir($categoryDir)) {
                mkdir($categoryDir, 0755, true);
            }

            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = $this->generateUniqueFilename($extension, $source);
            $filepath = $categoryDir . '/' . $filename;

            // Remove old file if source is provided
            if ($source) {
                $this->removeOldFile($categoryDir, $source);
            }

            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                return [
                    'success' => false,
                    'message' => 'Failed to move uploaded file',
                    'data' => null
                ];
            }

            // Process image (resize, create thumbnail)
            $processed = $this->processImage($filepath, $categoryDir, $filename);

            // Log upload
            $this->logUpload($file, $category, $filename, $source);

            return [
                'success' => true,
                'message' => 'Image uploaded successfully',
                'data' => [
                    'filename' => $filename,
                    'path' => $category . '/' . $filename,
                    'full_path' => $filepath,
                    'size' => filesize($filepath),
                    'thumbnail' => $processed['thumbnail'] ?? null,
                    'source' => $source
                ]
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Upload error: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }

    /**
     * Upload multiple images
     * @param array $files $_FILES array
     * @param string $category Category folder
     * @param string $source Source identifier
     * @return array Response with status and uploaded files
     */
    public function uploadMultiple($files, $category = 'temp', $source = null)
    {
        $results = [];
        $successCount = 0;

        foreach ($files as $file) {
            $result = $this->uploadSingle($file, $category, $source);
            $results[] = $result;
            
            if ($result['success']) {
                $successCount++;
            }
        }

        return [
            'success' => $successCount > 0,
            'message' => "Uploaded {$successCount} of " . count($files) . " images",
            'data' => $results
        ];
    }

    /**
     * Validate uploaded file
     * @param array $file $_FILES array element
     * @return array Validation result
     */
    private function validateFile($file)
    {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
            ];
            
            return [
                'valid' => false,
                'message' => $errors[$file['error']] ?? 'Unknown upload error'
            ];
        }

        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            return [
                'valid' => false,
                'message' => 'File size exceeds maximum allowed size (' . $this->formatBytes($this->maxFileSize) . ')'
            ];
        }

        // Check file type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $this->allowedTypes)) {
            return [
                'valid' => false,
                'message' => 'File type not allowed. Allowed types: ' . implode(', ', array_map('pathinfo', $this->allowedTypes, array_fill(0, count($this->allowedTypes), PATHINFO_EXTENSION)))
            ];
        }

        return ['valid' => true];
    }

    /**
     * Generate unique filename
     * @param string $extension File extension
     * @param string $source Source identifier
     * @return string Unique filename
     */
    private function generateUniqueFilename($extension, $source = null)
    {
        $timestamp = time();
        $random = bin2hex(random_bytes(8));
        
        if ($source) {
            return "{$source}_{$timestamp}_{$random}.{$extension}";
        }
        
        return "img_{$timestamp}_{$random}.{$extension}";
    }

    /**
     * Remove old file with same source
     * @param string $categoryDir Category directory
     * @param string $source Source identifier
     */
    private function removeOldFile($categoryDir, $source)
    {
        $files = glob($categoryDir . '/' . $source . '_*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
    }

    /**
     * Process uploaded image (resize, create thumbnail)
     * @param string $filepath Full path to uploaded file
     * @param string $categoryDir Category directory
     * @param string $filename Original filename
     * @return array Processing results
     */
    private function processImage($filepath, $categoryDir, $filename)
    {
        $result = ['thumbnail' => null];

        if (!$this->thumbnails) {
            return $result;
        }

        try {
            $imageInfo = getimagesize($filepath);
            if (!$imageInfo) {
                return $result;
            }

            $width = $imageInfo[0];
            $height = $imageInfo[1];
            $type = $imageInfo[2];

            // Create thumbnail if image is large enough
            if ($width > 200 || $height > 200) {
                $thumbnailPath = $categoryDir . '/thumb_' . $filename;
                $this->createThumbnail($filepath, $thumbnailPath, $type, 200, 200);
                $result['thumbnail'] = 'thumb_' . $filename;
            }

        } catch (\Exception $e) {
            // Log error but don't fail the upload
            error_log("Image processing error: " . $e->getMessage());
        }

        return $result;
    }

    /**
     * Create thumbnail
     * @param string $sourcePath Source image path
     * @param string $destPath Destination thumbnail path
     * @param int $type Image type
     * @param int $maxWidth Maximum width
     * @param int $maxHeight Maximum height
     */
    private function createThumbnail($sourcePath, $destPath, $type, $maxWidth, $maxHeight)
    {
        switch ($type) {
            case IMAGETYPE_JPEG:
                $source = imagecreatefromjpeg($sourcePath);
                break;
            case IMAGETYPE_PNG:
                $source = imagecreatefrompng($sourcePath);
                break;
            case IMAGETYPE_GIF:
                $source = imagecreatefromgif($sourcePath);
                break;
            case IMAGETYPE_WEBP:
                $source = imagecreatefromwebp($sourcePath);
                break;
            default:
                return;
        }

        $sourceWidth = imagesx($source);
        $sourceHeight = imagesy($source);

        // Calculate thumbnail dimensions
        $ratio = min($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
        $thumbWidth = round($sourceWidth * $ratio);
        $thumbHeight = round($sourceHeight * $ratio);

        $thumbnail = imagecreatetruecolor($thumbWidth, $thumbHeight);

        // Preserve transparency for PNG and GIF
        if ($type == IMAGETYPE_PNG || $type == IMAGETYPE_GIF) {
            imagealphablending($thumbnail, false);
            imagesavealpha($thumbnail, true);
            $transparent = imagecolorallocatealpha($thumbnail, 255, 255, 255, 127);
            imagefilledrectangle($thumbnail, 0, 0, $thumbWidth, $thumbHeight, $transparent);
        }

        imagecopyresampled($thumbnail, $source, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $sourceWidth, $sourceHeight);

        // Save thumbnail
        switch ($type) {
            case IMAGETYPE_JPEG:
                imagejpeg($thumbnail, $destPath, 85);
                break;
            case IMAGETYPE_PNG:
                imagepng($thumbnail, $destPath, 8);
                break;
            case IMAGETYPE_GIF:
                imagegif($thumbnail, $destPath);
                break;
            case IMAGETYPE_WEBP:
                imagewebp($thumbnail, $destPath, 85);
                break;
        }

        imagedestroy($source);
        imagedestroy($thumbnail);
    }

    /**
     * Log upload activity
     * @param array $file Uploaded file info
     * @param string $category Category
     * @param string $filename Generated filename
     * @param string $source Source identifier
     */
    private function logUpload($file, $category, $filename, $source)
    {
        $logEntry = date('Y-m-d H:i:s') . " | " .
                   "Category: {$category} | " .
                   "Original: {$file['name']} | " .
                   "Saved: {$filename} | " .
                   "Size: {$file['size']} | " .
                   "Source: " . ($source ?: 'none') . " | " .
                   "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }

    /**
     * Format bytes to human readable format
     * @param int $bytes Bytes to format
     * @return string Formatted string
     */
    private function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Delete image file
     * @param string $filename Filename to delete
     * @param string $category Category folder
     * @return array Deletion result
     */
    public function deleteImage($filename, $category = 'temp')
    {
        $filepath = $this->uploadDir . '/' . $category . '/' . $filename;
        $thumbnailPath = $this->uploadDir . '/' . $category . '/thumb_' . $filename;

        $deleted = false;
        $errors = [];

        if (is_file($filepath)) {
            if (unlink($filepath)) {
                $deleted = true;
            } else {
                $errors[] = "Failed to delete main file";
            }
        }

        if (is_file($thumbnailPath)) {
            if (!unlink($thumbnailPath)) {
                $errors[] = "Failed to delete thumbnail";
            }
        }

        return [
            'success' => $deleted,
            'message' => $deleted ? 'File deleted successfully' : 'Failed to delete file',
            'errors' => $errors
        ];
    }

    /**
     * Get upload statistics
     * @return array Statistics
     */
    public function getStats()
    {
        $stats = [
            'total_files' => 0,
            'total_size' => 0,
            'categories' => []
        ];

        $categories = ['profiles', 'pages', 'settings', 'temp'];
        
        foreach ($categories as $category) {
            $categoryDir = $this->uploadDir . '/' . $category;
            if (is_dir($categoryDir)) {
                $files = glob($categoryDir . '/*');
                $categorySize = 0;
                $fileCount = 0;
                
                foreach ($files as $file) {
                    if (is_file($file)) {
                        $categorySize += filesize($file);
                        $fileCount++;
                    }
                }
                
                $stats['categories'][$category] = [
                    'files' => $fileCount,
                    'size' => $categorySize,
                    'size_formatted' => $this->formatBytes($categorySize)
                ];
                
                $stats['total_files'] += $fileCount;
                $stats['total_size'] += $categorySize;
            }
        }
        
        $stats['total_size_formatted'] = $this->formatBytes($stats['total_size']);
        
        return $stats;
    }

    /**
     * Set allowed file types
     * @param array $types Array of MIME types
     */
    public function setAllowedTypes($types)
    {
        $this->allowedTypes = $types;
    }

    /**
     * Set maximum file size
     * @param int $size Size in bytes
     */
    public function setMaxFileSize($size)
    {
        $this->maxFileSize = $size;
    }

    /**
     * Enable/disable thumbnails
     * @param bool $enabled Whether to create thumbnails
     */
    public function setThumbnails($enabled)
    {
        $this->thumbnails = $enabled;
    }
} 