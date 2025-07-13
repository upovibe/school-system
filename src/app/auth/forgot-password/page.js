import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Input.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Forgot Password Page Component (/auth/forgot-password)
 * 
 * Forgot password form with email field and password reset functionality.
 */
class ForgotPasswordPage extends App {
    constructor() {
        super();
        this.formData = {
            email: ''
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Forgot Password | School System';
    }

    handleInputChange(field, value) {
        this.formData[field] = value;
    }

    async handleSubmit() {
        const { email } = this.formData;
        
        if (!email) {
            Toast.show({
                title: 'Validation Error',
                message: 'Please enter your email address',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toast.show({
                title: 'Invalid Email',
                message: 'Please enter a valid email address',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            await this.sendPasswordReset(email);
        } catch (error) {
            Toast.show({
                title: 'Reset Failed',
                message: error.response?.data?.error || 'An error occurred while sending reset email',
                variant: 'error',
                duration: 3000
            });
        }
    }

    async sendPasswordReset(email) {
        try {
            // Make API call to send password reset email
            const response = await api.post('/auth/forgot-password', {
                email: email
            });

            Toast.show({
                title: 'Reset Email Sent',
                message: 'If an account with this email exists, you will receive password reset instructions.',
                variant: 'success',
                duration: 5000
            });

            // Clear form
            this.formData.email = '';
            this.querySelector('ui-input').value = '';

            // Redirect to login page after a delay
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 3000);

        } catch (error) {
            // Handle specific API errors
            if (error.response?.status === 404) {
                throw new Error('No account found with this email address');
            } else if (error.response?.status === 422) {
                throw new Error('Please check your email address and try again');
            } else {
                throw new Error('Network error. Please try again.');
            }
        }
    }

    // Removed updateSubmitButton method - simplified like login page

    render() {
        return `
            <div class="flex items-center justify-center min-h-screen p-5">
                    <ui-card class="p-8 shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm max-w-sm w-full">
                        <!-- Logo/Icon Section -->
                        <div class="text-center mb-4">
                            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full mb-6 shadow-lg">
                                <i class="fas fa-key text-white text-2xl"></i>
                            </div>
                            <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                                Forgot Password?
                            </h1>
                        </div>

                        <!-- Form Section -->
                        <form class="space-y-3" onsubmit="event.preventDefault(); this.closest('app-forgot-password-page').handleSubmit();">
                            <div class="space-y-1">
                                <label class="block text-sm font-semibold text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <ui-input 
                                    type="email" 
                                    placeholder="Enter your email address"
                                    class="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                                    oninput="this.closest('app-forgot-password-page').handleInputChange('email', this.value)">
                                </ui-input>
                            </div>

                            <div class="pt-4">
                                <ui-button 
                                    type="submit" 
                                    color="primary" 
                                    class="w-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
                                    <i class="fas fa-envelope text-lg mr-2"></i>
                                    Send Reset Email
                                </ui-button>
                            </div>
                        </form>

                        <!-- Back to Login Section -->
                        <div class="flex flex-col md:flex-row items-center justify-between pt-2">
                                <p class="text-sm text-gray-600">
                                    Remember your password?
                                </p>
                                <a 
                                    href="/auth/login" 
                                    class="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200 hover:underline">
                                    <i class="fas fa-arrow-left text-sm mr-1"></i>
                                    Back to Login
                                </a>
                            </div>

                        <!-- Info Section -->
                        <div class="mt-2 p-4 bg-blue-50 rounded-lg">
                            <div class="flex items-start">
                                <i class="fas fa-info-circle text-blue-600 mt-0.5 mr-2 text-lg"></i>
                                <div class="text-sm text-blue-800">
                                    <p class="font-medium mb-1">What happens next?</p>
                                    <p class="text-blue-700">
                                        If an account with this email exists, you'll receive a password reset link within a few minutes. 
                                        Check your spam folder if you don't see it in your inbox.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Footer Section -->
                        <div class="mt-8 pt-6 border-t border-gray-100">
                            <p class="text-center text-sm text-gray-500">
                                Secure password reset powered by School Management System
                            </p>
                        </div>
                    </ui-card>
            </div>
        `;
    }
}

customElements.define('app-forgot-password-page', ForgotPasswordPage);
export default ForgotPasswordPage; 