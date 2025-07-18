<?php
// api/controllers/EventController.php - Controller for events management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/EventModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';
require_once __DIR__ . '/../utils/event_uploads.php';

class EventController {
    private $pdo;
    private $eventModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->eventModel = new EventModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all events (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $events = $this->eventModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Events retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving events: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new event (admin only)
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
            if (empty($data['title'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Title is required'
                ]);
                return;
            }
            
            if (empty($data['start_date'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Start date is required'
                ]);
                return;
            }
            
            if (empty($data['end_date'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'End date is required'
                ]);
                return;
            }
            
            // Validate date formats
            $startDate = DateTime::createFromFormat('Y-m-d H:i:s', $data['start_date']);
            $endDate = DateTime::createFromFormat('Y-m-d H:i:s', $data['end_date']);
            
            if (!$startDate || !$endDate) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid date format. Use YYYY-MM-DD HH:MM:SS'
                ]);
                return;
            }
            
            // Validate that end date is after start date
            if ($endDate <= $startDate) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'End date must be after start date'
                ]);
                return;
            }
            
            // Auto-generate slug from title
            $generatedSlug = generateSlug($data['title']);
            $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'events', 'slug');
            
            // Set default values
            $data['is_active'] = isset($data['is_active']) ? (bool)$data['is_active'] : true;
            $data['is_featured'] = isset($data['is_featured']) ? (bool)$data['is_featured'] : false;
            $data['registration_required'] = isset($data['registration_required']) ? (bool)$data['registration_required'] : false;
            $data['current_attendees'] = 0;
            
            // Handle banner upload if present
            $bannerData = null;
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                $bannerData = uploadEventBanner($_FILES['banner']);
                $data['banner_image'] = $bannerData['original'];
            }
            
            // Create event
            $eventId = $this->eventModel->create($data);
            
            // Log the action
            $this->logAction('event_created', "Created event: {$data['title']}", [
                'event_id' => $eventId,
                'slug' => $data['slug'],
                'title' => $data['title'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'banner_uploaded' => $bannerData ? true : false
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $eventId,
                    'slug' => $data['slug'],
                    'banner_image' => $bannerData ? $bannerData['original'] : null,
                    'banner_thumbnails' => $bannerData ? $bannerData['thumbnails'] : null
                ],
                'message' => 'Event created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific event (public)
     */
    public function show($id) {
        try {
            $event = $this->eventModel->findById($id);
            
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            // If event is not active, only admins can view it
            if (!$event['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Event not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $event,
                'message' => 'Event retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get event by slug (public)
     */
    public function showBySlug($slug) {
        try {
            $event = $this->eventModel->findBySlugInstance($slug);
            
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            // If event is not active, only admins can view it
            if (!$event['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Event not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $event,
                'message' => 'Event retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update an event (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if event exists
            $existingEvent = $this->eventModel->findById($id);
            if (!$existingEvent) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            // Handle multipart form data first (for file uploads)
            if (!empty($_POST)) {
                $data = $_POST;
            } else {
                // Fall back to JSON if no form data
                $data = json_decode(file_get_contents('php://input'), true);
            }
            
            // Validate event date if provided
            if (!empty($data['event_date'])) {
                $eventDate = DateTime::createFromFormat('Y-m-d H:i:s', $data['event_date']);
                if (!$eventDate) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid event date format. Use YYYY-MM-DD HH:MM:SS'
                    ]);
                    return;
                }
            }
            
            // Handle slug generation if title changed
            if (!empty($data['title']) && $data['title'] !== $existingEvent['title']) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'events', 'slug', $id);
            }
            
            // Handle banner upload if present
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                $bannerData = uploadEventBanner($_FILES['banner']);
                $data['banner_image'] = $bannerData['original'];
            }
            
            // Update event
            $this->eventModel->update($id, $data);
            
            // Log the action
            $this->logAction('event_updated', "Updated event: {$existingEvent['title']}", [
                'event_id' => $id,
                'title' => $data['title'] ?? $existingEvent['title'],
                'banner_updated' => isset($data['banner_image'])
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $id,
                    'slug' => $data['slug'] ?? $existingEvent['slug']
                ],
                'message' => 'Event updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete an event (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if event exists
            $event = $this->eventModel->findById($id);
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            // Delete event
            $this->eventModel->delete($id);
            
            // Log the action
            $this->logAction('event_deleted', "Deleted event: {$event['title']}", [
                'event_id' => $id,
                'title' => $event['title']
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Event deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active events (public)
     */
    public function getActive() {
        try {
            $events = $this->eventModel->getActiveEvents();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Active events retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active events: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get upcoming events (public)
     */
    public function getUpcoming() {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            $events = $this->eventModel->getUpcomingEvents($limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Upcoming events retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving upcoming events: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get events by category (public)
     */
    public function getByCategory() {
        try {
            $category = $_GET['category'] ?? '';
            if (empty($category)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Category parameter is required'
                ]);
                return;
            }
            
            $events = $this->eventModel->getByCategory($category);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Events by category retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving events by category: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search events (public)
     */
    public function search() {
        try {
            $query = $_GET['q'] ?? '';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            
            if (empty($query)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Search query is required'
                ]);
                return;
            }
            
            $events = $this->eventModel->searchEvents($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Search results retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching events: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Toggle event active status (admin only)
     */
    public function toggleActive($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $event = $this->eventModel->findById($id);
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            $this->eventModel->toggleActive($id);
            
            // Log the action
            $newStatus = !$event['is_active'];
            $this->logAction('event_status_toggled', "Toggled event status: {$event['title']}", [
                'event_id' => $id,
                'title' => $event['title'],
                'new_status' => $newStatus ? 'active' : 'inactive'
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Event status updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating event status: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update event status (admin only)
     */
    public function updateStatus($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $event = $this->eventModel->findById($id);
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $status = $data['status'] ?? '';
            
            if (empty($status)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Status is required'
                ]);
                return;
            }
            
            $this->eventModel->updateStatus($id, $status);
            
            // Log the action
            $this->logAction('event_status_updated', "Updated event status: {$event['title']}", [
                'event_id' => $id,
                'title' => $event['title'],
                'new_status' => $status
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Event status updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating event status: ' . $e->getMessage()
            ]);
        }
    }



    /**
     * Log user action
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            $token = $this->getAuthToken();
            if ($token) {
                $this->userLogModel->logAction($token, $action, $description, $metadata);
            }
        } catch (Exception $e) {
            // Log error silently to avoid breaking the main operation
            error_log('Error logging action: ' . $e->getMessage());
        }
    }

    /**
     * Get authentication token from request
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
?> 