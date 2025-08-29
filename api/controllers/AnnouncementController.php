<?php
// api/controllers/AnnouncementController.php - Announcement management endpoints (admin only)

require_once __DIR__ . '/../models/AnnouncementModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/ClassModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class AnnouncementController {
    private $pdo;
    private $announcementModel;
    private $classModel;
    private $userModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->announcementModel = new AnnouncementModel($pdo);
        $this->classModel = new ClassModel($pdo);
        $this->userModel = new UserModel($pdo);
    }

    /**
     * List all announcements with optional filters (admin only)
     * Filters: announcement_type, priority, target_audience, target_class_id, is_active, is_pinned
     */
    public function index() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $conditions = [];
            $params = [];

            if (isset($_GET['announcement_type']) && $_GET['announcement_type'] !== '') {
                $conditions[] = 'announcement_type = ?';
                $params[] = $_GET['announcement_type'];
            }
            if (isset($_GET['priority']) && $_GET['priority'] !== '') {
                $conditions[] = 'priority = ?';
                $params[] = $_GET['priority'];
            }
            if (isset($_GET['target_audience']) && $_GET['target_audience'] !== '') {
                $conditions[] = 'target_audience = ?';
                $params[] = $_GET['target_audience'];
            }
            if (isset($_GET['target_class_id']) && $_GET['target_class_id'] !== '') {
                $conditions[] = 'target_class_id = ?';
                $params[] = $_GET['target_class_id'];
            }
            if (isset($_GET['is_active']) && $_GET['is_active'] !== '') {
                $conditions[] = 'is_active = ?';
                $params[] = (int) (!!$_GET['is_active']);
            }
            if (isset($_GET['is_pinned']) && $_GET['is_pinned'] !== '') {
                $conditions[] = 'is_pinned = ?';
                $params[] = (int) (!!$_GET['is_pinned']);
            }

            $where = '';
            if (!empty($conditions)) {
                $where = 'WHERE ' . implode(' AND ', $conditions);
            }

            // Get announcements with enhanced details
            $announcements = $this->announcementModel->getAllWithDetails($where, $params);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $announcements,
                'message' => 'Announcements retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving announcements: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new announcement (admin only)
     * Required: title, content, target_audience
     * Optional: announcement_type, priority, target_class_id, is_active, is_pinned, expires_at
     */
    public function store() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Validate required fields
            $required = ['title', 'content', 'target_audience'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                    ]);
                    return;
                }
            }

            // Validate target_audience
            $validAudiences = ['all', 'students', 'teachers', 'admin', 'cashier', 'specific_class'];
            if (!in_array($data['target_audience'], $validAudiences)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid target audience. Must be one of: ' . implode(', ', $validAudiences)
                ]);
                return;
            }

            // Validate target_class_id if specific_class is selected
            if ($data['target_audience'] === 'specific_class') {
                if (!isset($data['target_class_id']) || $data['target_class_id'] === '') {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Target class ID is required when targeting specific class'
                    ]);
                    return;
                }
                
                // Verify class exists
                $class = $this->classModel->findById($data['target_class_id']);
                if (!$class) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Target class not found'
                    ]);
                    return;
                }
            }

            // Set defaults
            if (!isset($data['announcement_type'])) {
                $data['announcement_type'] = 'general';
            }
            if (!isset($data['priority'])) {
                $data['priority'] = 'normal';
            }
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }
            if (!isset($data['is_pinned'])) {
                $data['is_pinned'] = 0;
            }

            // Set created_by to current user from JWT token
            $data['created_by'] = $this->getCurrentUserIdFromToken();

            $announcementId = $this->announcementModel->create($data);

            // Log the action
            $this->logAction('announcement_created', 'Created announcement', [
                'announcement_id' => $announcementId,
                'title' => $data['title'],
                'target_audience' => $data['target_audience']
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => ['id' => $announcementId],
                'message' => 'Announcement created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating announcement: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific announcement by ID (admin only)
     */
    public function show($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $announcement = $this->announcementModel->getWithDetails($id);
            
            if (!$announcement) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Announcement not found'
                ]);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $announcement,
                'message' => 'Announcement retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving announcement: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update an announcement (admin only)
     */
    public function update($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $announcement = $this->announcementModel->findById($id);
            if (!$announcement) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Announcement not found'
                ]);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Validate target_audience if provided
            if (isset($data['target_audience'])) {
                $validAudiences = ['all', 'students', 'teachers', 'admin', 'cashier', 'specific_class'];
                if (!in_array($data['target_audience'], $validAudiences)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid target audience. Must be one of: ' . implode(', ', $validAudiences)
                    ]);
                    return;
                }

                // Validate target_class_id if specific_class is selected
                if ($data['target_audience'] === 'specific_class') {
                    if (!isset($data['target_class_id']) || $data['target_class_id'] === '') {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Target class ID is required when targeting specific class'
                        ]);
                        return;
                    }
                    
                    // Verify class exists
                    $class = $this->classModel->findById($data['target_class_id']);
                    if (!$class) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Target class not found'
                        ]);
                        return;
                    }
                }
            }

            $updated = $this->announcementModel->update($id, $data);

            if ($updated) {
                // Log the action
                $this->logAction('announcement_updated', 'Updated announcement', [
                    'announcement_id' => $id,
                    'changes' => $data
                ]);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Announcement updated successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No changes made to announcement'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating announcement: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete an announcement (admin only)
     */
    public function destroy($id) {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $announcement = $this->announcementModel->findById($id);
            if (!$announcement) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Announcement not found'
                ]);
                return;
            }

            $deleted = $this->announcementModel->delete($id);

            if ($deleted) {
                // Log the action
                $this->logAction('announcement_deleted', 'Deleted announcement', [
                    'announcement_id' => $id,
                    'title' => $announcement['title']
                ]);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Announcement deleted successfully'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete announcement'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting announcement: ' . $e->getMessage()
            ]);
        }
    }



    /**
     * Get announcement statistics (admin only)
     */
    public function getStats() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $stats = $this->announcementModel->getStats();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $stats,
                'message' => 'Announcement statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving announcement statistics: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get available classes for class-specific announcements (admin only)
     */
    public function getAvailableClasses() {
        try {
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);

            $classes = $this->classModel->getActiveClasses();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classes,
                'message' => 'Available classes retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving available classes: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Log admin actions for audit trail
     */
    private function logAction($action, $description, $details = []) {
        try {
            require_once __DIR__ . '/../models/UserLogModel.php';
            $logModel = new UserLogModel($this->pdo);
            
            $logData = [
                'user_id' => $this->getCurrentUserIdFromToken(),
                'action' => $action,
                'description' => $description,
                'details' => json_encode($details),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ];
            
            $logModel->create($logData);
        } catch (Exception $e) {
            // Don't fail the main operation if logging fails
            error_log("Failed to log announcement action: " . $e->getMessage());
        }
    }

    /**
     * Get current user ID from JWT token
     */
    private function getCurrentUserIdFromToken() {
        try {
            $token = $this->getAuthToken();
            if (!$token) return null;
            require_once __DIR__ . '/../models/UserSessionModel.php';
            $userSessionModel = new UserSessionModel($this->pdo);
            $session = $userSessionModel->findActiveSession($token);
            return $session['user_id'] ?? null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Extract authorization token from headers
     */
    private function getAuthToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    }
}
