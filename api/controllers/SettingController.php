<?php
// api/controllers/SettingController.php - Controller for settings management

require_once __DIR__ . '/../core/AuthMiddleware.php';
require_once __DIR__ . '/../core/RoleMiddleware.php';
require_once __DIR__ . '/../models/SettingModel.php';

class SettingController {
    private $pdo;
    private $settingModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->settingModel = new SettingModel($pdo);
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
            
            if ($result) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Setting value updated successfully'
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
}
?> 