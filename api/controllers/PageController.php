<?php
// api/controllers/PageController.php - Controller for pages management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/ImageUpload.php';
require_once __DIR__ . '/../models/PageModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class PageController {
    private $pdo;
    private $pageModel;
    private $imageUpload;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->pageModel = new PageModel($pdo);
        $this->imageUpload = new \Core\ImageUpload('uploads', 5242880); // 5MB max
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all pages (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $pages = $this->pageModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $pages,
                'message' => 'Pages retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving pages: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new page (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['slug']) || empty($data['title'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Slug and title are required'
                ]);
                return;
            }
            
            // Check if slug already exists
            $existingPage = $this->pageModel->findBySlug($data['slug']);
            if ($existingPage) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page with this slug already exists'
                ]);
                return;
            }
            
            $pageId = $this->pageModel->create($data);
            
            // Handle banner upload if present
            $uploadResult = $this->handleBannerUpload($pageId);
            
            // Log the action
            $this->logAction('page_created', "Created page: {$data['title']}", [
                'page_id' => $pageId,
                'slug' => $data['slug'],
                'title' => $data['title'],
                'banner_uploaded' => $uploadResult['uploaded']
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $pageId,
                    'banner_upload' => $uploadResult
                ],
                'message' => 'Page created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific page (public)
     */
    public function show($id) {
        try {
            $page = $this->pageModel->findById($id);
            
            if (!$page) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }
            
            // If page is not active, only admins can view it
            if (!$page['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Page not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $page,
                'message' => 'Page retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get page by slug (public)
     */
    public function showBySlug($slug) {
        try {
            $page = $this->pageModel->findBySlug($slug);
            
            if (!$page) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }
            
            // If page is not active, only admins can view it
            if (!$page['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Page not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $page,
                'message' => 'Page retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a page (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if page exists
            $existingPage = $this->pageModel->findById($id);
            if (!$existingPage) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }
            
            // If slug is being updated, check for uniqueness
            if (isset($data['slug']) && $data['slug'] !== $existingPage['slug']) {
                $duplicatePage = $this->pageModel->findBySlug($data['slug']);
                if ($duplicatePage) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Page with this slug already exists'
                    ]);
                    return;
                }
            }
            
            $result = $this->pageModel->update($id, $data);
            
            // Handle banner upload if present
            $uploadResult = $this->handleBannerUpload($id);
            
            if ($result) {
                // Log the action
                $this->logAction('page_updated', "Updated page: {$existingPage['title']}", [
                    'page_id' => $id,
                    'slug' => $data['slug'] ?? $existingPage['slug'],
                    'title' => $data['title'] ?? $existingPage['title'],
                    'banner_uploaded' => $uploadResult['uploaded']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Page updated successfully',
                    'data' => [
                        'banner_upload' => $uploadResult
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating page'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a page (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if page exists
            $existingPage = $this->pageModel->findById($id);
            if (!$existingPage) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }
            
            // Store page info before deletion for logging
            $pageTitle = $existingPage['title'];
            $pageSlug = $existingPage['slug'];
            
            $result = $this->pageModel->delete($id);
            
            if ($result) {
                // Log the action
                $this->logAction('page_deleted', "Deleted page: {$pageTitle}", [
                    'page_id' => $id,
                    'slug' => $pageSlug,
                    'title' => $pageTitle
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Page deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error deleting page'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active pages (public)
     */
    public function getActive() {
        try {
            $pages = $this->pageModel->getActivePages();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $pages,
                'message' => 'Active pages retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active pages: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Toggle page active status (admin only)
     */
    public function toggleActive($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $result = $this->pageModel->toggleActive($id);
            
            if ($result) {
                // Get page info for logging
                $page = $this->pageModel->findById($id);
                $newStatus = $page['is_active'] ? 'activated' : 'deactivated';
                
                // Log the action
                $this->logAction('page_status_toggled', "{$newStatus} page: {$page['title']}", [
                    'page_id' => $id,
                    'slug' => $page['slug'],
                    'title' => $page['title'],
                    'new_status' => $page['is_active']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Page status toggled successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error toggling page status'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error toggling page status: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Upload page banner image (admin only)
     */
    public function uploadBanner($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if page exists
            $existingPage = $this->pageModel->findById($id);
            if (!$existingPage) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }
            
            // Check if file was uploaded
            if (!isset($_FILES['banner']) || $_FILES['banner']['error'] === UPLOAD_ERR_NO_FILE) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No file uploaded'
                ]);
                return;
            }
            
            // Upload image with page ID as source
            $result = $this->imageUpload->uploadSingle($_FILES['banner'], 'pages', 'page_' . $id);
            
            if ($result['success']) {
                // Update page with banner path
                $this->pageModel->update($id, ['banner_image' => $result['data']['path']]);
                
                // Log the action
                $this->logAction('page_banner_uploaded', "Uploaded banner for page: {$existingPage['title']}", [
                    'page_id' => $id,
                    'slug' => $existingPage['slug'],
                    'title' => $existingPage['title'],
                    'banner_path' => $result['data']['path']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Banner uploaded successfully',
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
                'message' => 'Error uploading banner: ' . $e->getMessage()
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
     * Handle banner upload automatically
     * @param int $pageId Page ID
     * @return array Upload result
     */
    private function handleBannerUpload($pageId) {
        // Check if banner file was uploaded
        if (!isset($_FILES['banner']) || $_FILES['banner']['error'] === UPLOAD_ERR_NO_FILE) {
            return ['uploaded' => false, 'message' => 'No banner uploaded'];
        }
        
        try {
            // Upload image with page ID as source
            $result = $this->imageUpload->uploadSingle($_FILES['banner'], 'pages', 'page_' . $pageId);
            
            if ($result['success']) {
                // Update page with banner path
                $this->pageModel->update($pageId, ['banner_image' => $result['data']['path']]);
                return [
                    'uploaded' => true,
                    'message' => 'Banner uploaded successfully',
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
                'message' => 'Error uploading banner: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete page banner image (admin only)
     */
    public function deleteBanner($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if page exists
            $existingPage = $this->pageModel->findById($id);
            if (!$existingPage) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }
            
            // Get banner filename from page data
            $bannerPath = $existingPage['banner_image'] ?? null;
            if (!$bannerPath) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No banner image found'
                ]);
                return;
            }
            
            // Extract filename from path
            $filename = basename($bannerPath);
            
            // Delete image
            $result = $this->imageUpload->deleteImage($filename, 'pages');
            
            if ($result['success']) {
                // Update page to remove banner reference
                $this->pageModel->update($id, ['banner_image' => null]);
                
                // Log the action
                $this->logAction('page_banner_deleted', "Deleted banner for page: {$existingPage['title']}", [
                    'page_id' => $id,
                    'slug' => $existingPage['slug'],
                    'title' => $existingPage['title']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Banner deleted successfully'
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
                'message' => 'Error deleting banner: ' . $e->getMessage()
            ]);
        }
    }
}
?> 