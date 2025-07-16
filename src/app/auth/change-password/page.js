import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Input.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Change Password Page Component (/auth/change-password)
 * 
 * Password change form for users who need to change their initial password.
 */
class ChangePasswordPage extends App {
    constructor() {
        super();
        this.formData = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        };
        this.userData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Change Password | School System';
        
        // Get user data from localStorage
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr) {
            // Redirect to login if no user data
            window.location.href = '/auth/login';
            return;
        }
        
        this.userData = JSON.parse(userDataStr);
    }

    handleInputChange(field, value) {
        this.formData[field] = value;
    }

    async handleSubmit() {
        const { currentPassword, newPassword, confirmPassword } = this.formData;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            Toast.show({
                title: 'Validation Error',
                message: 'Please fill in all fields',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({
                title: 'Validation Error',
                message: 'New passwords do not match',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        if (newPassword.length < 8) {
            Toast.show({
                title: 'Validation Error',
                message: 'Password must be at least 8 characters long',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            await this.changePassword(currentPassword, newPassword);
        } catch (error) {
            Toast.show({
                title: 'Password Change Failed',
                message: error.response?.data?.error || 'An error occurred while changing password',
                variant: 'error',
                duration: 3000
            });
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            // Make API call to change password
            const response = await api.post(`/users/${this.userData.id}/change-password`, {
                current_password: currentPassword,
                new_password: newPassword
            });

            Toast.show({
                title: 'Password Changed Successfully',
                message: 'Your password has been updated. Redirecting to dashboard...',
                variant: 'success',
                duration: 3000
            });

            // Redirect to appropriate dashboard based on role
            setTimeout(() => {
                this.redirectToDashboard(this.userData.role);
            }, 3000);

        } catch (error) {
            // Handle specific API errors
            if (error.response?.status === 400) {
                throw new Error('Current password is incorrect');
            } else if (error.response?.status === 404) {
                throw new Error('User not found');
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
            'staff': '/dashboard/staff'
        };

        const route = dashboardRoutes[role] || '/dashboard/admin';
        window.location.href = route;
    }

    render() {
        return `
            <div class="flex items-center justify-center min-h-screen p-5">
                <ui-card class="p-8 shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm max-w-md w-full">
                    <!-- Header Section -->
                    <div class="text-center mb-6">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full mb-4 shadow-lg">
                            <i class="fas fa-key text-white text-2xl"></i>
                        </div>
                        <h1 class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                            Change Password
                        </h1>
                        <p class="text-sm text-gray-600">
                            For security reasons, you must change your password on first login
                        </p>
                    </div>

                    <!-- Form Section -->
                    <form class="space-y-4" onsubmit="event.preventDefault(); this.closest('app-change-password-page').handleSubmit();">
                        <div class="space-y-1">
                            <label class="block text-sm font-semibold text-gray-700 mb-1">
                                Current Password
                            </label>
                            <ui-input 
                                type="password" 
                                placeholder="Enter your current password"
                                class="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                                oninput="this.closest('app-change-password-page').handleInputChange('currentPassword', this.value)">
                            </ui-input>
                        </div>

                        <div class="space-y-1">
                            <label class="block text-sm font-semibold text-gray-700 mb-1">
                                New Password
                            </label>
                            <ui-input 
                                type="password" 
                                placeholder="Enter your new password"
                                class="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                                oninput="this.closest('app-change-password-page').handleInputChange('newPassword', this.value)">
                            </ui-input>
                            <p class="text-xs text-gray-500 mt-1">
                                Password must be at least 8 characters long
                            </p>
                        </div>

                        <div class="space-y-1">
                            <label class="block text-sm font-semibold text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <ui-input 
                                type="password" 
                                placeholder="Confirm your new password"
                                class="transition-all duration-300 hover:shadow-md focus:shadow-lg"
                                oninput="this.closest('app-change-password-page').handleInputChange('confirmPassword', this.value)">
                            </ui-input>
                        </div>

                        <div class="pt-4">
                            <ui-button 
                                type="submit" 
                                color="primary" 
                                class="w-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
                                <i class="fas fa-save text-lg mr-2"></i>
                                Change Password
                            </ui-button>
                        </div>
                    </form>

                    <!-- Footer Section -->
                    <div class="mt-6 pt-4 border-t border-gray-100">
                        <p class="text-center text-xs text-gray-500">
                            This is a security requirement for your account
                        </p>
                    </div>
                </ui-card>
            </div>
        `;
    }
}

customElements.define('app-change-password-page', ChangePasswordPage);
export default ChangePasswordPage; 