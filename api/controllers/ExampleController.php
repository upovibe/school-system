<?php
// api/controllers/ExampleController.php - Example controller showing middleware usage

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/RoleModel.php';

class ExampleController {
    private $userModel;
    private $roleModel;

    public function __construct($pdo) {
        $this->userModel = new UserModel($pdo);
        $this->roleModel = new RoleModel($pdo);
    }

    // Route accessible to all authenticated users
    public function publicEndpoint() {
        try {
            // Require authentication only
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            // Access current user from global scope
            global $currentUser;
            
            echo json_encode([
                'message' => 'This endpoint is accessible to all authenticated users',
                'user' => $currentUser
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    // Route accessible only to teachers and admins
    public function teacherOnly() {
        try {
            // Require teacher role (includes admin)
            require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
            global $pdo;
            RoleMiddleware::requireTeacher($pdo);
            
            // Access current user and role from global scope
            global $currentUser, $currentUserRole;
            
            echo json_encode([
                'message' => 'This endpoint is accessible only to teachers and admins',
                'user' => $currentUser,
                'role' => $currentUserRole
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    // Route accessible only to admins
    public function adminOnly() {
        try {
            // Require admin role
            require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
            global $pdo;
            RoleMiddleware::requireAdmin($pdo);
            
            // Access current user and role from global scope
            global $currentUser, $currentUserRole;
            
            echo json_encode([
                'message' => 'This endpoint is accessible only to admins',
                'user' => $currentUser,
                'role' => $currentUserRole
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    // Route accessible to specific roles
    public function customRoles() {
        try {
            // Require specific roles
            require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
            global $pdo;
            RoleMiddleware::requireRoles($pdo, ['admin', 'teacher']);
            
            // Access current user and role from global scope
            global $currentUser, $currentUserRole;
            
            echo json_encode([
                'message' => 'This endpoint is accessible to admins and teachers only',
                'user' => $currentUser,
                'role' => $currentUserRole
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 