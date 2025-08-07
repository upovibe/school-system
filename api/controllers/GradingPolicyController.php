<?php
// api/controllers/GradingPolicyController.php - Controller for managing grading policies

require_once __DIR__ . '/../models/GradingPolicyModel.php';
require_once __DIR__ . '/../models/SubjectModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class GradingPolicyController {
    private $pdo;
    private $gradingPolicyModel;
    private $subjectModel;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->gradingPolicyModel = new GradingPolicyModel($pdo);
        $this->subjectModel = new SubjectModel($pdo);
    }
    
    /**
     * Get all grading policies with subject details (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $policies = $this->gradingPolicyModel->getAllPoliciesWithSubject();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $policies,
                'message' => 'Grading policies retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving grading policies: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get a specific grading policy (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $policy = $this->gradingPolicyModel->getPolicyWithSubject($id);
            
            if (!$policy) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grading policy not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $policy,
                'message' => 'Grading policy retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving grading policy: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create a new grading policy (admin only)
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
                    'message' => 'Policy name is required'
                ]);
                return;
            }

            if (empty($data['description'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Policy description is required'
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

            if (empty($data['assignment_max_score'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment max score is required'
                ]);
                return;
            }

            if (empty($data['exam_max_score'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Exam max score is required'
                ]);
                return;
            }

            if (empty($data['grade_boundaries'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grade boundaries are required'
                ]);
                return;
            }
            
            // Validate grade boundaries
            if (!is_array($data['grade_boundaries'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grade boundaries must be an array'
                ]);
                return;
            }
            
            // Check if subject exists
            $subject = $this->subjectModel->findById($data['subject_id']);
            if (!$subject) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject not found'
                ]);
                return;
            }
            
            // Check if policy already exists for this subject
            if ($this->gradingPolicyModel->subjectHasPolicy($data['subject_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'A grading policy already exists for this subject'
                ]);
                return;
            }
            
            $policyData = [
                'name' => $data['name'],
                'description' => $data['description'],
                'subject_id' => $data['subject_id'],
                'is_active' => $data['is_active'] ?? 1,
                'assignment_max_score' => $data['assignment_max_score'],
                'exam_max_score' => $data['exam_max_score'],
                'grade_boundaries' => json_encode($data['grade_boundaries']),
                'created_by' => $this->getCurrentUserId()
            ];
            
            $policyId = $this->gradingPolicyModel->create($policyData);
            
            // Log the action
            $this->logAction('grading_policy_created', "Created grading policy: {$data['name']}", [
                'policy_id' => $policyId,
                'subject_id' => $data['subject_id'],
                'subject_name' => $subject['name']
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Grading policy created successfully',
                'data' => ['id' => $policyId]
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating grading policy: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Update an existing grading policy (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if policy exists
            $existingPolicy = $this->gradingPolicyModel->findById($id);
            if (!$existingPolicy) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grading policy not found'
                ]);
                return;
            }
            
            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Policy name is required'
                ]);
                return;
            }

            if (empty($data['description'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Policy description is required'
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

            if (empty($data['assignment_max_score'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Assignment max score is required'
                ]);
                return;
            }

            if (empty($data['exam_max_score'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Exam max score is required'
                ]);
                return;
            }

            if (empty($data['grade_boundaries'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grade boundaries are required'
                ]);
                return;
            }
            
            // Validate grade boundaries
            if (!is_array($data['grade_boundaries'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grade boundaries must be an array'
                ]);
                return;
            }
            
            // Check if subject exists
            $subject = $this->subjectModel->findById($data['subject_id']);
            if (!$subject) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Subject not found'
                ]);
                return;
            }
            
            // Check if another policy exists for this subject (excluding current policy)
            if ($data['subject_id'] != $existingPolicy['subject_id']) {
                if ($this->gradingPolicyModel->subjectHasPolicy($data['subject_id'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'A grading policy already exists for this subject'
                    ]);
                    return;
                }
            }
            
            $policyData = [
                'name' => $data['name'],
                'description' => $data['description'],
                'subject_id' => $data['subject_id'],
                'is_active' => $data['is_active'] ?? $existingPolicy['is_active'],
                'assignment_max_score' => $data['assignment_max_score'],
                'exam_max_score' => $data['exam_max_score'],
                'grade_boundaries' => json_encode($data['grade_boundaries'])
            ];
            
            $this->gradingPolicyModel->update($id, $policyData);
            
            // Log the action
            $this->logAction('grading_policy_updated', "Updated grading policy: {$data['name']}", [
                'policy_id' => $id,
                'subject_id' => $data['subject_id'],
                'subject_name' => $subject['name']
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Grading policy updated successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating grading policy: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete a grading policy (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if policy exists
            $policy = $this->gradingPolicyModel->findById($id);
            if (!$policy) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Grading policy not found'
                ]);
                return;
            }
            
            $this->gradingPolicyModel->delete($id);
            
            // Log the action
            $this->logAction('grading_policy_deleted', "Deleted grading policy: {$policy['name']}", [
                'policy_id' => $id,
                'subject_id' => $policy['subject_id']
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Grading policy deleted successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting grading policy: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get subjects without grading policies (admin only)
     */
    public function getSubjectsWithoutPolicies() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $subjects = $this->gradingPolicyModel->getSubjectsWithoutPolicies();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $subjects,
                'message' => 'Subjects without policies retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving subjects without policies: ' . $e->getMessage()
            ]);
        }
    }
    

    

    
    /**
     * Log action to user log
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            $logModel = new UserLogModel($this->pdo);
            $userId = $this->getCurrentUserId();
            
            $logModel->logAction($userId, $action, $description, $metadata);
        } catch (Exception $e) {
            // Silently fail logging
        }
    }
    
    /**
     * Get current user ID from session/token
     */
    private function getCurrentUserId() {
        try {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
                $parts = explode('.', $token);
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                return $payload['user_id'] ?? null;
            }
        } catch (Exception $e) {
            return null;
        }
        return null;
    }
    
    /**
     * Get current user role
     */
    private function getCurrentUserRole() {
        // This should be implemented based on your authentication system
        // For now, we'll get it from the session or token
        $userId = $this->getCurrentUserId();
        
        $sql = "SELECT r.name as role 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? $result['role'] : null;
    }
}
?>
