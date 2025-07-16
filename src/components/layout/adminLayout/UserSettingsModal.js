import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';

import '@/components/ui/Switch.js';
import api from '@/services/api.js';

/**
 * User Settings Modal Component
 * 
 * A modal component for adding new users in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - user-saved: Fired when a user is successfully created
 * - modal-closed: Fired when modal is closed
 */
class UserSettingsModal extends HTMLElement {
    constructor() {
        super();
        this.userData = {
            name: '',
            email: '',
            password: '',
            role_id: '',
            status: 'active'
        };
        this.roles = [];
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadRoles();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save)
        this.addEventListener('confirm', () => {
            this.saveUser();
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
        this.userData = {
            name: '',
            email: '',
            password: '',
            role_id: '',
            status: 'active'
        };
        this.render();
    }

    async loadRoles() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/roles');
            this.roles = response.data;
            this.render();
        } catch (error) {
            console.error('❌ Error loading roles:', error);
        }
    }

    async saveUser() {
        try {
            // Get form data using the UI components - query by order since some components might not be fully initialized
            const allInputs = this.querySelectorAll('ui-input');
            const nameInput = allInputs[0]; // First input (name)
            const emailInput = allInputs[1]; // Second input (email)
            const passwordInput = allInputs[2]; // Third input (password)
            
            const roleSelect = this.querySelector('ui-dropdown');
            const statusSwitch = this.querySelector('ui-switch');

            const userData = {
                name: nameInput ? nameInput.value : '',
                email: emailInput ? emailInput.value : '',
                password: passwordInput ? passwordInput.value : '',
                role_id: roleSelect ? roleSelect.value : '',
                status: statusSwitch ? (statusSwitch.checked ? 'active' : 'inactive') : 'active'
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

            if (!userData.password.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Password is required',
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
                    message: 'Please log in to create users',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Save user
            const response = await api.withToken(token).post('/users', userData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'User created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Construct the new user data from response
                const newUser = {
                    id: response.data.data?.id || response.data.id,
                    name: userData.name,
                    email: userData.email,
                    role_id: userData.role_id,
                    role_name: this.roles.find(r => r.id == userData.role_id)?.name || 'N/A',
                    status: userData.status,
                    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('user-saved', {
                    detail: { user: newUser },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to create user');
            }

        } catch (error) {
            console.error('❌ Error saving user:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to create user',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const roleOptions = this.roles.map(role => ({
            value: role.id,
            label: role.name
        }));

        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Add New User</div>
                <form id="user-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <ui-input 
                            type="text" 
                            placeholder="Enter user name"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                        <ui-dropdown 
                            placeholder="Select role"
                            class="w-full">
                            ${roleOptions.map(option => `
                                <ui-option value="${option.value}">${option.label}</ui-option>
                            `).join('')}
                        </ui-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <ui-input 
                            type="email" 
                            placeholder="Enter user email"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <ui-input 
                            type="password" 
                            placeholder="Enter password"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch 
                            checked="true"
                            class="w-full">
                        </ui-switch>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('user-settings-modal', UserSettingsModal);
export default UserSettingsModal; 