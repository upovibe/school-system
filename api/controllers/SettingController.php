<?php
// api/controllers/SettingController.php - Controller for settings management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/ImageUpload.php';
require_once __DIR__ . '/../models/SettingModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class SettingController {
    private $pdo;
    private $settingModel;
    private $imageUpload;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->settingModel = new SettingModel($pdo);
        $this->imageUpload = new \Core\ImageUpload('uploads', 5242880); // 5MB max
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all settings (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $settings = $this->settingModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new setting (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['setting_key'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting key is required'
                ]);
                return;
            }
            
            // Check if setting key already exists
            $existingSetting = $this->settingModel->findByKey($data['setting_key']);
            if ($existingSetting) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting with this key already exists'
                ]);
                return;
            }
            
            $settingId = $this->settingModel->create($data);
            
            // Log the action
            $this->logAction('setting_created', "Created setting: {$data['setting_key']}", [
                'setting_id' => $settingId,
                'setting_key' => $data['setting_key'],
                'category' => $data['category'] ?? 'general'
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => ['id' => $settingId],
                'message' => 'Setting created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific setting (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $setting = $this->settingModel->findById($id);
            
            if (!$setting) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $setting,
                'message' => 'Setting retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get setting by key (public for some settings)
     */
    public function showByKey($key) {
        try {
            $setting = $this->settingModel->findByKey($key);
            
            if (!$setting) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting not found'
                ]);
                return;
            }
            
            // If setting is not active, only admins can view it
            if (!$setting['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Setting not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $setting,
                'message' => 'Setting retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a setting (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if setting exists
            $existingSetting = $this->settingModel->findById($id);
            if (!$existingSetting) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting not found'
                ]);
                return;
            }
            
            // If setting_key is being updated, check for uniqueness
            if (isset($data['setting_key']) && $data['setting_key'] !== $existingSetting['setting_key']) {
                $duplicateSetting = $this->settingModel->findByKey($data['setting_key']);
                if ($duplicateSetting) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Setting with this key already exists'
                    ]);
                    return;
                }
            }
            
            $result = $this->settingModel->update($id, $data);
            
            if ($result) {
                // Log the action
                $this->logAction('setting_updated', "Updated setting: {$existingSetting['setting_key']}", [
                    'setting_id' => $id,
                    'setting_key' => $existingSetting['setting_key'],
                    'category' => $existingSetting['category']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Setting updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating setting'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a setting (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if setting exists
            $existingSetting = $this->settingModel->findById($id);
            if (!$existingSetting) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting not found'
                ]);
                return;
            }
            
            $result = $this->settingModel->delete($id);
            
            if ($result) {
                // Log the action
                $this->logAction('setting_deleted', "Deleted setting: {$existingSetting['setting_key']}", [
                    'setting_id' => $id,
                    'setting_key' => $existingSetting['setting_key'],
                    'category' => $existingSetting['category']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Setting deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error deleting setting'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get settings by category (admin only)
     */
    public function getByCategory($category) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $settings = $this->settingModel->getByCategory($category);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get theme settings (public)
     */
    public function getThemeSettings() {
        try {
            $settings = $this->settingModel->getThemeSettings();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Theme settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving theme settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get contact settings (public)
     */
    public function getContactSettings() {
        try {
            $settings = $this->settingModel->getContactSettings();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Contact settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving contact settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get social media settings (public)
     */
    public function getSocialSettings() {
        try {
            $settings = $this->settingModel->getSocialSettings();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Social media settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving social media settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get map settings (public)
     */
    public function getMapSettings() {
        try {
            $settings = $this->settingModel->getMapSettings();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Map settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving map settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get all settings as key-value array (public)
     */
    public function getAllAsArray() {
        try {
            $settings = $this->settingModel->getAllAsArray();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Set setting value by key (admin only)
     */
    public function setValue() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['key']) || !isset($data['value'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Key and value are required'
                ]);
                return;
            }
            
            $type = $data['type'] ?? 'text';
            $category = $data['category'] ?? 'general';
            
            $result = $this->settingModel->setValue($data['key'], $data['value'], $type, $category);
            
            // Handle image upload if present
            $uploadResult = $this->handleImageUpload($data['key'], $data['category'] ?? 'general');
            
            if ($result) {
                // Log the action
                $this->logAction('setting_value_updated', "Updated setting value: {$data['key']}", [
                    'setting_key' => $data['key'],
                    'category' => $category,
                    'type' => $type,
                    'image_uploaded' => $uploadResult['uploaded']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Setting value updated successfully',
                    'data' => [
                        'image_upload' => $uploadResult
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating setting value'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating setting value: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Upload setting image (logo, favicon, etc.) (admin only)
     */
    public function uploadImage() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['setting_key'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting key is required'
                ]);
                return;
            }
            
            // Check if file was uploaded
            if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No file uploaded'
                ]);
                return;
            }
            
            // Upload image with setting key as source
            $result = $this->imageUpload->uploadSingle($_FILES['image'], 'settings', $data['setting_key']);
            
            if ($result['success']) {
                // Update setting with image path
                $this->settingModel->setValue($data['setting_key'], $result['data']['path'], 'image', $data['category'] ?? 'branding');
                
                // Log the action
                $this->logAction('setting_image_uploaded', "Uploaded image for setting: {$data['setting_key']}", [
                    'setting_key' => $data['setting_key'],
                    'category' => $data['category'] ?? 'branding',
                    'image_path' => $result['data']['path']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Image uploaded successfully',
                    'data' => $result['data']
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $result['message']
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error uploading image: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete setting image (admin only)
     */
    public function deleteImage() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['setting_key'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting key is required'
                ]);
                return;
            }
            
            // Get current setting value
            $setting = $this->settingModel->findByKey($data['setting_key']);
            if (!$setting) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting not found'
                ]);
                return;
            }
            
            $imagePath = $setting['setting_value'];
            if (!$imagePath) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No image found for this setting'
                ]);
                return;
            }
            
            // Extract filename from path
            $filename = basename($imagePath);
            
            // Delete image
            $result = $this->imageUpload->deleteImage($filename, 'settings');
            
            if ($result['success']) {
                // Update setting to remove image reference
                $this->settingModel->setValue($data['setting_key'], null, 'image', $setting['category']);
                
                // Log the action
                $this->logAction('setting_image_deleted', "Deleted image for setting: {$data['setting_key']}", [
                    'setting_key' => $data['setting_key'],
                    'category' => $setting['category']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Image deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => $result['message']
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting image: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Log user action
     * @param string $action Action name
     * @param string $description Action description
     * @param array $metadata Additional metadata
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            // Get current user from session
            $token = $this->getAuthToken();
            if ($token) {
                $userSessionModel = new UserSessionModel($this->pdo);
                $session = $userSessionModel->findActiveSession($token);
                if ($session) {
                    UserLogModel::logAction($session['user_id'], $action, $description, $metadata);
                }
            }
        } catch (Exception $e) {
            // Don't fail the main operation if logging fails
            error_log("Failed to log action: " . $e->getMessage());
        }
    }

    /**
     * Get auth token from headers
     * @return string|null
     */
    private function getAuthToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }

    /**
     * Handle image upload automatically
     * @param string $settingKey Setting key
     * @param string $category Setting category
     * @return array Upload result
     */
    private function handleImageUpload($settingKey, $category = 'general') {
        // Check if image file was uploaded
        if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
            return ['uploaded' => false, 'message' => 'No image uploaded'];
        }
        
        try {
            // Upload image with setting key as source
            $result = $this->imageUpload->uploadSingle($_FILES['image'], 'settings', $settingKey);
            
            if ($result['success']) {
                // Update setting with image path
                $this->settingModel->setValue($settingKey, $result['data']['path'], 'image', $category);
                return [
                    'uploaded' => true,
                    'message' => 'Image uploaded successfully',
                    'data' => $result['data']
                ];
            } else {
                return [
                    'uploaded' => false,
                    'message' => $result['message']
                ];
            }
        } catch (Exception $e) {
            return [
                'uploaded' => false,
                'message' => 'Error uploading image: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get upload statistics (admin only)
     */
    public function getUploadStats() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $stats = $this->imageUpload->getStats();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $stats,
                'message' => 'Upload statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving upload statistics: ' . $e->getMessage()
            ]);
        }
    }
}
?> 