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
 * Login form with email and password fields.
 */
class LoginPage extends App {
    constructor() {
        super();
        this.formData = {
            email: '',
            password: '',
            rememberMe: false
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Login | School System';
    }

    handleInputChange(field, value) {
        this.formData[field] = value;
    }

    async handleSubmit() {
        const { email, password, rememberMe } = this.formData;
        
        if (!email || !password) {
            Toast.show({
                title: 'Validation Error',
                message: 'Please fill in all fields',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            // Call the actual API
            await this.authenticateUser(email, password);
        } catch (error) {
            Toast.show({
                title: 'Login Failed',
                message: error.response?.data?.error || 'An error occurred during login',
                variant: 'error',
                duration: 3000
            });
        }
    }

    async authenticateUser(email, password) {
        try {
            // Make API call to authenticate
            const response = await api.post('/auth/login', {
                email: email,
                password: password
            });

            const { user, requires_password_change } = response.data;
            
            // Determine role with multiple fallbacks
            const roleMap = {
                1: 'admin',
                2: 'teacher', 
                3: 'student',
                4: 'parent',
                5: 'staff',
                6: 'cashier'
            };

            const roleFromServer = (user.role || '').toString().toLowerCase();
            const roleFromId = roleMap[user.role_id];
            const roleName = roleFromServer || roleFromId || 'admin';

            // Store user data and token
            localStorage.setItem('userData', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: roleName
            }));
            localStorage.setItem('token', user.token);

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
                throw new Error('Invalid email or password');
            } else if (error.response?.status === 422) {
                throw new Error('Please check your input and try again');
            } else {
                throw new Error('Network error. Please try again.');
            }
        }
    }

    redirectToDashboard(role) {
            const dashboardRoutes = {
                'admin': '/dashboard/admin',
                'teacher': '/dashboard/teacher',
                'student': '/dashboard/student',
                'parent': '/dashboard/parent',
                'staff': '/dashboard/staff',
                'cashier': '/dashboard/cashier'
            };

        const route = dashboardRoutes[role] || '/dashboard/admin';
        window.location.href = route;
    }

    render() {
        return `
            <div class="flex items-center justify-center min-h-screen p-5">
                    <ui-card class="p-8 shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm">
                        <!-- Logo/Icon Section -->
                        <div class="text-center mb-4">
                            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200" onclick="window.location.href='/'">
                                <i class="fas fa-lock text-white text-2xl"></i>
                            </div>
                            <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                                Welcome Back
                            </h1>
                        </div>

                        <!-- Form Section -->
                        <form class="space-y-3" onsubmit="event.preventDefault(); this.closest('app-login-page').handleSubmit();">
                            <div class="space-y-1">
                                <label class="block text-sm font-semibold text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <ui-input 
                                    type="email" 
                                    placeholder="Enter your email"
                                    class="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                                    oninput="this.closest('app-login-page').handleInputChange('email', this.value)">
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

                            <div class="flex items-center justify-between">
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

                            <div class="pt-4">
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
                        <div class="mt-8 pt-6 border-t border-gray-100">
                            <p class="text-center text-sm text-gray-500">
                                Secure login powered by School Management System
                            </p>
                        </div>
                    </ui-card>
            </div>
        `;
    }
}

customElements.define('app-login-page', LoginPage);
export default LoginPage;
