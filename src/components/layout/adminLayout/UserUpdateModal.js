import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import api from '@/services/api.js';

/**
 * User Update Modal Component
 * 
 * A modal component for editing existing users in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - user-updated: Fired when a user is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class UserUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.userData = null;
        this.originalData = null;
        this.roles = [];
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null && oldValue === null) {
            // Modal is being opened
            this.loadRoles();
        }
    }

    setupEventListeners() {
        // Listen for confirm button click (Update)
        this.addEventListener('confirm', () => {
            this.updateUser();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    close() {
        this.removeAttribute('open');
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.userData = null;
        this.originalData = null;
        this.render();
    }

    // Set user data for editing
    setUserData(userData) {
        this.originalData = { ...userData };
        this.userData = {
            id: userData.id,
            name: userData.name || '',
            email: userData.email || '',
            role_id: userData.role_id || '',
            status: userData.status || 'active'
        };
        this.render();
    }

    async loadRoles() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/roles');
            if (response.data.success) {
                this.roles = response.data.data;
                this.render();
            }
        } catch (error) {
            console.error('❌ Error loading roles:', error);
        }
    }

    async updateUser() {
        try {
            // Wait a bit for custom elements to be fully initialized
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Get values from custom UI components directly
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const emailInput = this.querySelector('ui-input[data-field="email"]');
            const roleSelect = this.querySelector('ui-dropdown[data-field="role_id"]');
            const statusSelect = this.querySelector('ui-dropdown[data-field="status"]');
            
            const userData = {
                name: nameInput ? nameInput.value : '',
                email: emailInput ? emailInput.value : '',
                role_id: roleSelect ? roleSelect.value : '',
                status: statusSelect ? statusSelect.value : 'active'
            };

            // Validate required fields
            if (!userData.name.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Name is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!userData.email.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Email is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!userData.role_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Role is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update users',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Update user
            const response = await api.withToken(token).put(`/users/${this.userData.id}`, userData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'User updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the updated user data
                this.dispatchEvent(new CustomEvent('user-updated', {
                    detail: { user: response.data.data },
                    bubbles: true,
                    composed: true
                }));

                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to update user');
            }

        } catch (error) {
            console.error('❌ Error updating user:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to update user',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        if (!this.userData) {
            this.innerHTML = `
                <ui-modal 
                    title="Edit User"
                    size="md"
                    ${this.hasAttribute('open') ? 'open' : ''}>
                    
                    <div class="text-center py-8 text-gray-500">
                        <p>No user data available</p>
                    </div>
                </ui-modal>
            `;
            return;
        }

        const roleOptions = this.roles.map(role => ({
            value: role.id,
            label: role.name
        }));

        this.innerHTML = `
            <ui-modal 
                title="Edit User"
                size="md"
                ${this.hasAttribute('open') ? 'open' : ''}>
                
                <form class="space-y-6">
                    <!-- Role -->
                    <div>
                        <label for="role_id" class="block text-sm font-medium text-gray-700 mb-2">
                            Role *
                        </label>
                        <ui-dropdown 
                            data-field="role_id"
                            placeholder="Select role"
                            value="${this.userData.role_id}"
                            class="w-full">
                            ${roleOptions.map(option => `
                                <ui-option value="${option.value}">${option.label}</ui-option>
                            `).join('')}
                        </ui-dropdown>
                    </div>

                    <!-- Name -->
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                            Name *
                        </label>
                        <ui-input 
                            data-field="name"
                            type="text" 
                            placeholder="Enter user name"
                            value="${this.userData.name}"
                            required
                            class="w-full">
                        </ui-input>
                    </div>

                    <!-- Email -->
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <ui-input 
                            data-field="email"
                            type="email" 
                            placeholder="Enter user email"
                            value="${this.userData.email}"
                            required
                            class="w-full">
                        </ui-input>
                    </div>

                    <!-- Status -->
                    <div>
                        <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                            Account Status *
                        </label>
                        <ui-dropdown 
                            data-field="status"
                            placeholder="Select status"
                            value="${this.userData.status}"
                            class="w-full">
                            <ui-option value="active">Active</ui-option>
                            <ui-option value="inactive">Inactive</ui-option>
                        </ui-dropdown>
                    </div>
                </form>
                
                <!-- Information Notice -->
                <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <i class="fas fa-info-circle text-green-400 text-lg"></i>
                        </div>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-green-800 mb-2">Update Information</h4>
                            <ul class="text-sm text-green-700 space-y-1">
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-500 text-xs mt-1 mr-2"></i>
                                    User's login credentials will remain unchanged
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-500 text-xs mt-1 mr-2"></i>
                                    Name, email, role, and account status will be updated
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-500 text-xs mt-1 mr-2"></i>
                                    User will continue to use their existing password
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-user-check text-green-500 text-xs mt-1 mr-2"></i>
                                    <strong>Active users can log in, inactive users cannot</strong>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-envelope text-green-500 text-xs mt-1 mr-2"></i>Email notification will be sent to the user about any changes made
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-shield-alt text-green-500 text-xs mt-1 mr-2"></i>
                                    User will be notified of specific changes for security awareness
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('user-update-modal', UserUpdateModal);
export default UserUpdateModal; 