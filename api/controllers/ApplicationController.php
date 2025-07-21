<?php
// api/controllers/ApplicationController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/ApplicationModel.php';

class ApplicationController {
    private $pdo;
    private $model;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->model = new ApplicationModel($pdo);
    }

    /**
     * Store a new guest application (POST /applications)
     */
    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        $required = ['student_first_name', 'student_last_name', 'grade'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
                return;
            }
        }
        try {
            $id = $this->model->create($data);
            echo json_encode(['success' => true, 'message' => 'Application submitted successfully', 'id' => $id]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to submit application', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get all guest applications (GET /applications) - Admin only
     */
    public function index() {
        RoleMiddleware::requireAdmin($this->pdo);
        try {
            $applications = (new ApplicationModel($this->pdo))->findAll();
            echo json_encode(['success' => true, 'data' => $applications]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to fetch applications', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Get a single application by ID (GET /applications/{id}) - Admin only
     */
    public function show($id) {
        RoleMiddleware::requireAdmin($this->pdo);
        try {
            $application = (new ApplicationModel($this->pdo))->findById($id);
            if (!$application) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Application not found']);
                return;
            }
            echo json_encode(['success' => true, 'data' => $application]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to fetch application', 'error' => $e->getMessage()]);
        }
    }
} 