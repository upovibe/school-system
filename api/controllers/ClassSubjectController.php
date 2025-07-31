<?php
// api/controllers/ClassSubjectController.php - Controller for class subject operations

require_once __DIR__ . '/../models/ClassSubjectModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class ClassSubjectController {
    private $classSubjectModel;
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->classSubjectModel = new ClassSubjectModel($pdo);
    }

    /**
     * Get all class subjects (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $filters = [];
            
            // Apply filters if provided
            if (isset($_GET['class_id'])) {
                $filters['class_id'] = $_GET['class_id'];
            }
            
            if (isset($_GET['subject_id'])) {
                $filters['subject_id'] = $_GET['subject_id'];
            }
            

            

            
            $classSubjects = $this->classSubjectModel->getWithDetails($filters);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classSubjects,
                'message' => 'Class subjects retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving class subjects: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new class subject (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
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

            // Check if class subject already exists with same combination
            $existingClassSubject = $this->classSubjectModel->findByUniqueKey(
                $data['class_id'], 
                $data['subject_id']
            );
            
            if ($existingClassSubject) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class subject already exists with this combination'
                ]);
                return;
            }



            // Create the class subject
            $classSubjectId = $this->classSubjectModel->create($data);
            
            if ($classSubjectId) {
                // Log the action
                $this->logAction('create', "Created class subject assignment", [
                    'class_subject_id' => $classSubjectId,
                    'class_id' => $data['class_id'],
                    'subject_id' => $data['subject_id']
                ]);
                
                // Get the created class subject with details
                $classSubject = $this->classSubjectModel->getWithDetails([
                    'class_id' => $data['class_id'],
                    'subject_id' => $data['subject_id']
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $classSubject[0] ?? null,
                    'message' => 'Class subject created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error creating class subject'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating class subject: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific class subject (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $classSubject = $this->classSubjectModel->findById($id);
            
            if (!$classSubject) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class subject not found'
                ]);
                return;
            }
            
                         // Get with details
             $classSubjects = $this->classSubjectModel->getWithDetails([
                 'class_id' => $classSubject['class_id'],
                 'subject_id' => $classSubject['subject_id']
             ]);
            
            $classSubjectWithDetails = $classSubjects[0] ?? $classSubject;
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classSubjectWithDetails,
                'message' => 'Class subject retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving class subject: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a class subject (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if class subject exists
            $existingClassSubject = $this->classSubjectModel->findById($id);
            if (!$existingClassSubject) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class subject not found'
                ]);
                return;
            }
            
            // Validate required fields
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

            // Check if the new combination already exists (excluding current record)
            $existingWithNewKey = $this->classSubjectModel->findByUniqueKey(
                $data['class_id'], 
                $data['subject_id']
            );
            
            if ($existingWithNewKey && $existingWithNewKey['id'] != $id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class subject already exists with this combination'
                ]);
                return;
            }

            // Update the class subject
            $success = $this->classSubjectModel->update($id, $data);
            
            if ($success) {
                // Log the action
                $this->logAction('update', "Updated class subject assignment", [
                    'class_subject_id' => $id,
                    'class_id' => $data['class_id'],
                    'subject_id' => $data['subject_id']
                ]);
                
                // Get the updated class subject with details
                $classSubjects = $this->classSubjectModel->getWithDetails([
                    'class_id' => $data['class_id'],
                    'subject_id' => $data['subject_id']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $classSubjects[0] ?? null,
                    'message' => 'Class subject updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating class subject'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating class subject: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a class subject (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if class subject exists
            $classSubject = $this->classSubjectModel->findById($id);
            if (!$classSubject) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class subject not found'
                ]);
                return;
            }
            
            // Delete the class subject
            $success = $this->classSubjectModel->delete($id);
            
            if ($success) {
                                 // Log the action
                 $this->logAction('delete', "Deleted class subject assignment", [
                     'class_subject_id' => $id,
                     'class_id' => $classSubject['class_id'],
                     'subject_id' => $classSubject['subject_id']
                 ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Class subject deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error deleting class subject'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting class subject: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get class subjects by class ID (admin only)
     */
    public function getByClass() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $classId = $_GET['class_id'] ?? null;
            
            if (!$classId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class ID is required'
                ]);
                return;
            }
            
            $classSubjects = $this->classSubjectModel->getByClassId($classId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classSubjects,
                'message' => 'Class subjects retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving class subjects: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get class subjects by subject ID (admin only)
     */
    public function getBySubject() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $subjectId = $_GET['subject_id'] ?? null;
            
            if (!$subjectId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject ID is required'
                ]);
                return;
            }
            
            $classSubjects = $this->classSubjectModel->getBySubjectId($subjectId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classSubjects,
                'message' => 'Class subjects retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving class subjects: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get class subjects by class ID (public - for students)
     */
    public function getByClassPublic() {
        try {
            $classId = $_GET['class_id'] ?? null;
            
            if (!$classId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class ID is required'
                ]);
                return;
            }
            
            $classSubjects = $this->classSubjectModel->getByClassId($classId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classSubjects,
                'message' => 'Class subjects retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving class subjects: ' . $e->getMessage()
            ]);
        }
    }



    /**
     * Search class subjects (admin only)
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
            
            $classSubjects = $this->classSubjectModel->searchClassSubjects($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classSubjects,
                'message' => 'Class subjects search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching class subjects: ' . $e->getMessage()
            ]);
        }
    }



    /**
     * Get statistics (admin only)
     */
    public function getStatistics() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $statistics = $this->classSubjectModel->getStatistics();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $statistics,
                'message' => 'Statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving statistics: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Log user action
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            global $pdo;
            $userLogModel = new UserLogModel($pdo);
            $token = $this->getAuthToken();
            
            if ($token) {
                $userLogModel->logAction($token, $action, $description, $metadata);
            }
        } catch (Exception $e) {
            // Log error silently to avoid breaking the main operation
            error_log('Error logging action: ' . $e->getMessage());
        }
    }

    /**
     * Delete specific subject from a class (admin only)
     */
    public function deleteByClassAndSubject($classId, $subjectId) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Validate parameters
            if (empty($classId) || !is_numeric($classId)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valid class ID is required'
                ]);
                return;
            }
            
            if (empty($subjectId) || !is_numeric($subjectId)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valid subject ID is required'
                ]);
                return;
            }
            
            // Get the specific class subject to be deleted for logging
            $classSubjectToDelete = $this->classSubjectModel->findByUniqueKey($classId, $subjectId);
            
            if (!$classSubjectToDelete) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No class subject found for the specified class and subject'
                ]);
                return;
            }
            
            // Delete the specific class subject
            $deletedCount = $this->classSubjectModel->deleteByClassAndSubject($classId, $subjectId);
            
            if ($deletedCount > 0) {
                // Log the action
                $this->logAction(
                    'DELETE_CLASS_SUBJECT',
                    "Deleted class subject for class ID {$classId} and subject ID {$subjectId}",
                    [
                        'class_id' => $classId,
                        'subject_id' => $subjectId,
                        'deleted_class_subject' => $classSubjectToDelete
                    ]
                );
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => "Successfully deleted class subject for class ID {$classId} and subject ID {$subjectId}",
                    'data' => [
                        'deleted_count' => $deletedCount,
                        'class_id' => $classId,
                        'subject_id' => $subjectId
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete class subject'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting class subject: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get authentication token from headers
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