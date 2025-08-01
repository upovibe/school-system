<?php
// api/controllers/AssignmentController.php - Admin controller for managing class assignments

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/ClassAssignmentModel.php';
require_once __DIR__ . '/../models/StudentAssignmentModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../utils/assignment_uploads.php';

class AssignmentController {
    private $pdo;
    private $assignmentModel;
    private $studentAssignmentModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->assignmentModel = new ClassAssignmentModel($pdo);
        $this->studentAssignmentModel = new StudentAssignmentModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all assignments with filters (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Get query parameters for filtering
            $filters = [];
            if (isset($_GET['teacher_id'])) $filters['teacher_id'] = $_GET['teacher_id'];
            if (isset($_GET['class_id'])) $filters['class_id'] = $_GET['class_id'];
            if (isset($_GET['subject_id'])) $filters['subject_id'] = $_GET['subject_id'];
            if (isset($_GET['status'])) $filters['status'] = $_GET['status'];
            if (isset($_GET['assignment_type'])) $filters['assignment_type'] = $_GET['assignment_type'];
            
            $assignments = $this->assignmentModel->getAssignmentsWithDetails($filters);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $assignments,
                'message' => 'Assignments retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving assignments: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create new assignment (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Handle multipart form data or JSON data
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                $parsed = MultipartFormParser::parse($rawData, $content_type);
                $data = $parsed['data'] ?? [];
                $_FILES = $parsed['files'] ?? [];
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
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

            if (empty($data['teacher_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher ID is required'
                ]);
                return;
            }

            if (empty($data['class_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class ID is required'
                ]);
                return;
            }

            if (empty($data['subject_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject ID is required'
                ]);
                return;
            }
            
            // Convert due_date format if provided
            if (isset($data['due_date']) && !empty($data['due_date'])) {
                $dueDate = null;
                $dateFormats = [
                    'Y-m-d H:i:s',  // 2025-09-25 23:00:45
                    'Y-m-d\TH:i',   // 2025-09-25T23:00
                    'Y-m-d H:i',    // 2025-09-25 23:00
                    'd/m/Y H:i:s',  // 25/9/2025 23:00:45
                    'd/m/Y H:i'     // 25/9/2025 23:00
                ];
                
                foreach ($dateFormats as $format) {
                    $dueDate = DateTime::createFromFormat($format, $data['due_date']);
                    if ($dueDate) break;
                }
                
                if ($dueDate) {
                    $data['due_date'] = $dueDate->format('Y-m-d H:i:s');
                }
            }
            
            // Handle attachment upload if present
            if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
                $attachmentData = uploadAssignmentAttachment($_FILES['attachment']);
                if ($attachmentData['success']) {
                    $data['attachment_file'] = $attachmentData['filepath'];
                }
            }
            
            // Set default values
            if (empty($data['total_points'])) {
                $data['total_points'] = 100.00;
            }
            
            if (empty($data['assignment_type'])) {
                $data['assignment_type'] = 'homework';
            }
            
            if (empty($data['status'])) {
                $data['status'] = 'draft';
            }
            
            $result = $this->assignmentModel->create($data);
            
            if ($result) {
                // Get the created assignment data
                $createdAssignment = $this->assignmentModel->getAssignmentWithDetails($result);
                
                // Log the action
                $this->logAction('assignment_created', "Created assignment: {$data['title']}", [
                    'assignment_id' => $result,
                    'title' => $data['title'],
                    'teacher_id' => $data['teacher_id']
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $createdAssignment,
                    'message' => 'Assignment created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get single assignment details (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $assignment = $this->assignmentModel->getAssignmentWithDetails($id);
            
            if (!$assignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $assignment,
                'message' => 'Assignment details retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving assignment details: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update assignment (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if assignment exists
            $existingAssignment = $this->assignmentModel->findById($id);
            if (!$existingAssignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            // Handle multipart form data or JSON data
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                $parsed = MultipartFormParser::parse($rawData, $content_type);
                $data = $parsed['data'] ?? [];
                $_FILES = $parsed['files'] ?? [];
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            // Convert due_date format if provided
            if (isset($data['due_date']) && !empty($data['due_date'])) {
                $dueDate = null;
                $dateFormats = [
                    'Y-m-d H:i:s',  // 2025-09-25 23:00:45
                    'Y-m-d\TH:i',   // 2025-09-25T23:00
                    'Y-m-d H:i',    // 2025-09-25 23:00
                    'd/m/Y H:i:s',  // 25/9/2025 23:00:45
                    'd/m/Y H:i'     // 25/9/2025 23:00
                ];
                
                foreach ($dateFormats as $format) {
                    $dueDate = DateTime::createFromFormat($format, $data['due_date']);
                    if ($dueDate) break;
                }
                
                if ($dueDate) {
                    $data['due_date'] = $dueDate->format('Y-m-d H:i:s');
                }
            }
            
            // Handle attachment upload if present
            if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
                $attachmentData = uploadAssignmentAttachment($_FILES['attachment']);
                if ($attachmentData['success']) {
                    $data['attachment_file'] = $attachmentData['filepath'];
                }
            }
            
            // Ensure all fields are included in the update (even null values)
            foreach ($data as $key => $value) {
                if ($value === 'null' || $value === '') {
                    $data[$key] = null;
                }
            }
            
            $result = $this->assignmentModel->update($id, $data);
            
            if ($result) {
                // Get the updated assignment data
                $updatedAssignment = $this->assignmentModel->getAssignmentWithDetails($id);
                
                // Log the action
                $this->logAction('assignment_updated', "Updated assignment: {$existingAssignment['title']}", [
                    'assignment_id' => $id,
                    'title' => $data['title'] ?? $existingAssignment['title']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedAssignment,
                    'message' => 'Assignment updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete assignment (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if assignment exists
            $existingAssignment = $this->assignmentModel->findById($id);
            if (!$existingAssignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            // Delete attachment file if exists
            if (!empty($existingAssignment['attachment_file'])) {
                deleteAssignmentFiles($existingAssignment['attachment_file']);
            }
            
            $result = $this->assignmentModel->delete($id);
            
            if ($result) {
                // Log the action
                $this->logAction('assignment_deleted', "Deleted assignment: {$existingAssignment['title']}", [
                    'assignment_id' => $id,
                    'title' => $existingAssignment['title']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Assignment deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get assignment submissions for grading (admin only)
     */
    public function getSubmissions($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if assignment exists
            $assignment = $this->assignmentModel->findById($id);
            if (!$assignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            $submissions = $this->studentAssignmentModel->getAssignmentSubmissions($id);
            $statistics = $this->studentAssignmentModel->getAssignmentStatistics($id);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'assignment' => $assignment,
                    'submissions' => $submissions,
                    'statistics' => $statistics
                ],
                'message' => 'Assignment submissions retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving submissions: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Grade a student submission (admin only)
     */
    public function gradeSubmission($assignmentId, $studentId) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if assignment exists
            $assignment = $this->assignmentModel->findById($assignmentId);
            if (!$assignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment not found'
                ]);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['grade']) || !is_numeric($data['grade'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valid grade is required'
                ]);
                return;
            }
            
            $grade = floatval($data['grade']);
            $feedback = $data['feedback'] ?? null;
            
            $result = $this->studentAssignmentModel->gradeSubmission($studentId, $assignmentId, $grade, $feedback);
            
            if ($result) {
                // Get the updated submission
                $submission = $this->studentAssignmentModel->getStudentSubmission($studentId, $assignmentId);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $submission,
                    'message' => 'Submission graded successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to grade submission'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error grading submission: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Log action to user logs
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
     * Get authentication token
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