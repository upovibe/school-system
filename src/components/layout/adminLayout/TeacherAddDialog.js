import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
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
class TeacherAddDialog extends HTMLElement {
    constructor() {
        super();
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
        this.loadClasses();
    }

    setupEventListeners() {
        // Listen for confirm button click (Add Teacher)
        this.addEventListener('confirm', () => {
            this.saveTeacher();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
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

    // Save the new teacher
    async saveTeacher() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const employeeIdInput = this.querySelector('ui-input[data-field="employee_id"]');
            const firstNameInput = this.querySelector('ui-input[data-field="first_name"]');
            const lastNameInput = this.querySelector('ui-input[data-field="last_name"]');
            const emailInput = this.querySelector('ui-input[data-field="email"]');
            const phoneInput = this.querySelector('ui-input[data-field="phone"]');
            const addressInput = this.querySelector('ui-input[data-field="address"]');
            const dateOfBirthInput = this.querySelector('ui-input[data-field="date_of_birth"]');
            const genderDropdown = this.querySelector('ui-search-dropdown[name="gender"]');
            const qualificationInput = this.querySelector('ui-input[data-field="qualification"]');
            const specializationInput = this.querySelector('ui-input[data-field="specialization"]');
            const hireDateInput = this.querySelector('ui-input[data-field="hire_date"]');
            const salaryInput = this.querySelector('ui-input[data-field="salary"]');
            const passwordInput = this.querySelector('ui-input[data-field="password"]');
            const statusSwitch = this.querySelector('ui-switch[name="status"]');
            const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');

            const teacherData = {
                employee_id: employeeIdInput ? employeeIdInput.value : '',
                first_name: firstNameInput ? firstNameInput.value : '',
                last_name: lastNameInput ? lastNameInput.value : '',
                email: emailInput ? emailInput.value : '',
                phone: phoneInput ? phoneInput.value : '',
                address: addressInput ? addressInput.value : '',
                date_of_birth: dateOfBirthInput ? dateOfBirthInput.value : '',
                gender: genderDropdown ? genderDropdown.value : '',
                qualification: qualificationInput ? qualificationInput.value : '',
                specialization: specializationInput ? specializationInput.value : '',
                hire_date: hireDateInput ? hireDateInput.value : '',
                salary: salaryInput ? parseFloat(salaryInput.value) || 0 : 0,
                password: passwordInput ? passwordInput.value : '',
                status: statusSwitch ? (statusSwitch.checked ? 'active' : 'inactive') : 'active',
                class_id: classDropdown ? (classDropdown.value ? parseInt(classDropdown.value) : null) : null
            };

            // Validate required fields
            if (!teacherData.employee_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter employee ID',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.first_name) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter first name',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.last_name) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter last name',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.email) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter email',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.password) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter password',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.hire_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter hire date',
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
                    message: 'Please log in to create teachers',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Send API request
            const response = await api.withToken(token).post('/teachers', teacherData);

            if (response.status === 201 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Teacher created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Construct the new teacher data from response
                const newTeacher = {
                    id: response.data.data.teacher_id,
                    user_id: response.data.data.user_id,
                    employee_id: teacherData.employee_id,
                    first_name: teacherData.first_name,
                    last_name: teacherData.last_name,
                    name: `${teacherData.first_name} ${teacherData.last_name}`,
                    email: teacherData.email,
                    phone: teacherData.phone,
                    address: teacherData.address,
                    date_of_birth: teacherData.date_of_birth,
                    gender: teacherData.gender,
                    qualification: teacherData.qualification,
                    specialization: teacherData.specialization,
                    hire_date: teacherData.hire_date,
                    salary: teacherData.salary,
                    status: teacherData.status,
                    class_id: teacherData.class_id,
                    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-saved', {
                    detail: { teacher: newTeacher },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to create teacher');
            }

        } catch (error) {
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create teacher',
                variant: 'error',
                duration: 3000
            });
        }
    }



    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Add New Teacher">
                <div slot="content">
                    <form id="teacher-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <ui-input 
                                data-field="employee_id"
                                type="text" 
                                placeholder="Enter employee ID"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <ui-input 
                                data-field="address"
                                type="text" 
                                placeholder="Enter address"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <ui-input 
                                    data-field="date_of_birth"
                                    type="date" 
                                    class="w-full">
                                </ui-input>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <ui-search-dropdown 
                                    name="gender" 
                                    placeholder="Select gender"
                                    class="w-full">
                                    <ui-option value="male">Male</ui-option>
                                    <ui-option value="female">Female</ui-option>
                                    <ui-option value="other">Other</ui-option>
                                </ui-search-dropdown>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                            <ui-input 
                                data-field="qualification"
                                type="text" 
                                placeholder="e.g., B.Ed, M.Ed, PhD"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                            <ui-input 
                                data-field="specialization"
                                type="text" 
                                placeholder="e.g., Mathematics, Science, English"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                                <ui-input 
                                    data-field="hire_date"
                                    type="date" 
                                    class="w-full">
                                </ui-input>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Salary (₵)</label>
                                <ui-input 
                                    data-field="salary"
                                    type="number" 
                                    placeholder="Enter salary amount"
                                    step="0.01"
                                    min="0"
                                    class="w-full">
                                </ui-input>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class Teacher (Optional)</label>
                            <ui-search-dropdown 
                                name="class_id" 
                                placeholder="Select class to assign as class teacher"
                                class="w-full">
                                <ui-option value="">No Class Assignment</ui-option>
                                ${this.classes.map(
                                    (classItem) => `<ui-option value="${classItem.id}">${classItem.name}-${classItem.section}</ui-option>`
                                ).join('')}
                            </ui-search-dropdown>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <ui-input 
                                data-field="password"
                                type="password" 
                                placeholder="Enter password"
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

customElements.define('teacher-add-dialog', TeacherAddDialog);
export default TeacherAddDialog; 