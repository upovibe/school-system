<?php
// api/middlewares/StudentMiddleware.php

require_once __DIR__ . '/../models/StudentModel.php';

class StudentMiddleware {
    /**
     * Require student authentication and verify student exists
     * @throws Exception if not authenticated as student or student not found
     */
    public static function requireStudent($pdo) {
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

            // Verify role is student (role_id = 3)
            if ($payload['role_id'] !== 3) {
                throw new Exception('Access denied: Student role required');
            }

            // Find student by user_id
            $studentModel = new StudentModel($pdo);
            $student = $studentModel->findByUserId($payload['user_id']);
            
            if (!$student) {
                throw new Exception('Student not found for this user');
            }

            // Add student info to request for use in controller
            $_REQUEST['current_student'] = $student;
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
