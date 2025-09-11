import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Input.js';
import '@/components/ui/Button.js';
import '@/components/ui/Checkbox.js';
import '@/components/ui/Toast.js';

import api from '@/services/api.js';

/**
 * Login Page Component (/auth/login)
 * 
 * Smart login form that automatically detects email or ID input.
 */
class LoginPage extends App {
    constructor() {
        super();
        this.formData = {
            emailOrId: '',
            password: '',
            rememberMe: false
        };
        this.schoolLogo = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Login | School System';
        
        // Check if user is already authenticated and redirect if so
        this.checkAuthenticationAndRedirect();
        
        // Load school logo
        this.loadSchoolLogo();
    }
    
    /**
     * Check if user is already authenticated and redirect to appropriate dashboard
     */
    checkAuthenticationAndRedirect() {
        try {
            const userData = localStorage.getItem('userData');
            const token = localStorage.getItem('token');
            
            // If both userData and token exist, user is authenticated
            if (userData && token) {
                // Parse user data to get role
                const user = JSON.parse(userData);
                const role = user.role || 'admin';
                
                // Redirect to appropriate dashboard
                this.redirectToDashboard(role);
            }
        } catch (error) {
            console.error('❌ Error checking authentication:', error);
            // If there's an error parsing user data, clear it and show login
            localStorage.removeItem('userData');
            localStorage.removeItem('token');
        }
    }

    /**
     * Load school logo from settings
     */
    async loadSchoolLogo() {
        try {
            const response = await api.get('/settings/key/application_logo');
            if (response.data.success && response.data.data.setting_value) {
                this.schoolLogo = response.data.data.setting_value;
                this.render(); // Re-render to show the logo
            }
        } catch (error) {
            console.warn('School logo not found, using default icon');
            // Keep schoolLogo as null to show default icon
        }
    }

    handleInputChange(field, value) {
        this.formData[field] = value;
    }

    // Auto-detect if input is email or ID
    detectInputType(input) {
        // Check if it looks like an email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(input)) {
            return 'email';
        }
        
        // If not email, it's an ID (let backend figure out if teacher or student)
        return 'id';
    }

    async handleSubmit() {
        const { emailOrId, password, rememberMe } = this.formData;
        
        if (!emailOrId || !password) {
            Toast.show({
                title: 'Validation Error',
                message: 'Please fill in all fields',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            const inputType = this.detectInputType(emailOrId);
            
            if (inputType === 'email') {
                await this.authenticateUser({ email: emailOrId, password }, 'email');
            } else {
                // For ID-based login, just send the ID and password
                // Backend will automatically search both teachers and students tables
                await this.authenticateUser({ 
                    id: emailOrId, 
                    password
                }, 'id');
            }
        } catch (error) {
            Toast.show({
                title: 'Login Failed',
                message: error.response?.data?.error || 'Invalid email or password',
                variant: 'error',
                duration: 3000
            });
        }
    }

    async authenticateUser(credentials, loginType) {
        try {
            // Add login type to credentials
            const requestData = {
                ...credentials,
                login_type: loginType
            };

            // Make API call to authenticate
            const response = await api.post('/auth/login', requestData);

            const { user, requires_password_change } = response.data;
            
            // Determine role with multiple fallbacks
            const roleMap = {
                1: 'admin',
                2: 'teacher', 
                3: 'student',
                4: 'cashier'
            };

            const roleFromServer = (user.role || '').toString().toLowerCase();
            const roleFromId = roleMap[user.role_id];
            const roleName = roleFromServer || roleFromId || 'admin';

            // Store user data and token
            localStorage.setItem('userData', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: roleName,
                profileData: user.profile_data || null
            }));
            localStorage.setItem('token', user.token);

            // Mark the session as active in sessionStorage.
            // This flag will be checked on page load to determine if it's a new tab.
            sessionStorage.setItem('session_active', 'true');

            // Check if user needs to change password
            if (requires_password_change) {
                // Set flag in localStorage
                localStorage.setItem('requiresPasswordChange', 'true');
                
                Toast.show({
                    title: 'Password Change Required',
                    message: 'You must change your password on first login',
                    variant: 'warning',
                    duration: 5000
                });
                
                // Redirect to password change page
                setTimeout(() => {
                    window.location.href = '/auth/change-password';
                }, 2000);
                return;
            }

            // Clear the flag if user doesn't need to change password
            localStorage.removeItem('requiresPasswordChange');

            Toast.show({
                title: 'Login Successful',
                message: `Welcome back, ${user.name}!`,
                variant: 'success',
                duration: 2000
            });

            // Redirect to appropriate dashboard based on role
            setTimeout(() => {
                this.redirectToDashboard(roleName);
            }, 2000);

        } catch (error) {
            
            // Handle specific API errors
            if (error.response?.status === 401) {
                throw new Error('Invalid credentials');
            } else if (error.response?.status === 422) {
                throw new Error('Please check your input and try again');
            } else if (error.response?.status) {
                // Server returned an error status
                throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
            } else if (error.code === 'ERR_NETWORK') {
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                throw new Error(error.message || 'An unexpected error occurred. Please try again.');
            }
        }
    }

    redirectToDashboard(role) {
        const dashboardRoutes = {
            'admin': '/dashboard/admin',
            'teacher': '/dashboard/teacher',
            'student': '/dashboard/student',
            'cashier': '/dashboard/cashier'
        };

        const route = dashboardRoutes[role] || '/dashboard/admin';
        window.location.href = route;
    }

    render() {
        return `
            <div class="flex items-center justify-center min-h-screen p-5">
                <ui-card class="p-8 shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm max-w-sm w-full">
                    <!-- Logo/Icon Section -->
                    <div class="text-center mb-6">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4 shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200" onclick="window.location.href='/'">
                            ${this.schoolLogo ? 
                                `<img src="/api/${this.schoolLogo}" alt="School Logo" class="w-12 h-12 rounded-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                 <i class="fas fa-lock text-white text-2xl hidden"></i>` :
                                `<i class="fas fa-lock text-white text-2xl"></i>`
                            }
                        </div>
                        <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                            Welcome Back
                        </h1>
                        <p class="text-gray-600 text-sm">Sign in with your email or ID</p>
                    </div>

                    <!-- Smart Login Form -->
                    <form class="space-y-4" onsubmit="event.preventDefault(); this.closest('app-login-page').handleSubmit();">
                        <div class="space-y-1">
                            <label class="block text-sm font-semibold text-gray-700 mb-1">
                                Email or ID
                            </label>
                            <ui-input 
                                type="text" 
                                placeholder="Enter your email, Employee ID, or Student ID"
                                class="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                                oninput="this.closest('app-login-page').handleInputChange('emailOrId', this.value)">
                            </ui-input>
                        </div>

                        <div class="space-y-1">
                            <label class="block text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <ui-input 
                                type="password" 
                                placeholder="Enter your password"
                                class="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                                oninput="this.closest('app-login-page').handleInputChange('password', this.value)">
                            </ui-input>
                        </div>

                        <div class="flex items-center justify-between gap-10">
                            <div class="flex items-center">
                                <ui-checkbox 
                                    label="Remember me"
                                    class="transition-all duration-200 hover:scale-105"
                                    onchange="this.closest('app-login-page').handleInputChange('rememberMe', this.checked)">
                                </ui-checkbox>
                            </div>
                            <div class="text-sm">
                                <a href="/auth/forgot-password" class="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <div class="pt-2">
                            <ui-button 
                                type="submit" 
                                color="primary" 
                                class="w-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
                                <i class="fas fa-sign-in-alt text-lg mr-2"></i>
                                Sign In
                            </ui-button>
                        </div>
                    </form>                                        

                    <!-- Footer Section -->
                    <div class="pt-4">
                        <p class="text-center text-sm text-gray-500">
                            Secure login powered by PhirmHost
                        </p>
                    </div>
                </ui-card>
            </div>
        `;
    }
}

customElements.define('app-login-page', LoginPage);
export default LoginPage;
