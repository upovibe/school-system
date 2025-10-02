<?php
// api/controllers/HouseController.php - Controller for house operations

require_once __DIR__ . '/../models/HouseModel.php';
require_once __DIR__ . '/../models/TeacherModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class HouseController {
    private $houseModel;
    private $teacherModel;
    private $logModel;
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->houseModel = new HouseModel($pdo);
        $this->teacherModel = new TeacherModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    /**
     * Log action
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            $userId = $this->getCurrentUserId();
            if ($userId) {
                $this->logModel->logAction($userId, $action, $description, $metadata);
            }
        } catch (Exception $e) {
            // Silently fail logging
        }
    }

    /**
     * Get current user ID from session
     */
    private function getCurrentUserId() {
        try {
            if (isset($_SESSION['user_id'])) {
                return $_SESSION['user_id'];
            }
            return null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get all houses with their teachers (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $houses = $this->houseModel->getAllWithTeachers();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $houses,
                'message' => 'Houses retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving houses: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new house (admin only)
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
                    'message' => 'House name is required'
                ]);
                return;
            }

            // Check if house name already exists
            if ($this->houseModel->nameExists($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'House name already exists'
                ]);
                return;
            }

            // Create house
            $houseId = $this->houseModel->create($data);
            
            // Log the action
            $this->logAction('house_created', 'House created successfully', [
                'house_id' => $houseId,
                'house_name' => $data['name']
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => ['id' => $houseId],
                'message' => 'House created successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating house: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific house (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $house = $this->houseModel->getHouseWithTeachers($id);
            
            if (!$house) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'House not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $house,
                'message' => 'House retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving house: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a house (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if house exists
            $existingHouse = $this->houseModel->findById($id);
            if (!$existingHouse) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'House not found'
                ]);
                return;
            }

            // Check if house name already exists (excluding current house)
            if (!empty($data['name']) && $this->houseModel->nameExists($data['name'], $id)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'House name already exists'
                ]);
                return;
            }

            // Update house
            $this->houseModel->update($id, $data);
            
            // Log the action
            $this->logAction('house_updated', 'House updated successfully', [
                'house_id' => $id,
                'house_name' => $existingHouse['name'],
                'updated_fields' => array_keys($data)
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'House updated successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating house: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a house (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if house exists
            $house = $this->houseModel->findById($id);
            if (!$house) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'House not found'
                ]);
                return;
            }

            // Get teachers assigned to this house for logging
            $teachers = $this->houseModel->getHouseTeachers($id);
            
            // Delete house (this will automatically remove teacher assignments due to CASCADE DELETE)
            $this->houseModel->delete($id);
            
            // Log the action
            $this->logAction('house_deleted', 'House deleted successfully', [
                'house_id' => $id,
                'house_name' => $house['name'],
                'teachers_unassigned' => count($teachers),
                'teacher_names' => array_map(function($teacher) {
                    return $teacher['first_name'] . ' ' . $teacher['last_name'];
                }, $teachers)
            ]);
            
            $message = 'House deleted successfully';
            if (!empty($teachers)) {
                $message .= ' and ' . count($teachers) . ' teacher assignment(s) removed';
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => $message
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting house: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get teachers assigned to a house (admin only)
     */
    public function getTeachers($id) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Check if house exists
            $house = $this->houseModel->findById($id);
            if (!$house) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'House not found'
                ]);
                return;
            }

            $teachers = $this->houseModel->getHouseTeachers($id);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teachers,
                'message' => 'House teachers retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving house teachers: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Assign teacher to house (admin only)
     */
    public function assignTeacher($houseId) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['teacher_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher ID is required'
                ]);
                return;
            }

            // Check if house exists
            $house = $this->houseModel->findById($houseId);
            if (!$house) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'House not found'
                ]);
                return;
            }

            // Check if teacher exists
            $teacher = $this->teacherModel->findById($data['teacher_id']);
            if (!$teacher) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher not found'
                ]);
                return;
            }

            // Check if teacher is already assigned to this house
            if ($this->houseModel->isTeacherAssigned($houseId, $data['teacher_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher is already assigned to this house'
                ]);
                return;
            }

            // Assign teacher to house
            $this->houseModel->assignTeacher($houseId, $data['teacher_id']);
            
            // Log the action
            $this->logAction('teacher_assigned_to_house', 'Teacher assigned to house successfully', [
                'house_id' => $houseId,
                'house_name' => $house['name'],
                'teacher_id' => $data['teacher_id'],
                'teacher_name' => $teacher['first_name'] . ' ' . $teacher['last_name']
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Teacher assigned to house successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error assigning teacher to house: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove teacher from house (admin only)
     */
    public function removeTeacher($houseId) {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['teacher_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher ID is required'
                ]);
                return;
            }

            // Check if teacher is assigned to this house
            if (!$this->houseModel->isTeacherAssigned($houseId, $data['teacher_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Teacher is not assigned to this house'
                ]);
                return;
            }

            // Get teacher info for logging
            $teacher = $this->teacherModel->findById($data['teacher_id']);
            $house = $this->houseModel->findById($houseId);
            
            // Remove teacher from house
            $this->houseModel->removeTeacher($houseId, $data['teacher_id']);
            
            // Log the action
            $this->logAction('teacher_removed_from_house', 'Teacher removed from house successfully', [
                'house_id' => $houseId,
                'house_name' => $house['name'],
                'teacher_id' => $data['teacher_id'],
                'teacher_name' => $teacher ? $teacher['first_name'] . ' ' . $teacher['last_name'] : 'Unknown'
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Teacher removed from house successfully'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error removing teacher from house: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get house statistics (admin only)
     */
    public function getStatistics() {
        try {
            // Require admin authentication
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            $statistics = $this->houseModel->getHouseStatistics();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $statistics,
                'message' => 'House statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving house statistics: ' . $e->getMessage()
            ]);
        }
    }
}
?>
