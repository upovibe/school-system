<?php
// api/core/Router.php - Simple router for mapping routes to controllers

class Router {
    private static $routes = [];

    public static function add($method, $path, $controllerAction) {
        self::$routes[] = ['method' => strtoupper($method), 'path' => $path, 'action' => $controllerAction];
    }

    public static function get($path, $controllerAction) {
        self::add('GET', $path, $controllerAction);
    }

    public static function post($path, $controllerAction) {
        self::add('POST', $path, $controllerAction);
    }

    // Add more methods as needed (put, delete, etc.)

    public static function dispatch($uri, $method, $pdo) {
        $method = strtoupper($method);
        foreach (self::$routes as $route) {
            if ($route['method'] === $method && $route['path'] === $uri) {
                list($controller, $action) = explode('@', $route['action']);
                require_once __DIR__ . '/../controllers/' . $controller . '.php';
                $controllerInstance = new $controller($pdo);
                return $controllerInstance->$action();
            }
        }
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
    }
}
?> 