import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import api from '@/services/api.js';

/**
 * User Role Settings Modal Component
 * 
 * A modal component for adding new user roles in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - user-role-saved: Fired when a user role is successfully created
 * - modal-closed: Fired when modal is closed
 */
class UserRoleSettingsModal extends HTMLElement {
    constructor() {
        super();
        this.roleData = {
            name: '',
            description: ''
        };
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save)
        this.addEventListener('confirm', () => {
            this.saveRole();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.roleData = {
            name: '',
            description: ''
        };
        this.render();
    }

    async saveRole() {
        try {
            // Get form data
            const form = this.querySelector('form');
            if (!form) {
                throw new Error('Form not found');
            }

            const formData = new FormData(form);
            const roleData = {
                name: formData.get('name') || '',
                description: formData.get('description') || ''
            };

            // Validate required fields
            if (!roleData.name.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Role name is required',
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
                    message: 'Please log in to create user roles',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Save role
            const response = await api.withToken(token).post('/roles', roleData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'User role created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the new role data
                this.dispatchEvent(new CustomEvent('user-role-saved', {
                    detail: { userRole: response.data.data }
                }));

                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to create user role');
            }

        } catch (error) {
            console.error('❌ Error saving user role:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to create user role',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        return `
            <ui-modal 
                title="Add New User Role"
                size="md"
                ${this.hasAttribute('open') ? 'open' : ''}>
                
                <form class="space-y-6">
                    <!-- Role Name -->
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                            Role Name *
                        </label>
                        <ui-input 
                            id="name"
                            name="name"
                            type="text" 
                            placeholder="Enter role name"
                            value="${this.roleData.name}"
                            required
                            class="w-full">
                        </ui-input>
                    </div>

                    <!-- Description -->
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <ui-textarea 
                            id="description"
                            name="description"
                            placeholder="Enter role description"
                            rows="3"
                            value="${this.roleData.description}"
                            class="w-full">
                        </ui-textarea>
                    </div>
                </form>

                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button 
                        variant="secondary"
                        onclick="this.closest('user-role-settings-modal').close()">
                        Cancel
                    </ui-button>
                    <ui-button 
                        variant="primary"
                        onclick="this.closest('user-role-settings-modal').saveRole()">
                        Save Role
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('user-role-settings-modal', UserRoleSettingsModal);
export default UserRoleSettingsModal; 