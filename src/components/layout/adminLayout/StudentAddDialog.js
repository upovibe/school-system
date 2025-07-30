import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Student Add Modal Component
 * 
 * A modal component for adding new students in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - student-saved: Fired when a student is successfully created
 * - modal-closed: Fired when modal is closed
 */
class StudentAddDialog extends HTMLElement {
    constructor() {
        super();
        this.users = [];
        this.classes = [];
        this.loading = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && oldValue !== newValue) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadUsers();
        this.loadClasses();
    }

    setupEventListeners() {
        // Listen for confirm button click (Add Student)
        this.addEventListener('confirm', () => {
            this.saveStudent();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/users');
            
            if (response.status === 200) {
                // Show all users, not just students, so they can be assigned as students
                this.users = response.data; // The users array is directly in response.data
                // Re-render to update the dropdown with users
                this.render();
            }
        } catch (error) {
            // Silent error handling
        }
    }

    async loadClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/classes');
            
            if (response.status === 200 && response.data.success) {
                this.classes = response.data.data; // Classes array is in response.data.data
                // Re-render to update the dropdown with classes
                this.render();
            }
        } catch (error) {
            // Silent error handling
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

    // Save the new student
    async saveStudent() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const userDropdown = this.querySelector('ui-search-dropdown[name="user_id"]');
            const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
            const studentIdInput = this.querySelector('ui-input[data-field="student_id"]');
            const firstNameInput = this.querySelector('ui-input[data-field="first_name"]');
            const lastNameInput = this.querySelector('ui-input[data-field="last_name"]');
            const emailInput = this.querySelector('ui-input[data-field="email"]');
            const phoneInput = this.querySelector('ui-input[data-field="phone"]');
            const admissionDateInput = this.querySelector('ui-input[data-field="admission_date"]');
            const statusSwitch = this.querySelector('ui-switch[name="status"]');

            const studentData = {
                class_id: classDropdown ? classDropdown.value : '',
                user_id: userDropdown ? userDropdown.value : '',
                student_id: studentIdInput ? studentIdInput.value : '',
                first_name: firstNameInput ? firstNameInput.value : '',
                last_name: lastNameInput ? lastNameInput.value : '',
                email: emailInput ? emailInput.value : '',
                phone: phoneInput ? phoneInput.value : '',
                admission_date: admissionDateInput ? admissionDateInput.value : '',
                status: statusSwitch ? (statusSwitch.checked ? 'active' : 'inactive') : 'active'
            };

            // Validate required fields
            if (!studentData.class_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a class',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!studentData.user_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a user',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!studentData.student_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter student ID',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!studentData.first_name) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter first name',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!studentData.last_name) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter last name',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!studentData.email) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter email',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!studentData.admission_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter admission date',
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
                    message: 'Please log in to create students',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Send API request
            const response = await api.withToken(token).post('/students', studentData);

            if (response.status === 201 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Student created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Find the selected class to get class name
                const selectedClass = this.classes.find(cls => cls.id == studentData.class_id);

                // Construct the new student data from response
                const newStudent = {
                    id: response.data.data.id,
                    user_id: studentData.user_id,
                    student_id: studentData.student_id,
                    first_name: studentData.first_name,
                    last_name: studentData.last_name,
                    email: studentData.email,
                    phone: studentData.phone,
                    class_name: selectedClass ? selectedClass.name : 'N/A',
                    admission_date: studentData.admission_date,
                    status: studentData.status,
                    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('student-saved', {
                    detail: { student: newStudent },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to create student');
            }

        } catch (error) {
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create student',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Add New Student">
                <div slot="content">
                    <form id="student-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            ${this.classes.length > 0 ? `
                                <ui-search-dropdown 
                                    name="class_id" 
                                    placeholder="Search classes..."
                                    class="w-full">
                                    ${this.classes.map(cls => `
                                        <ui-option value="${cls.id}">${cls.name}</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">User</label>
                            ${this.users.length > 0 ? `
                                <ui-search-dropdown 
                                    name="user_id" 
                                    placeholder="Search users..."
                                    class="w-full">
                                    ${this.users.map(user => `
                                        <ui-option value="${user.id}">${user.name} (${user.email})</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                            <ui-input 
                                data-field="student_id"
                                type="text" 
                                placeholder="Enter student ID"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <ui-input 
                                data-field="first_name"
                                type="text" 
                                placeholder="Enter first name"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <ui-input 
                                data-field="last_name"
                                type="text" 
                                placeholder="Enter last name"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <ui-input 
                                data-field="email"
                                type="email" 
                                placeholder="Enter email address"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <ui-input 
                                data-field="phone"
                                type="tel" 
                                placeholder="Enter phone number"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                            <ui-input 
                                data-field="admission_date"
                                type="date" 
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-switch 
                                name="status"
                                checked
                                class="w-full">
                                <span slot="label">Active</span>
                            </ui-switch>
                        </div>
                    </form>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('student-add-dialog', StudentAddDialog);
export default StudentAddDialog;
