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
            
            // Include class teacher info
            if (method_exists($this->classModel, 'getAllWithClassTeacher')) {
                $classes = $this->classModel->getAllWithClassTeacher();
            } else {
                $classes = $this->classModel->findAll();
            }
            
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

			// Normalize inputs to prevent duplicates due to casing/whitespace
			if (isset($data['name'])) {
				$data['name'] = preg_replace('/\s+/', ' ', trim($data['name']));
			}
			if (isset($data['section'])) {
				$data['section'] = strtoupper(trim($data['section']));
			}
			if (isset($data['academic_year_id'])) {
				$data['academic_year_id'] = (int)$data['academic_year_id'];
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

			// Academic year ID is required
			if (empty($data['academic_year_id'])) {
				http_response_code(400);
				echo json_encode([
					'success' => false,
					'message' => 'Academic year is required'
				]);
				return;
			}
			
			// Validate that the academic year exists and is active
			if (!$this->isValidAcademicYear($data['academic_year_id'])) {
				http_response_code(400);
				echo json_encode([
					'success' => false,
					'message' => 'Invalid academic year selected'
				]);
				return;
			}

            // Check if this class name already has this section
            $existingClassByNameAndSection = $this->classModel->findByNameAndSection($data['name'], $data['section']);
            if ($existingClassByNameAndSection) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class "' . $data['name'] . '" already has Section "' . $data['section'] . '". Each class name can only have one section with a specific name.'
                ]);
                return;
            }

            // Check if class already exists with same name, section and academic year
            $existingClass = $this->classModel->findByUniqueKey($data['name'], $data['section'], $data['academic_year_id']);
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

			// Normalize inputs to prevent duplicates due to casing/whitespace
			if (isset($data['name'])) {
				$data['name'] = preg_replace('/\s+/', ' ', trim($data['name']));
			}
			if (isset($data['section'])) {
				$data['section'] = strtoupper(trim($data['section']));
			}
			if (isset($data['academic_year_id'])) {
				$data['academic_year_id'] = (int)$data['academic_year_id'];
			}
            
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

			// Academic year ID is required for updates
			if (empty($data['academic_year_id'])) {
				http_response_code(400);
				echo json_encode([
					'success' => false,
					'message' => 'Academic year is required'
				]);
				return;
			}
			
			// Validate that the new academic year exists and is active
			if (!$this->isValidAcademicYear($data['academic_year_id'])) {
				http_response_code(400);
				echo json_encode([
					'success' => false,
					'message' => 'Invalid academic year selected'
				]);
				return;
			}

            // Check if this class name already has this section for different class
            $existingClassByNameAndSection = $this->classModel->findByNameAndSection($data['name'], $data['section']);
            if ($existingClassByNameAndSection && $existingClassByNameAndSection['id'] != $id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Class "' . $data['name'] . '" already has Section "' . $data['section'] . '". Each class name can only have one section with a specific name.'
                ]);
                return;
            }

            // Check if class already exists with same name, section and academic year for different class
            $existingClassWithKey = $this->classModel->findByUniqueKey($data['name'], $data['section'], $data['academic_year_id']);
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
     * Get active classes for cashiers (cashier only)
     */
    public function getActiveForCashier() {
        try {
            global $pdo;
            RoleMiddleware::requireCashier($pdo);
            
            $classes = $this->classModel->getActiveClasses();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $classes,
                'message' => 'Active classes retrieved successfully for cashier'
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
            
            $academicYearId = $_GET['academic_year_id'] ?? '';
            
            if (empty($academicYearId)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Academic year ID parameter is required'
                ]);
                return;
            }
            
            $classes = $this->classModel->getClassesByAcademicYear($academicYearId);
            
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

	/**
	 * Get the current academic year ID from the database.
	 * This is used to ensure consistency when creating new classes.
	 */
	private function getCurrentAcademicYearId() {
		try {
			// Get the current academic year from the database
			$sql = "SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1";
			$stmt = $this->pdo->prepare($sql);
			$stmt->execute();
			$currentYear = $stmt->fetch(PDO::FETCH_ASSOC);

			if ($currentYear) {
				return $currentYear['id'];
			} else {
				// Fallback: get the most recent active academic year
				$sql = "SELECT id FROM academic_years WHERE is_active = 1 ORDER BY start_date DESC LIMIT 1";
				$stmt = $this->pdo->prepare($sql);
				$stmt->execute();
				$activeYear = $stmt->fetch(PDO::FETCH_ASSOC);
				
				if ($activeYear) {
					return $activeYear['id'];
				} else {
					throw new Exception('No academic year found in the system');
				}
			}
		} catch (Exception $e) {
			throw new Exception('Error getting current academic year: ' . $e->getMessage());
		}
	}

	/**
	 * Validate if an academic year ID exists and is active
	 */
	private function isValidAcademicYear($academicYearId) {
		try {
			$sql = "SELECT id FROM academic_years WHERE id = ? AND (is_active = 1 OR is_current = 1) LIMIT 1";
			$stmt = $this->pdo->prepare($sql);
			$stmt->execute([$academicYearId]);
			$result = $stmt->fetch(PDO::FETCH_ASSOC);
			return $result !== false;
		} catch (Exception $e) {
			return false;
		}
	}

	/**
	 * Get the current academic year display name for API responses.
	 * This is used to maintain backward compatibility in API responses.
	 */
	private function getCurrentAcademicYearDisplay() {
		try {
			$sql = "SELECT year_code, display_name FROM academic_years WHERE is_current = 1 LIMIT 1";
			$stmt = $this->pdo->prepare($sql);
			$stmt->execute();
			$currentYear = $stmt->fetch(PDO::FETCH_ASSOC);

			if ($currentYear) {
				return $currentYear['year_code'];
			} else {
				// Fallback: get the most recent active academic year
				$sql = "SELECT year_code FROM academic_years WHERE is_active = 1 ORDER BY start_date DESC LIMIT 1";
				$stmt = $this->pdo->prepare($sql);
				$stmt->execute();
				$activeYear = $stmt->fetch(PDO::FETCH_ASSOC);
				
				if ($activeYear) {
					return $activeYear['year_code'];
				} else {
					return 'No academic year found';
				}
			}
		} catch (Exception $e) {
			return 'Error getting academic year';
		}
	}
}
?> 