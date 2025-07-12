# Middleware System

This middleware system provides authentication and role-based access control for your API routes.

## Available Middleware

### 1. AuthMiddleware
Provides basic authentication by validating JWT tokens.

**Usage:**
```php
// In your controller method
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
global $pdo;
AuthMiddleware::requireAuth($pdo);

// Access current user
global $currentUser;
```

### 2. RoleMiddleware
Provides role-based access control with predefined role checks.

**Available Methods:**
- `RoleMiddleware::requireAdmin($pdo)` - Admin only
- `RoleMiddleware::requireTeacher($pdo)` - Teachers and admins
- `RoleMiddleware::requireStudent($pdo)` - Students, teachers, and admins
- `RoleMiddleware::requireRoles($pdo, $roles)` - Custom roles

**Usage:**
```php
// In your controller method
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
global $pdo;

// Admin only
RoleMiddleware::requireAdmin($pdo);

// Teachers and admins
RoleMiddleware::requireTeacher($pdo);

// Custom roles
RoleMiddleware::requireRoles($pdo, ['admin', 'teacher']);

// Access current user and role
global $currentUser, $currentUserRole;
```

## How to Use

### 1. Protect Routes with Authentication Only
```php
public function someMethod() {
    try {
        // Require authentication
        require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
        global $pdo;
        AuthMiddleware::requireAuth($pdo);
        
        // Your controller logic here
        global $currentUser;
        echo json_encode(['user' => $currentUser]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
```

### 2. Protect Routes with Role-Based Access
```php
public function adminOnlyMethod() {
    try {
        // Require admin role
        require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
        global $pdo;
        RoleMiddleware::requireAdmin($pdo);
        
        // Your controller logic here
        global $currentUser, $currentUserRole;
        echo json_encode([
            'user' => $currentUser,
            'role' => $currentUserRole
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
```

### 3. Teacher-Only Routes
```php
public function teacherMethod() {
    try {
        // Require teacher role (includes admin)
        require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
        global $pdo;
        RoleMiddleware::requireTeacher($pdo);
        
        // Your controller logic here
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
```

## Error Responses

The middleware automatically handles error responses:

- **401 Unauthorized**: No token provided or invalid token
- **403 Forbidden**: Insufficient permissions for the role
- **500 Internal Server Error**: Other errors

## Global Variables

After successful middleware execution, these global variables are available:

- `$currentUser`: The authenticated user data
- `$currentUserRole`: The user's role information

## Example Routes

Add these to your `routes.php`:

```php
// Public routes (no middleware needed)
Router::post('/auth/login', 'AuthController@login');

// Protected routes (add middleware in controllers)
Router::get('/users', 'UserController@index');
Router::get('/users/{id}', 'UserController@show');

// Admin-only routes
Router::get('/logs', 'LogController@index');
Router::delete('/users/{id}', 'UserController@destroy');

// Teacher-only routes
Router::get('/assignments', 'AssignmentController@index');
Router::post('/assignments', 'AssignmentController@store');
```

## Security Features

1. **Token Validation**: Validates JWT tokens against active sessions
2. **Session Management**: Checks if user sessions are active and not expired
3. **Role Hierarchy**: Implements proper role-based access control
4. **User Status Check**: Ensures only active users can access protected routes
5. **Automatic Error Handling**: Provides consistent error responses

## Best Practices

1. Always use middleware at the beginning of your controller methods
2. Handle exceptions properly in your controllers
3. Use appropriate role checks for different endpoints
4. Keep authentication routes public (no middleware)
5. Log important actions using the UserLogModel 