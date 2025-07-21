<?php
// api/controllers/DbController.php
class DbController {
    public function check() {
        require_once __DIR__ . '/../database/connection.php';
        global $pdo;
        try {
            $stmt = $pdo->query("SELECT 1");
            echo json_encode(['success' => (bool)$stmt]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    public function fresh() {
        $output = [];
        $result = 0;
        // Use full path to PHP and index.php for reliability
        $cmd = 'php ' . escapeshellarg(__DIR__ . '/../index.php') . ' --fresh 2>&1';
        exec($cmd, $output, $result);
        echo json_encode([
            'success' => $result === 0,
            'output' => implode("\n", $output)
        ]);
    }
} 