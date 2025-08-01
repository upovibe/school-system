<?php
// api/middlewares/TeacherMiddleware.php

require_once __DIR__ . '/../models/TeacherModel.php';

class TeacherMiddleware {
    /**
     * Require teacher authentication and verify teacher exists
     * @throws Exception if not authenticated as teacher or teacher not found
     */
    public static function requireTeacher($pdo) {
        try {
            // Get auth token from headers
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            
            if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                throw new Exception('No valid authorization token found');
            }

            $token = $matches[1];
            $parts = explode('.', $token);
            
            if (count($parts) !== 3) {
                throw new Exception('Invalid token format');
            }
            
            // Decode token payload
            $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
            
            if (!$payload || !isset($payload['user_id']) || !isset($payload['role_id'])) {
                throw new Exception('Invalid token payload');
            }

            // Verify role is teacher (role_id = 2)
            if ($payload['role_id'] !== 2) {
                throw new Exception('Access denied: Teacher role required');
            }

            // Find teacher by user_id
            $teacherModel = new TeacherModel($pdo);
            $teacher = $teacherModel->findByUserId($payload['user_id']);
            
            if (!$teacher) {
                throw new Exception('Teacher not found for this user');
            }

            // Add teacher info to request for use in controller
            $_REQUEST['current_teacher'] = $teacher;
            $_REQUEST['current_user_id'] = $payload['user_id'];
            
            return true;

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Authentication failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }
} 