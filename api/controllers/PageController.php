<?php
// api/controllers/PageController.php - Controller for pages management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/ImageUpload.php';
require_once __DIR__ . '/../models/PageModel.php';

class PageController {
    private $pdo;
    private $pageModel;
    private $imageUpload;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->pageModel = new PageModel($pdo);
        $this->imageUpload = new \Core\ImageUpload('uploads', 5242880); // 5MB max
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
            
            $result = $this->pageModel->delete($id);
            
            if ($result) {
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