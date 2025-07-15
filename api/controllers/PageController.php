<?php
// api/controllers/PageController.php - Controller for pages management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../utils/page_uploads.php';
require_once __DIR__ . '/../utils/MultipartFormParser.php';
require_once __DIR__ . '/../models/PageModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class PageController {
    private $pdo;
    private $pageModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->pageModel = new PageModel($pdo);
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
            
            // Handle multipart form data first (for file uploads)
            if (!empty($_POST)) {
                $data = $_POST;
            } else {
                // Fall back to JSON if no form data
                $data = json_decode(file_get_contents('php://input'), true);
            }
            
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
            
            // Create page first to get the ID
            $pageId = $this->pageModel->create($data);
            
            // Handle banner upload if present
            $bannerPath = null;
            if (isset($_FILES['banner']) && $_FILES['banner']['error'] !== UPLOAD_ERR_NO_FILE) {
                $uploadResult = uploadPageBanner($_FILES['banner']);
                
                if ($uploadResult['success']) {
                    $bannerPath = $uploadResult['filepath'];
                    // Update page with banner path
                    $this->pageModel->update($pageId, ['banner_image' => $bannerPath]);
                }
            }
            
            // Log the action
            $this->logAction('page_created', "Created page: {$data['title']}", [
                'page_id' => $pageId,
                'slug' => $data['slug'],
                'title' => $data['title'],
                'banner_uploaded' => !empty($bannerPath)
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $pageId,
                    'banner_image' => $bannerPath,
                    'banner_url' => $bannerPath ? (getPageBannerInfo($bannerPath)['url'] ?? null) : null,
                    'thumbnails' => $bannerPath ? (getPageBannerInfo($bannerPath)['thumbnails'] ?? []) : []
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
            
            // Debug logging
            error_log("API Debug: Request method = " . $_SERVER['REQUEST_METHOD']);
            error_log("API Debug: Content-Type = " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
            error_log("API Debug: POST data count = " . count($_POST));
            error_log("API Debug: FILES data count = " . count($_FILES));
            
            // Handle PUT/PATCH requests with multipart/form-data
            if (in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH']) && 
                strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') === 0) {
                
                error_log("API Debug: Processing " . $_SERVER['REQUEST_METHOD'] . " multipart request");
                
                // Get the raw request body
                $rawData = file_get_contents('php://input');
                error_log("API Debug: Raw data length: " . strlen($rawData));
                
                // Parse multipart data and populate $_POST and $_FILES
                $parsed = MultipartFormParser::processRequest($rawData, $_SERVER['CONTENT_TYPE']);
                error_log("API Debug: Parsed data: " . json_encode($parsed['data']));
                error_log("API Debug: Parsed files: " . json_encode(array_keys($parsed['files'])));
                
                $data = $_POST;
            } else {
                // Handle multipart form data first (for file uploads)
                if (!empty($_POST)) {
                    $data = $_POST;
                    error_log("API Debug: Using POST data");
                } else {
                    // Fall back to JSON if no form data
                    $data = json_decode(file_get_contents('php://input'), true);
                    error_log("API Debug: Using JSON data");
                }
            }
            
            error_log("API Debug: Data received = " . json_encode($data));
            error_log("API Debug: Data keys = " . json_encode(array_keys($data)));
            error_log("API Debug: Data values = " . json_encode(array_values($data)));
            
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
            
            // Handle banner upload if present
            $bannerPath = null;
            if (isset($_FILES['banner']) && $_FILES['banner']['error'] !== UPLOAD_ERR_NO_FILE) {
                error_log("API Debug: Banner file detected");
                // Delete old banner if exists
                if ($existingPage['banner_image']) {
                    deletePageBanner($existingPage['banner_image']);
                }
                
                $uploadResult = uploadPageBanner($_FILES['banner']);
                error_log("API Debug: Upload result = " . json_encode($uploadResult));
                
                if ($uploadResult['success']) {
                    $bannerPath = $uploadResult['filepath'];
                    $data['banner_image'] = $bannerPath;
                }
            } else {
                error_log("API Debug: No banner file or upload error");
                if (isset($_FILES['banner'])) {
                    error_log("API Debug: Banner upload error = " . $_FILES['banner']['error']);
                }
            }
            
            $result = $this->pageModel->update($id, $data);
            
            if ($result) {
                // Log the action
                $this->logAction('page_updated', "Updated page: {$existingPage['title']}", [
                    'page_id' => $id,
                    'slug' => $data['slug'] ?? $existingPage['slug'],
                    'title' => $data['title'] ?? $existingPage['title'],
                    'banner_uploaded' => !empty($bannerPath)
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Page updated successfully',
                    'data' => [
                        'banner_image' => $bannerPath,
                        'banner_url' => $bannerPath ? (getPageBannerInfo($bannerPath)['url'] ?? null) : null,
                        'thumbnails' => $bannerPath ? (getPageBannerInfo($bannerPath)['thumbnails'] ?? []) : []
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
            error_log("API Error: " . $e->getMessage());
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
            
            // Delete banner image if exists
            if ($existingPage['banner_image']) {
                deletePageBanner($existingPage['banner_image']);
            }
            
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
            
            // Delete old banner if exists
            if ($existingPage['banner_image']) {
                deletePageBanner($existingPage['banner_image']);
            }
            
            // Upload banner
            $uploadResult = uploadPageBanner($_FILES['banner']);
            
            if ($uploadResult['success']) {
                // Update page with banner path
                $this->pageModel->update($id, ['banner_image' => $uploadResult['filepath']]);
                
                // Log the action
                $this->logAction('page_banner_uploaded', "Uploaded banner for page: {$existingPage['title']}", [
                    'page_id' => $id,
                    'slug' => $existingPage['slug'],
                    'title' => $existingPage['title'],
                    'banner_path' => $uploadResult['filepath']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Banner uploaded successfully',
                    'data' => [
                        'filepath' => $uploadResult['filepath'],
                        'url' => $uploadResult['url'],
                        'thumbnails' => $uploadResult['thumbnails'] ?? null
                    ]
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $uploadResult['message']
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
            
            // Get banner path from page data
            $bannerPath = $existingPage['banner_image'] ?? null;
            if (!$bannerPath) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No banner image found'
                ]);
                return;
            }
            
            // Delete banner
            $deleteResult = deletePageBanner($bannerPath);
            
            if ($deleteResult['success']) {
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
                    'message' => $deleteResult['message']
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