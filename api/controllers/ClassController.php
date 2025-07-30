<?php
// api/controllers/ClassController.php - Controller for class operations

require_once __DIR__ . '/../models/ClassModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class ClassController {
    private $classModel;
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->classModel = new ClassModel($pdo);
    }

    /**
     * Get all classes (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $classes = $this->classModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classes,
                'message' => 'Classes retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving classes: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new class (admin only)
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
                    'message' => 'Class name is required'
                ]);
                return;
            }

            if (empty($data['section'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class section is required'
                ]);
                return;
            }

            if (empty($data['academic_year'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year is required'
                ]);
                return;
            }

            // Check if class already exists with same name, section and academic year
            $existingClass = $this->classModel->findByUniqueKey($data['name'], $data['section'], $data['academic_year']);
            if ($existingClass) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class already exists with this name, section and academic year'
                ]);
                return;
            }

            // Set default values if not provided
            if (!isset($data['capacity'])) {
                $data['capacity'] = 30;
            }

            if (!isset($data['status'])) {
                $data['status'] = 'active';
            }

            // Create class
            $classId = $this->classModel->create($data);
            
            // Log class creation
            $this->logAction('class_created', 'New class created', $data);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => ['id' => $classId],
                'message' => 'Class created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating class: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific class (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $class = $this->classModel->findById($id);
            
            if (!$class) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $class,
                'message' => 'Class retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving class: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a class (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if class exists
            $existingClass = $this->classModel->findById($id);
            if (!$existingClass) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class not found'
                ]);
                return;
            }

            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class name is required'
                ]);
                return;
            }

            if (empty($data['section'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class section is required'
                ]);
                return;
            }

            if (empty($data['academic_year'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year is required'
                ]);
                return;
            }

            // Check if class already exists with same name, section and academic year for different class
            $existingClassWithKey = $this->classModel->findByUniqueKey($data['name'], $data['section'], $data['academic_year']);
            if ($existingClassWithKey && $existingClassWithKey['id'] != $id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class already exists with this name, section and academic year'
                ]);
                return;
            }

            // Update class
            $this->classModel->update($id, $data);
            
            // Log class update
            $this->logAction('class_updated', 'Class updated', $data);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Class updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating class: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a class (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if class exists
            $existingClass = $this->classModel->findById($id);
            if (!$existingClass) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class not found'
                ]);
                return;
            }

            // Check if class has students
            $classesWithCounts = $this->classModel->getClassesWithStudentCounts();
            $classWithCount = null;
            foreach ($classesWithCounts as $class) {
                if ($class['id'] == $id) {
                    $classWithCount = $class;
                    break;
                }
            }

            if ($classWithCount && $classWithCount['student_count'] > 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cannot delete class. It has ' . $classWithCount['student_count'] . ' student(s) assigned.'
                ]);
                return;
            }

            // Delete class
            $this->classModel->delete($id);
            
            // Log class deletion
            $this->logAction('class_deleted', 'Class deleted', $existingClass);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Class deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting class: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active classes (public)
     */
    public function getActive() {
        try {
            $classes = $this->classModel->getActiveClasses();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classes,
                'message' => 'Active classes retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active classes: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get classes by academic year (admin only)
     */
    public function getByAcademicYear() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $academicYear = $_GET['year'] ?? '';
            
            if (empty($academicYear)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year parameter is required'
                ]);
                return;
            }
            
            $classes = $this->classModel->getClassesByAcademicYear($academicYear);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classes,
                'message' => 'Classes for academic year retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving classes by academic year: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search classes (admin only)
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
            
            $classes = $this->classModel->searchClasses($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classes,
                'message' => 'Classes search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching classes: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get classes with student counts (admin only)
     */
    public function getWithStudentCounts() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $classes = $this->classModel->getClassesWithStudentCounts();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classes,
                'message' => 'Classes with student counts retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving classes with student counts: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get available academic years (admin only)
     */
    public function getAcademicYears() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $academicYears = $this->classModel->getAvailableAcademicYears();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $academicYears,
                'message' => 'Available academic years retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving academic years: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get available sections (admin only)
     */
    public function getSections() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $sections = $this->classModel->getAvailableSections();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $sections,
                'message' => 'Available sections retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving sections: ' . $e->getMessage()
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