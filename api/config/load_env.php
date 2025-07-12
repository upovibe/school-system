<?php
// api/config/load_env.php - Simple .env loader

function loadEnv($filePath) {
    if (!file_exists($filePath)) {
        die('Error: .env file not found at ' . $filePath);
    }

    $env = [];
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue; // Skip comments
        list($key, $value) = explode('=', $line, 2);
        $env[trim($key)] = trim($value);
    }
    return $env;
}

// Usage: Adjust this path in files that need it
// e.g., $env = loadEnv(__DIR__ . '/../../.env'); // Points to project root /c/upovibe/upoUI/.env
?> 