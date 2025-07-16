<?php
// api/controllers/LogController.php - Controller for audit log operations

require_once __DIR__ . '/../models/UserLogModel.php';

class LogController {
    private $logModel;

    public function __construct($pdo) {
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            ob_clean();
            
            // Get query parameters
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 50;
            $action = $_GET['action'] ?? null;
            $user_id = $_GET['user_id'] ?? null;
            
            // Build query
            $sql = "SELECT ul.*, u.name as user_name, u.email as user_email 
                    FROM user_logs ul 
                    LEFT JOIN users u ON ul.user_id = u.id";
            
            $whereConditions = [];
            $params = [];
            
            if ($action) {
                $whereConditions[] = "ul.action = ?";
                $params[] = $action;
            }
            
            if ($user_id) {
                $whereConditions[] = "ul.user_id = ?";
                $params[] = $user_id;
            }
            
            if (!empty($whereConditions)) {
                $sql .= " WHERE " . implode(' AND ', $whereConditions);
            }
            
            $sql .= " ORDER BY ul.created_at DESC";
            
            // Add pagination
            $offset = ($page - 1) * $limit;
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $this->logModel->pdo->prepare($sql);
            $stmt->execute($params);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get total count for pagination
            $countSql = "SELECT COUNT(*) as total FROM user_logs ul";
            if (!empty($whereConditions)) {
                $countSql .= " WHERE " . implode(' AND ', $whereConditions);
            }
            
            $countStmt = $this->logModel->pdo->prepare($countSql);
            $countParams = array_slice($params, 0, -2); // Remove limit and offset
            $countStmt->execute($countParams);
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            echo json_encode([
                'success' => true,
                'message' => 'Logs retrieved successfully',
                'data' => $logs,
                'pagination' => [
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve logs',
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }

    public function show($id) {
        try {
            ob_clean();
            
            $sql = "SELECT ul.*, u.name as user_name, u.email as user_email 
                    FROM user_logs ul 
                    LEFT JOIN users u ON ul.user_id = u.id 
                    WHERE ul.id = ?";
            
            $stmt = $this->logModel->pdo->prepare($sql);
            $stmt->execute([$id]);
            $log = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$log) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Log not found'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Log retrieved successfully',
                'data' => $log
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve log',
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }
}
?> 