import '@/components/ui/Modal.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Add Modal Component
 * 
 * A modal component for adding new teachers in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - teacher-saved: Fired when a teacher is successfully created
 * - modal-closed: Fired when modal is closed
 */
class TeacherAddModal extends HTMLElement {
    constructor() {
        super();
        this.users = [];
        this.loading = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadUsers();
    }

    setupEventListeners() {
        // Listen for form submission
        this.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Listen for modal close
        this.addEventListener('modal-closed', () => {
            this.resetForm();
        });
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/users');
            if (response.status === 200 && response.data.success) {
                this.users = response.data.data.filter(user => user.role === 'teacher' || !user.role);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    resetForm() {
        const form = this.querySelector('form');
        if (form) {
            form.reset();
        }
    }

    async handleSubmit() {
        try {
            this.loading = true;
            this.updateSubmitButton();

            const formData = new FormData(this.querySelector('form'));
            const data = {
                user_id: formData.get('user_id'),
                employee_id: formData.get('employee_id'),
                qualification: formData.get('qualification'),
                specialization: formData.get('specialization'),
                hire_date: formData.get('hire_date'),
                salary: parseFloat(formData.get('salary')) || 0,
                status: formData.get('status') === 'on' ? 'active' : 'inactive'
            };

            // Validate required fields
            if (!data.user_id) {
                throw new Error('Please select a user');
            }

            if (!data.employee_id) {
                throw new Error('Employee ID is required');
            }

            if (!data.qualification) {
                throw new Error('Qualification is required');
            }

            if (!data.specialization) {
                throw new Error('Specialization is required');
            }

            if (!data.hire_date) {
                throw new Error('Hire date is required');
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            // Create teacher
            const response = await api.withToken(token).post('/teachers', data);
            
            if (response.status === 201 && response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Teacher created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-saved', {
                    detail: { teacherId: response.data.data.id },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to create teacher');
            }

        } catch (error) {
            console.error('❌ Error creating teacher:', error);
            
            Toast.show({
                title: 'Error',
                message: error.message || 'Failed to create teacher',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.loading = false;
            this.updateSubmitButton();
        }
    }

    updateSubmitButton() {
        const submitButton = this.querySelector('button[type="submit"]');
        if (submitButton) {
            if (this.loading) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
            } else {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Create Teacher';
            }
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal ${this.hasAttribute('open') ? 'open' : ''} size="lg">
                <div slot="title">Add New Teacher</div>
                <div slot="content">
                    <form class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="user_id" class="block text-sm font-medium text-gray-700 mb-1">
                                    User <span class="text-red-500">*</span>
                                </label>
                                <ui-dropdown 
                                    name="user_id" 
                                    id="user_id" 
                                    placeholder="Select a user">
                                    ${this.users.map(user => `
                                        <ui-option value="${user.id}">${user.name} (${user.email})</ui-option>
                                    `).join('')}
                                </ui-dropdown>
                            </div>

                            <div>
                                <label for="employee_id" class="block text-sm font-medium text-gray-700 mb-1">
                                    Employee ID <span class="text-red-500">*</span>
                                </label>
                                <ui-input 
                                    type="text" 
                                    name="employee_id" 
                                    id="employee_id" 
                                    placeholder="Enter employee ID"
                                    required>
                                </ui-input>
                            </div>

                            <div>
                                <label for="qualification" class="block text-sm font-medium text-gray-700 mb-1">
                                    Qualification <span class="text-red-500">*</span>
                                </label>
                                <ui-input 
                                    type="text" 
                                    name="qualification" 
                                    id="qualification" 
                                    placeholder="e.g., B.Ed, M.Ed, PhD"
                                    required>
                                </ui-input>
                            </div>

                            <div>
                                <label for="specialization" class="block text-sm font-medium text-gray-700 mb-1">
                                    Specialization <span class="text-red-500">*</span>
                                </label>
                                <ui-input 
                                    type="text" 
                                    name="specialization" 
                                    id="specialization" 
                                    placeholder="e.g., Mathematics, Science, English"
                                    required>
                                </ui-input>
                            </div>

                            <div>
                                <label for="hire_date" class="block text-sm font-medium text-gray-700 mb-1">
                                    Hire Date <span class="text-red-500">*</span>
                                </label>
                                <ui-input 
                                    type="date" 
                                    name="hire_date" 
                                    id="hire_date" 
                                    required>
                                </ui-input>
                            </div>

                            <div>
                                <label for="salary" class="block text-sm font-medium text-gray-700 mb-1">
                                    Salary (₵)
                                </label>
                                <ui-input 
                                    type="number" 
                                    name="salary" 
                                    id="salary" 
                                    placeholder="Enter salary amount"
                                    step="0.01"
                                    min="0">
                                </ui-input>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3">
                            <ui-switch name="status" id="status" checked></ui-switch>
                            <label for="status" class="text-sm font-medium text-gray-700">
                                Active Status
                            </label>
                        </div>
                    </form>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('teacher-add-modal', TeacherAddModal);
export default TeacherAddModal; 