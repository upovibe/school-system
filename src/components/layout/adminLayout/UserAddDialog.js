import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * User Add Dialog Component
 * 
 * A dialog component for adding new users in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - user-saved: Fired when a user is successfully created
 * - dialog-closed: Fired when dialog is closed
 */
class UserAddDialog extends HTMLElement {
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
            // Dialog is being opened
            this.loadRoles();
        }
    }

    setupEventListeners() {
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
            role_id: ''
        };
        this.render();
    }

    async loadRoles() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/roles');
            // Handle both response formats (direct array or wrapped in data) and filter out disallowed roles
            const roles = response.data.data || response.data || [];
            this.roles = (roles || []).filter((role) => {
                const name = String(role?.name || '').trim().toLowerCase();
                return name !== 'teacher' && name !== 'student';
            });
            this.render();
        } catch (error) {
            console.error('❌ Error loading roles:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load roles',
                variant: 'error',
                duration: 3000
            });
        }
    }

    async saveUser() {
        try {
            // Get form data using the UI components with unique IDs
            const nameInput = this.querySelector('#user-name-input');
            const emailInput = this.querySelector('#user-email-input');
            const roleDropdown = this.querySelector('#user-role-dropdown');
            const passwordInput = this.querySelector('#user-password-input');
            
            const userData = {
                name: nameInput ? nameInput.value : '',
                email: emailInput ? emailInput.value : '',
                role_id: roleDropdown ? roleDropdown.value : '',
                password: passwordInput ? passwordInput.value : ''
            };

            // Validate required fields
            if (!userData.name?.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Name is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!userData.email?.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Email is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate email format
            if (!this.isValidEmail(userData.email)) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter a valid email address',
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

            // Extra guard: prevent selecting filtered roles if present
            const selectedRole = (this.roles || []).find(r => String(r.id) === String(userData.role_id));
            const roleName = String(selectedRole?.name || '').trim().toLowerCase();
            if (roleName === 'teacher' || roleName === 'student') {
                Toast.show({
                    title: 'Validation Error',
                    message: 'You cannot assign Teacher or Student roles here',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate password if provided
            if (userData.password && userData.password.trim().length > 0) {
                if (userData.password.trim().length < 8) {
                    Toast.show({
                        title: 'Validation Error',
                        message: 'Password must be at least 8 characters long',
                        variant: 'error',
                        duration: 3000
                    });
                    return;
                }
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

                // Show toast first
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
                    role: this.roles.find(r => r.id == userData.role_id)?.name || 'N/A',
                    status: 'active',
                    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close dialog and dispatch event
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

    // Validate required fields and toggle Save button
    validateForm() {
        try {
            const nameInput = this.querySelector('#user-name-input');
            const emailInput = this.querySelector('#user-email-input');
            const roleDropdown = this.querySelector('#user-role-dropdown');
            const passwordInput = this.querySelector('#user-password-input');
            const saveBtn = this.querySelector('#save-user-btn');
            const emailVal = String(emailInput?.value || '').trim();
            const passwordVal = String(passwordInput?.value || '').trim();
            
            // Check if password is valid (either empty or at least 8 characters)
            const passwordValid = !passwordVal || passwordVal.length >= 8;
            
            const allFilled = !!String(nameInput?.value || '').trim() &&
                !!emailVal && this.isValidEmail(emailVal) &&
                !!String(roleDropdown?.value || '').trim() &&
                passwordValid;
            if (saveBtn) {
                if (allFilled) saveBtn.removeAttribute('disabled');
                else saveBtn.setAttribute('disabled', '');
            }
        } catch (_) { /* noop */ }
    }

    // Wire events and initial validation
    addFormEventListeners() {
        const nameInput = this.querySelector('#user-name-input');
        const emailInput = this.querySelector('#user-email-input');
        const roleDropdown = this.querySelector('#user-role-dropdown');
        const passwordInput = this.querySelector('#user-password-input');
        const saveBtn = this.querySelector('#save-user-btn');
        if (nameInput) {
            nameInput.addEventListener('input', () => this.validateForm());
            nameInput.addEventListener('change', () => this.validateForm());
        }
        if (emailInput) {
            emailInput.addEventListener('input', () => this.validateForm());
            emailInput.addEventListener('change', () => this.validateForm());
        }
        if (roleDropdown) {
            roleDropdown.addEventListener('change', () => this.validateForm());
        }
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.validateForm());
            passwordInput.addEventListener('change', () => this.validateForm());
        }
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveUser());
        this.validateForm();
    }

    // Simple email format validator
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        return re.test(String(email).toLowerCase());
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Add New User"
                position="center">
                <div slot="content">
                    <form id="user-add-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                            <ui-dropdown 
                                id="user-role-dropdown"
                                name="role_id"
                                placeholder="Select role"
                                required>
                                ${(this.roles || []).map(role => `
                                    <ui-option value="${role.id}">${role.name}</ui-option>
                                `).join('')}
                            </ui-dropdown>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                            <ui-input 
                                id="user-name-input"
                                type="text" 
                                name="name"
                                placeholder="Enter user name"
                                required>
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <ui-input 
                                id="user-email-input"
                                type="email" 
                                name="email"
                                placeholder="Enter user email"
                                required>
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                            <ui-input 
                                id="user-password-input"
                                type="password" 
                                name="password"
                                placeholder="Enter password"
                                minlength="8">
                            </ui-input>
                            <p class="text-xs text-gray-500 mt-1">
                               Enter a custom password (min 8 characters)
                            </p>
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
                                        If no password is provided, a secure password will be auto-generated
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
                </div>
                <div slot="footer" class="flex items-center justify-end gap-2">
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Cancel</ui-button>
                    <ui-button id="save-user-btn" color="primary" disabled>Save</ui-button>
                </div>
            </ui-dialog>
        `;
        // Attach validation and save wiring
        this.addFormEventListeners();
    }
}

customElements.define('user-add-dialog', UserAddDialog);
export default UserAddDialog; 