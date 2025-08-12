<?php
// api/controllers/AuthController.php - Controller for authentication operations

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserSessionModel.php';
require_once __DIR__ . '/../models/PasswordResetModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../models/TeacherModel.php';
require_once __DIR__ . '/../models/StudentModel.php';
require_once __DIR__ . '/../core/EmailService.php';
// REMOVE: require_once __DIR__ . '/../config/load_env.php';

class AuthController {
    private $userModel;
    private $sessionModel;
    private $passwordResetModel;
    private $logModel;
    private $emailService;
    private $teacherModel;
    private $studentModel;
    private $config;

    public function __construct($pdo) {
        $this->userModel = new UserModel($pdo);
        $this->sessionModel = new UserSessionModel($pdo);
        $this->passwordResetModel = new PasswordResetModel($pdo);
        $this->logModel = new UserLogModel($pdo);
        $this->emailService = new EmailService();
        $this->teacherModel = new TeacherModel($pdo);
        $this->studentModel = new StudentModel($pdo);
        // Use config from app_config.php
        $this->config = require __DIR__ . '/../config/app_config.php';
    }

    public function login() {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if login is by ID or email
            if (isset($data['login_type']) && $data['login_type'] === 'id') {
                return $this->loginById($data);
            } else {
                return $this->loginByEmail($data);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    private function loginByEmail($data) {
        try {
            if (!isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Email and password are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            $email = trim($data['email']);
            $password = $data['password'];
            
            // Search for the email in both teachers and students tables first
            $user = null;
            $profileData = null;
            $userType = null;
            
            // First, try to find in teachers table
            $teacher = $this->teacherModel->where('email', $email)->first();
            if ($teacher && $teacher['status'] === 'active') {
                $userType = 'teacher';
                $profileData = $teacher;
                
                // Get the linked user record
                if ($teacher['user_id']) {
                    $user = $this->userModel->findById($teacher['user_id']);
                }
            }
            
            // If not found in teachers, try students table
            if (!$user) {
                $student = $this->studentModel->where('email', $email)->first();
                if ($student && $student['status'] === 'active') {
                    $userType = 'student';
                    $profileData = $student;
                    
                    // Get the linked user record
                    if ($student['user_id']) {
                        $user = $this->userModel->findById($student['user_id']);
                    }
                }
            }
            
            // If still no user found, try direct user table (for admins)
            if (!$user) {
                $user = $this->userModel->findByEmail($email);
                if ($user && $user['status'] === 'active') {
                    $userType = 'admin'; // Assume admin if not in teachers/students
                    $profileData = null;
                }
            }
            
            // If still no user found, throw error
            if (!$user) {
                throw new Exception('Invalid credentials');
            }
            
            // Check if user is active
            if ($user['status'] !== 'active') {
                throw new Exception('Account is inactive');
            }
            
            // Verify password based on user type
            if ($userType === 'admin') {
                // For admin users, verify password from users table
                if (!password_verify($password, $user['password'])) {
                    throw new Exception('Invalid credentials');
                }
            } else {
                // For teachers/students, verify password from profile table
                if (!password_verify($password, $profileData['password'])) {
                    throw new Exception('Invalid credentials');
                }
            }
            
            // Check if user needs to change password
            $requiresPasswordChange = !$user['password_changed'];
            
            // Generate JWT token
            $token = $this->generateJWT($user);
            
            // Create user session in database
            $this->createUserSession($user['id'], $token);
            
            // Store session data
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_type'] = $userType;
            $_SESSION['profile_data'] = $profileData;
            
            // Log the login action
            if ($this->logModel) {
                $this->logModel->logAction($user['id'], $userType, 'email');
            }
            
            // Return user data with token
            unset($user['password']);
            $user['token'] = $token;
            $user['requires_password_change'] = $requiresPasswordChange;
            $user['profile_data'] = $profileData;
            
            echo json_encode([
                'message' => 'Login successful',
                'user' => $user,
                'requires_password_change' => $requiresPasswordChange
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    private function loginById($data) {
        try {
            // Validate required fields
            if (empty($data['id']) || empty($data['password'])) {
                throw new Exception('ID and password are required');
            }

            $id = trim($data['id']);
            $password = $data['password'];

            // Search for the ID in both teachers and students tables
            $user = null;
            $profileData = null;
            $userType = null;

            // First, try to find in teachers table
            $teacher = $this->teacherModel->findByEmployeeId($id);
            if ($teacher && $teacher['status'] === 'active') {
                $userType = 'teacher';
                $profileData = $teacher;
                
                // Get the linked user record
                if ($teacher['user_id']) {
                    $user = $this->userModel->findById($teacher['user_id']);
                }
            }

            // If not found in teachers, try students table
            if (!$user) {
                $student = $this->studentModel->findByStudentId($id);
                if ($student && $student['status'] === 'active') {
                    $userType = 'student';
                    $profileData = $student;
                    
                    // Get the linked user record
                    if ($student['user_id']) {
                        $user = $this->userModel->findById($student['user_id']);
                    }
                }
            }

            // If still no user found, throw error
            if (!$user) {
                throw new Exception('Invalid ID or user not found');
            }

            // Check if user is active
            if ($user['status'] !== 'active') {
                throw new Exception('User account is inactive');
            }

            // Verify password from the profile table (teachers/students have the password)
            $storedPassword = $profileData['password'];
            if (!password_verify($password, $storedPassword)) {
                throw new Exception('Invalid credentials');
            }

            // Generate JWT token
            $token = $this->generateJWT($user);

            // Store session data
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_type'] = $userType;
            $_SESSION['profile_data'] = $profileData;

            // Log the login action
            if ($this->logModel) {
                $this->logModel->logAction($user['id'], $userType, 'id');
            }

            // Check if password change is required
            $requiresPasswordChange = !$user['password_changed'];

            // Return user data with token
            unset($user['password']);
            $user['token'] = $token;
            $user['requires_password_change'] = $requiresPasswordChange;
            $user['profile_data'] = $profileData;
            
            echo json_encode([
                'message' => 'Login successful',
                'user' => $user,
                'requires_password_change' => $requiresPasswordChange
            ], JSON_PRETTY_PRINT);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function logout() {
        try {
            ob_clean();
            
            $headers = getallheaders();
            $token = $headers['Authorization'] ?? null;
            
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'No token provided'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Remove "Bearer " prefix
            $token = str_replace('Bearer ', '', $token);
            
            // Find and delete session
            $session = $this->sessionModel->findByToken($token);
            if ($session) {
                $this->sessionModel->delete($session['id']);
                $this->logModel->logAction($session['user_id'], 'logout', 'User logged out');
            }
            
            echo json_encode(['message' => 'Logout successful'], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function refresh() {
        try {
            ob_clean();
            
            $headers = getallheaders();
            $token = $headers['Authorization'] ?? null;
            
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'No token provided'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Remove "Bearer " prefix
            $token = str_replace('Bearer ', '', $token);
            
            // Find active session
            $session = $this->sessionModel->findActiveSession($token);
            if (!$session) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid or expired token'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Get user data
            $user = $this->userModel->findById($session['user_id']);
            if (!$user || $user['status'] !== 'active') {
                http_response_code(401);
                echo json_encode(['error' => 'User not found or inactive'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Generate new token
            $newToken = $this->generateJWT($user);
            
            // Update session
            $this->sessionModel->update($session['id'], [
                'token' => $newToken,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours'))
            ]);
            
            unset($user['password']);
            $user['token'] = $newToken;
            
            echo json_encode([
                'message' => 'Token refreshed',
                'user' => $user
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function forgotPassword() {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Email is required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if user exists
            $user = $this->userModel->findByEmail($data['email']);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Generate reset token
            $token = bin2hex(random_bytes(32));
            
            // Delete existing resets for this email
            $this->passwordResetModel->deleteByEmail($data['email']);
            
            // Create new reset record
            $resetData = [
                'email' => $data['email'],
                'token' => $token,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+1 hour'))
            ];
            
            $this->passwordResetModel->create($resetData);
            
            // Send email with reset link
            $clientUrl = $this->config['client_url'] ?? 'http://localhost:8000';
            $resetUrl = $clientUrl . '/reset-password?token=' . $token;
            $emailSent = $this->emailService->sendPasswordResetEmail($data['email'], $resetUrl);
            
            if (!$emailSent) {
                // Log the error but don't expose it to the user
                error_log('Failed to send password reset email to: ' . $data['email']);
            }
            
            echo json_encode([
                'message' => 'Password reset link sent to email',
                'email_sent' => $emailSent
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function resetPassword() {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['token']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Token and new password are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Find active reset
            $reset = $this->passwordResetModel->findActiveReset($data['token']);
            if (!$reset) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid or expired reset token'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Find user
            $user = $this->userModel->findByEmail($reset['email']);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Update password
            $this->userModel->update($user['id'], [
                'password' => password_hash($data['password'], PASSWORD_DEFAULT)
            ]);
            
            // Delete reset record
            $this->passwordResetModel->delete($reset['id']);
            
            // Revoke all sessions for user
            $this->sessionModel->revokeUserSessions($user['id']);
            
            // Log password reset
            $this->logModel->logAction($user['id'], 'password_reset', 'Password reset successfully');
            
            echo json_encode(['message' => 'Password reset successful'], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }



    private function generateJWT($user) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role_id' => $user['role_id'],
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, 'your-secret-key', true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * Get real IP address
     */
    private function getRealIpAddress() {
        // Check for forwarded IP addresses
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_CLIENT_IP',        // Client IP
            'HTTP_X_FORWARDED_FOR',  // Forwarded IP
            'HTTP_X_FORWARDED',      // Forwarded IP
            'HTTP_X_CLUSTER_CLIENT_IP', // Cluster client IP
            'HTTP_FORWARDED_FOR',    // Forwarded for
            'HTTP_FORWARDED',        // Forwarded
            'REMOTE_ADDR'            // Direct IP
        ];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        // Fallback to REMOTE_ADDR
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Create a new user session in the database
     */
    private function createUserSession($userId, $token) {
        try {
            $sessionData = [
                'user_id' => $userId,
                'token' => $token,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
                'ip_address' => $this->getRealIpAddress(),
                'expires_at' => date('Y-m-d H:i:s', time() + (24 * 60 * 60)) // 24 hours
            ];
            
            $this->sessionModel->create($sessionData);
        } catch (Exception $e) {
            // Log error but don't fail login
            error_log("Failed to create user session: " . $e->getMessage());
        }
    }
}
?> 