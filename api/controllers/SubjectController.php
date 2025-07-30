<?php
// api/controllers/SubjectController.php - Controller for subject operations

require_once __DIR__ . '/../models/SubjectModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class SubjectController {
    private $subjectModel;
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->subjectModel = new SubjectModel($pdo);
    }

    /**
     * Get all subjects (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $subjects = $this->subjectModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $subjects,
                'message' => 'Subjects retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving subjects: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new subject (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject name is required'
                ]);
                return;
            }

            if (empty($data['code'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject code is required'
                ]);
                return;
            }

            // Check if code already exists
            $existingSubject = $this->subjectModel->findByCode($data['code']);
            if ($existingSubject) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject code already exists'
                ]);
                return;
            }

            // Set default status if not provided
            if (!isset($data['status'])) {
                $data['status'] = 'active';
            }

            // Create subject
            $subjectId = $this->subjectModel->create($data);
            
            // Log subject creation
            $this->logAction('subject_created', 'New subject created', $data);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => ['id' => $subjectId],
                'message' => 'Subject created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating subject: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific subject (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $subject = $this->subjectModel->findById($id);
            
            if (!$subject) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $subject,
                'message' => 'Subject retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving subject: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a subject (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if subject exists
            $existingSubject = $this->subjectModel->findById($id);
            if (!$existingSubject) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject not found'
                ]);
                return;
            }

            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject name is required'
                ]);
                return;
            }

            if (empty($data['code'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject code is required'
                ]);
                return;
            }

            // Check if code already exists for different subject
            $existingSubjectWithCode = $this->subjectModel->findByCode($data['code']);
            if ($existingSubjectWithCode && $existingSubjectWithCode['id'] != $id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject code already exists'
                ]);
                return;
            }

            // Update subject
            $this->subjectModel->update($id, $data);
            
            // Log subject update
            $this->logAction('subject_updated', 'Subject updated', $data);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Subject updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating subject: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a subject (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if subject exists
            $existingSubject = $this->subjectModel->findById($id);
            if (!$existingSubject) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject not found'
                ]);
                return;
            }

            // Check if subject is assigned to any classes
            $subjectsWithCounts = $this->subjectModel->getSubjectsWithClassCounts();
            $subjectWithCount = null;
            foreach ($subjectsWithCounts as $subject) {
                if ($subject['id'] == $id) {
                    $subjectWithCount = $subject;
                    break;
                }
            }

            if ($subjectWithCount && $subjectWithCount['class_count'] > 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cannot delete subject. It is assigned to ' . $subjectWithCount['class_count'] . ' class(es).'
                ]);
                return;
            }

            // Delete subject
            $this->subjectModel->delete($id);
            
            // Log subject deletion
            $this->logAction('subject_deleted', 'Subject deleted', $existingSubject);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Subject deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting subject: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active subjects (public)
     */
    public function getActive() {
        try {
            $subjects = $this->subjectModel->getActiveSubjects();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $subjects,
                'message' => 'Active subjects retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active subjects: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search subjects (admin only)
     */
    public function search() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $query = $_GET['q'] ?? '';
            $limit = $_GET['limit'] ?? null;
            
            if (empty($query)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Search query is required'
                ]);
                return;
            }
            
            $subjects = $this->subjectModel->searchSubjects($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $subjects,
                'message' => 'Subjects search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching subjects: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get subjects with class counts (admin only)
     */
    public function getWithClassCounts() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $subjects = $this->subjectModel->getSubjectsWithClassCounts();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $subjects,
                'message' => 'Subjects with class counts retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving subjects with class counts: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Log user action
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            // Get current user from session
            $token = $this->getAuthToken();
            if ($token) {
                require_once __DIR__ . '/../models/UserSessionModel.php';
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