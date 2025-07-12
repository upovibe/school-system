<?php
// api/database/connection.php - Reusable DB connection

require_once __DIR__ . '/../config/load_env.php'; // Load env helper
$env = loadEnv(__DIR__ . '/../../../.env'); // Path to .env outside web root (parent of project root)

$host = $env['DB_HOST'] ?? 'localhost';
$db = $env['DB_NAME'] ?? 'upoui_db';
$user = $env['DB_USER'] ?? 'root';
$pass = $env['DB_PASS'] ?? '';

// Step 1: Connect without DB to check/create it
try {
    $tempPdo = new PDO("mysql:host=$host", $user, $pass);
    $tempPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Create DB if not exists
    $tempPdo->exec("CREATE DATABASE IF NOT EXISTS $db");
    $tempPdo = null; // Close temp connection
} catch (PDOException $e) {
    die(json_encode(['error' => 'DB Creation failed: ' . $e->getMessage()]));
}

// Step 2: Connect to the DB
try {
    global $pdo; // Declare as global
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'DB Connection failed: ' . $e->getMessage()]));
}
?> 