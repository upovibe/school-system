import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Avatar.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/authLayout/PasswordChangeDialog.js';

/**
 * User Profile Page Component (/dashboard/profile)
 * 
 * Universal profile page that can be used by any role (admin, teacher, student, parent, staff)
 * Allows users to view and update their profile information.
 */
class ProfilePage extends App {
    constructor() {
        super();
        this.userData = null;
        this.isEditing = false;
        this.isLoading = true;
        this.isSaving = false;
        this.editForm = {
            name: '',
            email: '',
            username: ''
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Profile | School System';
        this.loadUserProfile();
        this.setupEventListeners();
    }

    async loadUserProfile() {
        try {
            this.set('isLoading', true);
            
            // Get current user ID from localStorage
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.id;
            
            if (!userId) {
                throw new Error('User ID not found');
            }

            const token = localStorage.getItem('token');
            const response = await api.withToken(token).get(`/users/${userId}/profile`);
            
            this.userData = response.data;
            this.editForm = {
                name: this.userData.name || '',
                email: this.userData.email || '',
                username: this.userData.username || ''
            };
            
            this.set('userData', this.userData);
            this.set('isLoading', false);
        } catch (error) {
            console.error('Error loading profile:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load profile data',
                variant: 'error',
                duration: 5000
            });
            this.set('isLoading', false);
        }
    }

    setupEventListeners() {
        this.addEventListener('click', (e) => {
            const editButton = e.target.closest('[data-action="edit-profile"]');
            if (editButton) {
                e.preventDefault();
                this.toggleEditMode();
            }

            const saveButton = e.target.closest('[data-action="save-profile"]');
            if (saveButton) {
                e.preventDefault();
                this.saveProfile();
            }

            const cancelButton = e.target.closest('[data-action="cancel-edit"]');
            if (cancelButton) {
                e.preventDefault();
                this.cancelEdit();
            }

            const changePasswordButton = e.target.closest('[data-action="change-password"]');
            if (changePasswordButton) {
                e.preventDefault();
                this.showChangePasswordDialog();
            }
        });
    }

    toggleEditMode() {
        this.set('isEditing', !this.get('isEditing'));
    }

    cancelEdit() {
        // Reset form to original values
        this.editForm = {
            name: this.userData.name || '',
            email: this.userData.email || '',
            username: this.userData.username || ''
        };
        this.set('isEditing', false);
    }

    async saveProfile() {
        try {
            this.set('isSaving', true);
            
            const userId = this.userData.id;
            const token = localStorage.getItem('token');
            
            const response = await api.withToken(token).put(`/users/${userId}/profile`, this.editForm);
            
            // Update local storage with new data
            const updatedUserData = { ...this.userData, ...this.editForm };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            this.userData = updatedUserData;
            this.set('userData', this.userData);
            this.set('isEditing', false);
            
            Toast.show({
                title: 'Success',
                message: 'Profile updated successfully',
                variant: 'success',
                duration: 3000
            });
        } catch (error) {
            console.error('Error saving profile:', error);
            const errorMessage = error.response?.data?.error || 'Failed to update profile';
            Toast.show({
                title: 'Error',
                message: errorMessage,
                variant: 'error',
                duration: 5000
            });
        } finally {
            this.set('isSaving', false);
        }
    }

    showChangePasswordDialog() {
        // Create and show password change dialog
        const dialog = document.createElement('auth-password-change-dialog');
        document.body.appendChild(dialog);
    }

    render() {
        if (this.get('isLoading')) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            `;
        }

        const user = this.get('userData');
        const isEditing = this.get('isEditing');
        const isSaving = this.get('isSaving');

        if (!user) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <div class="text-gray-500 text-lg mb-2">Profile not found</div>
                        <button onclick="window.location.reload()" class="text-blue-600 hover:text-blue-800">
                            Try again
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="max-w-4xl mx-auto space-y-6">
                <!-- Header -->
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
                        ${!isEditing ? `
                            <button 
                                data-action="edit-profile"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <i class="fas fa-edit mr-2"></i>Edit Profile
                            </button>
                        ` : ''}
                    </div>

                    <!-- Profile Picture and Basic Info -->
                    <div class="flex items-start space-x-6 mb-8">
                        <div class="flex-shrink-0">
                            <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-3xl text-gray-400"></i>
                            </div>
                        </div>
                        
                        <div class="flex-1">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Name -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    ${isEditing ? `
                                        <input 
                                            type="text" 
                                            value="${this.editForm.name}"
                                            onchange="this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.editForm.name = this.value"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your full name"
                                        />
                                    ` : `
                                        <div class="text-gray-900 font-medium">${user.name || 'Not provided'}</div>
                                    `}
                                </div>

                                <!-- Email -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    ${isEditing ? `
                                        <input 
                                            type="email" 
                                            value="${this.editForm.email}"
                                            onchange="this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.editForm.email = this.value"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your email"
                                        />
                                    ` : `
                                        <div class="text-gray-900 font-medium">${user.email || 'Not provided'}</div>
                                    `}
                                </div>

                                <!-- Username -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                    ${isEditing ? `
                                        <input 
                                            type="text" 
                                            value="${this.editForm.username}"
                                            onchange="this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.editForm.username = this.value"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your username"
                                        />
                                    ` : `
                                        <div class="text-gray-900 font-medium">${user.username || 'Not provided'}</div>
                                    `}
                                </div>

                                <!-- Role -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                    <div class="text-gray-900 font-medium capitalize">${user.role || 'Not assigned'}</div>
                                </div>

                                <!-- Status -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        user.status === 'active' ? 'bg-green-100 text-green-800' : 
                                        user.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                                        'bg-gray-100 text-gray-800'
                                    }">
                                        ${user.status || 'Unknown'}
                                    </div>
                                </div>

                                <!-- Created Date -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                                    <div class="text-gray-900 font-medium">
                                        ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    ${isEditing ? `
                        <div class="flex space-x-3 pt-4 border-t border-gray-200">
                            <button 
                                data-action="save-profile"
                                disabled="${isSaving}"
                                class="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                            >
                                ${isSaving ? '<i class="fas fa-spinner fa-spin mr-2"></i>' : '<i class="fas fa-save mr-2"></i>'}
                                ${isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                                data-action="cancel-edit"
                                disabled="${isSaving}"
                                class="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ` : ''}
                </div>

                <!-- Security Section -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Security</h2>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-medium text-gray-900">Password</h3>
                                <p class="text-sm text-gray-500">Change your account password</p>
                            </div>
                            <button 
                                data-action="change-password"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Account Information -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">User ID</label>
                            <div class="text-sm text-gray-900 font-mono">${user.id}</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Last Updated</label>
                            <div class="text-sm text-gray-900">
                                ${user.updated_at ? new Date(user.updated_at).toLocaleString() : 'Unknown'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-profile-page', ProfilePage);
export default ProfilePage; 