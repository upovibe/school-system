import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
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
            role_id: ''
        };
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
        // Listen for confirm button click (Save)
        this.addEventListener('confirm', () => {
            this.saveUser();
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
        this.userData = {
            name: '',
            email: '',
            role_id: ''
        };
        this.render();
    }

    async loadRoles() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/roles');
            this.roles = response.data.data || [];
            this.render();
        } catch (error) {
            console.error('❌ Error loading roles:', error);
        }
    }

    async saveUser() {
        try {
            // Get form data using the UI components
            const allInputs = this.querySelectorAll('ui-input');
            const nameInput = allInputs[0]; // First input (name)
            const emailInput = allInputs[1]; // Second input (email)
            
            const roleSelect = this.querySelector('ui-dropdown[data-field="role_id"]');

            const userData = {
                name: nameInput ? nameInput.value : '',
                email: emailInput ? emailInput.value : '',
                role_id: roleSelect ? roleSelect.value : ''
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
                    message: 'Please log in to create users',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Save user
            const response = await api.withToken(token).post('/users', userData);
            
            // Check if user was created successfully (API returns 201 status and has id)
            if (response.status === 201 || response.data.id) {
                // Show appropriate message based on email status
                const message = response.data.email_sent 
                    ? 'User created successfully. Password will be sent via email.'
                    : 'User created successfully. Email could not be sent. Please check email configuration.';
                
                const toastVariant = response.data.email_sent ? 'success' : 'warning';
                
                Toast.show({
                    title: response.data.email_sent ? 'Success' : 'Warning',
                    message: message,
                    variant: toastVariant,
                    duration: 5000
                });

                // Construct the new user data from response
                const newUser = {
                    id: response.data.id,
                    name: userData.name,
                    email: userData.email,
                    role_id: userData.role_id,
                    role_name: this.roles.find(r => r.id == userData.role_id)?.name || 'N/A',
                    status: 'active',
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
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Add New User</div>
                <form id="user-form" class="space-y-4">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                        <ui-dropdown 
                            data-field="role_id"
                            placeholder="Select role"
                            class="w-full">
                            ${(this.roles || []).map(role => `
                                <ui-option value="${role.id}">${role.name}</ui-option>
                            `).join('')}
                        </ui-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <ui-input 
                            type="text" 
                            placeholder="Enter user name"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <ui-input 
                            type="email" 
                            placeholder="Enter user email"
                            class="w-full">
                        </ui-input>
                    </div>
                </form>
                
                <!-- Information Notice -->
                <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <i class="fas fa-info-circle text-blue-400 text-lg"></i>
                        </div>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-blue-800 mb-2">What happens next?</h4>
                            <ul class="text-sm text-blue-700 space-y-1">
                                <li class="flex items-start">
                                    <i class="fas fa-check text-blue-500 text-xs mt-1 mr-2"></i>
                                    A secure password will be auto-generated and sent to the user's email
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-blue-500 text-xs mt-1 mr-2"></i>
                                    The user will receive a welcome email with login credentials
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-blue-500 text-xs mt-1 mr-2"></i>
                                    User must change their password on first login within 24 hours
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-blue-500 text-xs mt-1 mr-2"></i>
                                    Account will be active immediately after creation
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('user-settings-modal', UserSettingsModal);
export default UserSettingsModal; 