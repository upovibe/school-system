<?php
// api/controllers/UserController.php - Controller for user operations

require_once __DIR__ . '/../models/UserModel.php';

class UserController {
    private $userModel;

    public function __construct($pdo) {
        $this->userModel = new UserModel($pdo);
    }

    public function index() {
        try {
            // Ensure clean output
            ob_clean();
            
            $users = $this->userModel->findAll();
            echo json_encode($users, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function store() {
        try {
            // Ensure clean output
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['name']) || !isset($data['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name and email are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            $id = $this->userModel->create($data);
            http_response_code(201);
            echo json_encode(['id' => $id, 'message' => 'User created'], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    // Add other methods like show, update, destroy as needed
}
?> 