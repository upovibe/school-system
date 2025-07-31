<?php
// api/controllers/TeacherAssignmentController.php - Controller for teacher assignment operations

require_once __DIR__ . '/../models/TeacherAssignmentModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class TeacherAssignmentController {
    private $teacherAssignmentModel;
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->teacherAssignmentModel = new TeacherAssignmentModel($pdo);
    }

    /**
     * Get all teacher assignments (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $filters = [];
            
            // Apply filters if provided
            if (isset($_GET['teacher_id'])) {
                $filters['teacher_id'] = $_GET['teacher_id'];
            }
            
            if (isset($_GET['class_id'])) {
                $filters['class_id'] = $_GET['class_id'];
            }
            
            if (isset($_GET['subject_id'])) {
                $filters['subject_id'] = $_GET['subject_id'];
            }
            
            if (isset($_GET['status'])) {
                $filters['status'] = $_GET['status'];
            }
            
            $teacherAssignments = $this->teacherAssignmentModel->getWithDetails($filters);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teacherAssignments,
                'message' => 'Teacher assignments retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher assignments: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new teacher assignment (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
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

            // Check if teacher assignment already exists with same combination
            $existingTeacherAssignment = $this->teacherAssignmentModel->findByUniqueKey(
                $data['teacher_id'],
                $data['class_id'], 
                $data['subject_id']
            );
            
            if ($existingTeacherAssignment) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher assignment already exists with this combination'
                ]);
                return;
            }

            // Create the teacher assignment
            $teacherAssignmentId = $this->teacherAssignmentModel->create($data);
            
            if ($teacherAssignmentId) {
                // Log the action
                $this->logAction('create', "Created teacher assignment", [
                    'teacher_assignment_id' => $teacherAssignmentId,
                    'teacher_id' => $data['teacher_id'],
                    'class_id' => $data['class_id'],
                    'subject_id' => $data['subject_id']
                ]);
                
                // Get the created teacher assignment with details
                $teacherAssignment = $this->teacherAssignmentModel->getWithDetails([
                    'teacher_id' => $data['teacher_id'],
                    'class_id' => $data['class_id'],
                    'subject_id' => $data['subject_id']
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $teacherAssignment[0] ?? null,
                    'message' => 'Teacher assignment created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error creating teacher assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating teacher assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific teacher assignment (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $teacherAssignment = $this->teacherAssignmentModel->findById($id);
            
            if (!$teacherAssignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher assignment not found'
                ]);
                return;
            }
            
            // Get with details
            $teacherAssignments = $this->teacherAssignmentModel->getWithDetails([
                'teacher_id' => $teacherAssignment['teacher_id'],
                'class_id' => $teacherAssignment['class_id'],
                'subject_id' => $teacherAssignment['subject_id']
            ]);
            
            $teacherAssignmentWithDetails = $teacherAssignments[0] ?? $teacherAssignment;
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teacherAssignmentWithDetails,
                'message' => 'Teacher assignment retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a teacher assignment (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if teacher assignment exists
            $existingTeacherAssignment = $this->teacherAssignmentModel->findById($id);
            if (!$existingTeacherAssignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher assignment not found'
                ]);
                return;
            }
            
            // Validate required fields
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

            // Check if the new combination already exists (excluding current record)
            $existingWithNewKey = $this->teacherAssignmentModel->findByUniqueKey(
                $data['teacher_id'],
                $data['class_id'], 
                $data['subject_id']
            );
            
            if ($existingWithNewKey && $existingWithNewKey['id'] != $id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher assignment already exists with this combination'
                ]);
                return;
            }

            // Update the teacher assignment
            $success = $this->teacherAssignmentModel->update($id, $data);
            
            if ($success) {
                // Log the action
                $this->logAction('update', "Updated teacher assignment", [
                    'teacher_assignment_id' => $id,
                    'teacher_id' => $data['teacher_id'],
                    'class_id' => $data['class_id'],
                    'subject_id' => $data['subject_id']
                ]);
                
                // Get the updated teacher assignment with details
                $teacherAssignments = $this->teacherAssignmentModel->getWithDetails([
                    'teacher_id' => $data['teacher_id'],
                    'class_id' => $data['class_id'],
                    'subject_id' => $data['subject_id']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $teacherAssignments[0] ?? null,
                    'message' => 'Teacher assignment updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating teacher assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating teacher assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a teacher assignment (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if teacher assignment exists
            $teacherAssignment = $this->teacherAssignmentModel->findById($id);
            if (!$teacherAssignment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher assignment not found'
                ]);
                return;
            }
            
            // Delete the teacher assignment
            $success = $this->teacherAssignmentModel->delete($id);
            
            if ($success) {
                // Log the action
                $this->logAction('delete', "Deleted teacher assignment", [
                    'teacher_assignment_id' => $id,
                    'teacher_id' => $teacherAssignment['teacher_id'],
                    'class_id' => $teacherAssignment['class_id'],
                    'subject_id' => $teacherAssignment['subject_id']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Teacher assignment deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error deleting teacher assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting teacher assignment: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get teacher assignments by teacher ID (admin only)
     */
    public function getByTeacher() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $teacherId = $_GET['teacher_id'] ?? null;
            
            if (!$teacherId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher ID is required'
                ]);
                return;
            }
            
            $teacherAssignments = $this->teacherAssignmentModel->getByTeacherId($teacherId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teacherAssignments,
                'message' => 'Teacher assignments retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher assignments: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get teacher assignments by class ID (admin only)
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
            
            $teacherAssignments = $this->teacherAssignmentModel->getByClassId($classId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teacherAssignments,
                'message' => 'Teacher assignments retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher assignments: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get teacher assignments by subject ID (admin only)
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
            
            $teacherAssignments = $this->teacherAssignmentModel->getBySubjectId($subjectId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teacherAssignments,
                'message' => 'Teacher assignments retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving teacher assignments: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search teacher assignments (admin only)
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
            
            $teacherAssignments = $this->teacherAssignmentModel->searchAssignments($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teacherAssignments,
                'message' => 'Teacher assignments search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching teacher assignments: ' . $e->getMessage()
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
            
            $statistics = $this->teacherAssignmentModel->getStatistics();
            
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
     * Delete all assignments for a teacher and specific class (admin only)
     */
    public function deleteByTeacherAndClass($teacherId, $classId) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Validate parameters
            if (empty($teacherId) || !is_numeric($teacherId)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valid teacher ID is required'
                ]);
                return;
            }
            
            if (empty($classId) || !is_numeric($classId)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valid class ID is required'
                ]);
                return;
            }
            
            // Get assignments to be deleted for logging
            $assignmentsToDelete = $this->teacherAssignmentModel->getByTeacherAndClass($teacherId, $classId);
            
            // Delete all assignments for this teacher and class
            $deletedCount = $this->teacherAssignmentModel->deleteByTeacherAndClass($teacherId, $classId);
            
            if ($deletedCount > 0) {
                // Log the action
                $this->logAction(
                    'DELETE_TEACHER_CLASS_ASSIGNMENTS',
                    "Deleted {$deletedCount} teacher assignment(s) for teacher ID {$teacherId} and class ID {$classId}",
                    [
                        'teacher_id' => $teacherId,
                        'class_id' => $classId,
                        'deleted_count' => $deletedCount,
                        'deleted_assignments' => $assignmentsToDelete
                    ]
                );
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => "Successfully deleted {$deletedCount} teacher assignment(s) for teacher ID {$teacherId} and class ID {$classId}",
                    'data' => [
                        'deleted_count' => $deletedCount,
                        'teacher_id' => $teacherId,
                        'class_id' => $classId
                    ]
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No teacher assignments found for the specified teacher and class'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting teacher assignments: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update assignments for a teacher and specific class (admin only)
     */
    public function updateByTeacherAndClass($teacherId, $classId) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Validate parameters
            if (empty($teacherId) || !is_numeric($teacherId)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valid teacher ID is required'
                ]);
                return;
            }
            
            if (empty($classId) || !is_numeric($classId)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valid class ID is required'
                ]);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate subject IDs array
            if (!isset($data['subject_ids']) || !is_array($data['subject_ids'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject IDs array is required'
                ]);
                return;
            }
            
            // Filter out any invalid subject IDs
            $validSubjectIds = array_filter($data['subject_ids'], function($id) {
                return !empty($id) && is_numeric($id);
            });
            
            if (empty($validSubjectIds)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'At least one valid subject ID is required'
                ]);
                return;
            }
            
            // Get current assignments for this teacher and class for logging
            $currentAssignments = $this->teacherAssignmentModel->getByTeacherAndClass($teacherId, $classId);
            
            // Delete all existing assignments for this teacher and class
            $deleteResponse = $this->teacherAssignmentModel->deleteByTeacherAndClass($teacherId, $classId);
            
            if ($deleteResponse === false) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to clear existing assignments'
                ]);
                return;
            }
            
            // Create new assignments for each subject
            $createdAssignments = [];
            $allSuccessful = true;
            
            foreach ($validSubjectIds as $subjectId) {
                $assignmentData = [
                    'teacher_id' => (int)$teacherId,
                    'class_id' => (int)$classId,
                    'subject_id' => (int)$subjectId
                ];
                
                $result = $this->teacherAssignmentModel->create($assignmentData);
                if ($result) {
                    $createdAssignments[] = $result;
                } else {
                    $allSuccessful = false;
                    break;
                }
            }
            
            if ($allSuccessful) {
                // Log the action
                $this->logAction(
                    'UPDATE_TEACHER_CLASS_ASSIGNMENTS',
                    "Updated assignments for teacher ID {$teacherId} and class ID {$classId}",
                    [
                        'teacher_id' => $teacherId,
                        'class_id' => $classId,
                        'old_assignments' => $currentAssignments,
                        'new_assignments' => $createdAssignments,
                        'subject_ids' => $validSubjectIds
                    ]
                );
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => "Successfully updated assignments for teacher ID {$teacherId} and class ID {$classId}",
                    'data' => [
                        'created_count' => count($createdAssignments),
                        'teacher_id' => $teacherId,
                        'class_id' => $classId,
                        'subject_ids' => $validSubjectIds,
                        'assignments' => $createdAssignments
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Some assignments failed to create'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating teacher class assignments: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete specific assignment for a teacher, class, and subject (admin only)
     */
    public function deleteByTeacherClassAndSubject($teacherId, $classId, $subjectId) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Validate parameters
            if (empty($teacherId) || !is_numeric($teacherId)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Valid teacher ID is required'
                ]);
                return;
            }
            
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
            
            // Get the specific assignment to be deleted for logging
            $assignmentToDelete = $this->teacherAssignmentModel->getByTeacherClassAndSubject($teacherId, $classId, $subjectId);
            
            if (!$assignmentToDelete) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No teacher assignment found for the specified teacher, class, and subject'
                ]);
                return;
            }
            
            // Delete the specific assignment
            $deletedCount = $this->teacherAssignmentModel->deleteByTeacherClassAndSubject($teacherId, $classId, $subjectId);
            
            if ($deletedCount > 0) {
                // Log the action
                $this->logAction(
                    'DELETE_TEACHER_CLASS_SUBJECT_ASSIGNMENT',
                    "Deleted teacher assignment for teacher ID {$teacherId}, class ID {$classId}, and subject ID {$subjectId}",
                    [
                        'teacher_id' => $teacherId,
                        'class_id' => $classId,
                        'subject_id' => $subjectId,
                        'deleted_assignment' => $assignmentToDelete
                    ]
                );
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => "Successfully deleted teacher assignment for teacher ID {$teacherId}, class ID {$classId}, and subject ID {$subjectId}",
                    'data' => [
                        'deleted_count' => $deletedCount,
                        'teacher_id' => $teacherId,
                        'class_id' => $classId,
                        'subject_id' => $subjectId
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete teacher assignment'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting teacher assignment: ' . $e->getMessage()
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