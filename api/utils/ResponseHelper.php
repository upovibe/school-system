<?php
class ResponseHelper {
    public static function json($data, $statusCode = 200) {
        // Clear any existing output
        if (ob_get_length()) ob_clean();
        
        // Set headers
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token, Authorization');
        
        // Set status code
        http_response_code($statusCode);
        
        // Output JSON
        echo json_encode($data);
        exit;
    }

    public static function success($data = null, $message = 'Success', $statusCode = 200) {
        self::json([
            'success' => true,
            'data' => $data,
            'message' => $message
        ], $statusCode);
    }

    public static function error($message = 'Error', $statusCode = 400) {
        self::json([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
}
