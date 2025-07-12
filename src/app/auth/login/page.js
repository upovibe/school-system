import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Input.js';
import '@/components/ui/Button.js';
import '@/components/ui/Checkbox.js';
import '@/components/ui/Toast.js';

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

    handleSubmit() {
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

        // Here you would typically make an API call to authenticate
        console.log('Login attempt:', { email, password, rememberMe });
        
        Toast.show({
            title: 'Login Attempt',
            message: 'Login functionality will be implemented here',
            variant: 'info',
            duration: 3000
        });
    }

    render() {
        return `
            <div class="flex items-center justify-center min-h-screen p-5">
                    <ui-card class="p-8 shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm">
                        <!-- Logo/Icon Section -->
                        <div class="text-center mb-4">
                            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-lg">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                            </div>
                            <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                                Welcome Back
                            </h1>
                            <p class="text-gray-600 text-lg">
                                Sign in to your account
                            </p>
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
                                    <a href="#" class="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>

                            <div class="pt-4">
                                <ui-button 
                                    type="submit" 
                                    color="primary" 
                                    size="lg" 
                                    class="w-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                                    </svg>
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
