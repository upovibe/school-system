<?php
// api/controllers/DbController.php
class DbController {
    public function check() {
        try {
            // Load config to test connection
            $config = require __DIR__ . '/../config/app_config.php';
            $dbConfig = $config['db'];
            
            $host = $dbConfig['host'];
            $db = $dbConfig['name'];
            $user = $dbConfig['user'];
            $pass = $dbConfig['pass'];
            
            // Test connection without database first
            try {
                $tempPdo = new PDO("mysql:host=$host", $user, $pass);
                $tempPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                echo json_encode([
                    'success' => true, 
                    'message' => 'Database connection successful',
                    'config' => [
                        'host' => $host,
                        'database' => $db,
                        'user' => $user,
                        'connected' => true
                    ]
                ]);
            } catch (PDOException $e) {
                echo json_encode([
                    'success' => false, 
                    'error' => 'Database connection failed: ' . $e->getMessage(),
                    'config' => [
                        'host' => $host,
                        'database' => $db,
                        'user' => $user,
                        'connected' => false
                    ]
                ]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Config error: ' . $e->getMessage()]);
        }
    }

    public function fresh() {
        $output = [];
        $result = 0;
        
        // Check if exec is available
        if (!function_exists('exec')) {
            echo json_encode([
                'success' => false,
                'error' => 'exec() function is disabled on this server',
                'output' => 'The exec() function is not available. Please contact your hosting provider.'
            ]);
            return;
        }
        
        // Check if we can access the index.php file
        $indexPath = __DIR__ . '/../index.php';
        if (!file_exists($indexPath)) {
            echo json_encode([
                'success' => false,
                'error' => 'index.php not found',
                'output' => 'Could not find index.php at: ' . $indexPath
            ]);
            return;
        }
        
        // Try to get PHP path
        $phpPath = 'php';
        if (defined('PHP_BINARY')) {
            $phpPath = PHP_BINARY;
        }
        
        // Use full path to PHP and index.php for reliability
        $cmd = $phpPath . ' ' . escapeshellarg($indexPath) . ' --fresh 2>&1';
        
        exec($cmd, $output, $result);
        
        echo json_encode([
            'success' => $result === 0,
            'error' => $result !== 0 ? 'Command failed with exit code: ' . $result : null,
            'output' => implode("\n", $output)
        ]);
    }
} 