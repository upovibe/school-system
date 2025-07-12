<?php
// api/index.php - API entry point

// Handle CLI commands
if (php_sapi_name() === 'cli') {
    require_once __DIR__ . '/core/CliHandler.php';
    CliHandler::handle();
}

require_once __DIR__ . '/database/connection.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/core/CorsHandler.php';
require_once __DIR__ . '/core/SecurityHandler.php';
require_once __DIR__ . '/routes/routes.php';

// Initialize handlers
$cors = new CorsHandler();
$security = new SecurityHandler();

// Set security headers
$security->setSecurityHeaders();

// Set CORS headers
$cors->setHeaders();

// Handle preflight OPTIONS request
$cors->handlePreflight();

// Set content type
header('Content-Type: application/json');

// Get and validate request
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Validate request
$security->validateMethod($method);
$security->validateRequest();

// Process URI
$uri = trim(str_replace('/api', '', $uri), '/');
$security->validateUri($uri);

// Route the request
try {
    Router::dispatch('/' . $uri, $method, $pdo);
} catch (Exception $e) {
    $security->handleError($e);
}
?> 