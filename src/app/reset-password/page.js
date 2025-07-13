import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Input.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Reset Password Page Component (/reset-password)
 * 
 * Password reset form that handles the token from URL and allows setting new password.
 */
class ResetPasswordPage extends App {
    constructor() {
        super();
        this.formData = {
            password: '',
            confirmPassword: ''
        };
        this.token = null;
        this.isValidToken = false;
        this.isLoading = true;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Reset Password | School System';
        this.extractTokenFromUrl();
    }

    extractTokenFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.token = urlParams.get('token');
        
        if (!this.token) {
            this.showError('Invalid reset link. Please request a new password reset.');
            return;
        }

        // Validate token format (basic check)
        if (this.token.length < 32) {
            this.showError('Invalid reset token format.');
            return;
        }

        this.isValidToken = true;
        this.isLoading = false;
        this.render();
    }

    showError(message) {
        this.isLoading = false;
        this.render();
        
        Toast.show({
            title: 'Invalid Reset Link',
            message: message,
            variant: 'error',
            duration: 5000
        });

        // Redirect to forgot password page after showing error
        setTimeout(() => {
            window.location.href = '/auth/forgot-password';
        }, 3000);
    }

    handleInputChange(field, value) {
        this.formData[field] = value;
    }

    validatePassword(password) {
        // Simple validation - just check minimum length
        if (password.length < 6) {
            return {
                isValid: false,
                error: 'Password must be at least 6 characters long'
            };
        }
        return { isValid: true };
    }

    async handleSubmit() {
        const { password, confirmPassword } = this.formData;
        
        if (!password || !confirmPassword) {
            Toast.show({
                title: 'Validation Error',
                message: 'Please fill in all fields',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                title: 'Password Mismatch',
                message: 'Passwords do not match',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        // Validate password strength
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
            Toast.show({
                title: 'Weak Password',
                message: passwordValidation.error,
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            await this.resetPassword(password);
        } catch (error) {
            Toast.show({
                title: 'Reset Failed',
                message: error.response?.data?.error || 'An error occurred while resetting password',
                variant: 'error',
                duration: 3000
            });
        }
    }

    async resetPassword(password) {
        try {
            // Make API call to reset password
            const response = await api.post('/auth/reset-password', {
                token: this.token,
                password: password
            });

            Toast.show({
                title: 'Password Reset Successful',
                message: 'Your password has been updated successfully. You can now login with your new password.',
                variant: 'success',
                duration: 5000
            });

            // Clear form
            this.formData.password = '';
            this.formData.confirmPassword = '';
            this.querySelectorAll('ui-input').forEach(input => input.value = '');

            // Redirect to login page after a delay
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 3000);

        } catch (error) {
            // Handle specific API errors
            if (error.response?.status === 400) {
                throw new Error('Invalid or expired reset token. Please request a new password reset.');
            } else if (error.response?.status === 422) {
                throw new Error('Please check your password and try again');
            } else {
                throw new Error('Network error. Please try again.');
            }
        }
    }

    render() {
        if (this.isLoading) {
            return `
                <div class="flex items-center justify-center min-h-screen p-5">
                    <ui-card class="p-8 shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm max-w-md w-full">
                        <div class="text-center">
                            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-lg">
                                <i class="fas fa-spinner fa-spin text-white text-2xl"></i>
                            </div>
                            <h1 class="text-xl font-semibold text-gray-700 mb-2">Validating Reset Link</h1>
                            <p class="text-gray-500">Please wait while we verify your reset link...</p>
                        </div>
                    </ui-card>
                </div>
            `;
        }

        if (!this.isValidToken) {
            return `
                <div class="flex items-center justify-center min-h-screen p-5">
                    <ui-card class="p-8 shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm max-w-md w-full">
                        <div class="text-center">
                            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-full mb-6 shadow-lg">
                                <i class="fas fa-exclamation-triangle text-white text-2xl"></i>
                            </div>
                            <h1 class="text-xl font-semibold text-gray-700 mb-2">Invalid Reset Link</h1>
                            <p class="text-gray-500 mb-4">Redirecting to forgot password page...</p>
                            <ui-button 
                                color="primary" 
                                onclick="window.location.href='/auth/forgot-password'"
                                class="transform transition-all duration-300 hover:scale-105">
                                <i class="fas fa-arrow-left text-sm mr-2"></i>
                                Go to Forgot Password
                            </ui-button>
                        </div>
                    </ui-card>
                </div>
            `;
        }

        return `
            <div class="flex items-center justify-center min-h-screen p-5">
                <ui-card class="p-8 shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm max-w-md w-full">
                    <!-- Logo/Icon Section -->
                    <div class="text-center mb-4">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full mb-6 shadow-lg">
                            <i class="fas fa-key text-white text-2xl"></i>
                        </div>
                        <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                            Reset Password
                        </h1>
                    </div>

                    <!-- Form Section -->
                    <form class="space-y-3" onsubmit="event.preventDefault(); this.closest('app-reset-password-page').handleSubmit();">
                        <div class="space-y-1">
                            <label class="block text-sm font-semibold text-gray-700 mb-1">
                                New Password
                            </label>
                            <ui-input 
                                type="password" 
                                placeholder="Enter your new password"
                                class="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                                oninput="this.closest('app-reset-password-page').handleInputChange('password', this.value)">
                            </ui-input>
                        </div>

                        <div class="space-y-1">
                            <label class="block text-sm font-semibold text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <ui-input 
                                type="password" 
                                placeholder="Confirm your new password"
                                class="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                                oninput="this.closest('app-reset-password-page').handleInputChange('confirmPassword', this.value)">
                            </ui-input>
                        </div>

                                                 <div class="pt-4">
                            <ui-button 
                                type="submit" 
                                color="primary" 
                                class="w-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
                                <i class="fas fa-save text-lg mr-2"></i>
                                Reset Password
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

customElements.define('app-reset-password-page', ResetPasswordPage);
export default ResetPasswordPage;
