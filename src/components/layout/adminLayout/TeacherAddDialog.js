import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Button.js';
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

    // Email validation function
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Phone validation function
    isValidPhone(phone) {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone);
    }

    // Validate required fields and toggle Save button
    validateForm() {
        try {
            const requiredSelectors = [
                'ui-input[data-field="employee_id"]',
                'ui-input[data-field="first_name"]',
                'ui-input[data-field="last_name"]',
                'ui-input[data-field="email"]',
                'ui-input[data-field="phone"]',
                'ui-input[data-field="address"]',
                'ui-input[data-field="date_of_birth"]',
                'ui-input[data-field="hire_date"]',
                'ui-input[data-field="password"]'
            ];
            
            const emailInput = this.querySelector('ui-input[data-field="email"]');
            const phoneInput = this.querySelector('ui-input[data-field="phone"]');
            const genderDropdown = this.querySelector('ui-search-dropdown[name="gender"]');
            const emailError = this.querySelector('#email-error');
            const phoneError = this.querySelector('#phone-error');
            
            const emailValue = emailInput ? String(emailInput.value || '').trim() : '';
            const phoneValue = phoneInput ? String(phoneInput.value || '').trim() : '';
            const genderValue = genderDropdown ? String(genderDropdown.value || '').trim() : '';
            
            const isEmailValid = emailValue === '' || this.isValidEmail(emailValue);
            const isPhoneValid = phoneValue === '' || this.isValidPhone(phoneValue);
            
            // Show/hide email error message
            if (emailError) {
                if (emailValue && !isEmailValid) {
                    emailError.textContent = 'Please enter a valid email address';
                    emailError.classList.remove('hidden');
                } else {
                    emailError.classList.add('hidden');
                }
            }
            
            // Show/hide phone error message
            if (phoneError) {
                if (phoneValue && !isPhoneValid) {
                    phoneError.textContent = 'Phone number must be exactly 10 digits';
                    phoneError.classList.remove('hidden');
                } else {
                    phoneError.classList.add('hidden');
                }
            }
            
            const saveBtn = this.querySelector('#save-teacher-btn');
            
            // Check all required fields including dropdowns
            const allFilled = requiredSelectors.every(sel => {
                const el = this.querySelector(sel);
                if (el) {
                    const val = String(el.value || '').trim();
                    return !!val;
                }
                return false;
            });
            
            // Check gender dropdown separately since it's not a ui-input
            const genderFilled = !!genderValue;
            
            if (saveBtn) {
                if (allFilled && genderFilled && isEmailValid && isPhoneValid) {
                    saveBtn.removeAttribute('disabled');
                } else {
                    saveBtn.setAttribute('disabled', '');
                }
            }
        } catch (_) { /* noop */ }
    }

    // Wire events and initial validation
    addFormEventListeners() {
        const selectors = [
            'ui-input[data-field="employee_id"]',
            'ui-input[data-field="first_name"]',
            'ui-input[data-field="last_name"]',
            'ui-input[data-field="phone"]',
            'ui-input[data-field="address"]',
            'ui-input[data-field="date_of_birth"]',
            'ui-input[data-field="hire_date"]',
            'ui-input[data-field="password"]'
        ];
        selectors.forEach(sel => {
            const el = this.querySelector(sel);
            if (el) {
                el.addEventListener('input', () => this.validateForm());
                el.addEventListener('change', () => this.validateForm());
            }
        });
        
        // Special handling for email field with real-time validation
        const emailInput = this.querySelector('ui-input[data-field="email"]');
        if (emailInput) {
            emailInput.addEventListener('input', () => this.validateForm());
            emailInput.addEventListener('change', () => this.validateForm());
            emailInput.addEventListener('blur', () => this.validateForm());
        }
        
        // Special handling for phone field with real-time validation
        const phoneInput = this.querySelector('ui-input[data-field="phone"]');
        if (phoneInput) {
            phoneInput.addEventListener('input', () => this.validateForm());
            phoneInput.addEventListener('change', () => this.validateForm());
            phoneInput.addEventListener('blur', () => this.validateForm());
        }
        
        // Handle gender dropdown validation
        const genderDropdown = this.querySelector('ui-search-dropdown[name="gender"]');
        if (genderDropdown) {
            genderDropdown.addEventListener('change', () => this.validateForm());
        }
        
        const saveBtn = this.querySelector('#save-teacher-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveTeacher());
        this.validateForm();
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

            // Client-side future date guard
            const todayStr = new Date().toISOString().split('T')[0];
            if (teacherData.hire_date && teacherData.hire_date > todayStr) {
                Toast.show({ title: 'Validation Error', message: 'Hire date cannot be in the future', variant: 'error', duration: 3000 });
                return;
            }
            if (teacherData.date_of_birth && teacherData.date_of_birth > todayStr) {
                Toast.show({ title: 'Validation Error', message: 'Date of birth cannot be in the future', variant: 'error', duration: 3000 });
                return;
            }
            // Minimum age 10 years
            if (teacherData.date_of_birth) {
                const tenYearsAgo = new Date();
                tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
                const tenYearsAgoStr = tenYearsAgo.toISOString().split('T')[0];
                if (teacherData.date_of_birth > tenYearsAgoStr) {
                    Toast.show({ title: 'Validation Error', message: 'Teacher must be at least 10 years old', variant: 'error', duration: 3000 });
                    return;
                }
            }

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

            // Validate email format
            if (!this.isValidEmail(teacherData.email)) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter a valid email address',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate phone number (now required)
            if (!teacherData.phone) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter phone number',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!this.isValidPhone(teacherData.phone)) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Phone number must be exactly 10 digits',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.address) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter Ghana Post address',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.date_of_birth) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter date of birth',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.gender) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select gender',
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
                            <label class="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                            <ui-input 
                                data-field="employee_id"
                                type="text" 
                                placeholder="Enter employee ID"
                                class="w-full">
                            </ui-input>
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
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                <ui-input 
                                    data-field="first_name"
                                    type="text" 
                                    placeholder="Enter first name"
                                    class="w-full">
                                </ui-input>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
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
                                <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <ui-input 
                                    data-field="email"
                                    type="email" 
                                    placeholder="Enter email address"
                                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                                    class="w-full">
                                </ui-input>
                                <div id="email-error" class="hidden text-red-500 text-sm mt-1"></div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <ui-input 
                                    data-field="phone"
                                    type="tel" 
                                    placeholder="Enter phone number (10 digits)"
                                    maxlength="10"
                                    class="w-full">
                                </ui-input>
                                <div id="phone-error" class="hidden text-red-500 text-sm mt-1"></div>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Ghana Post *</label>
                            <ui-input 
                                data-field="address"
                                type="text" 
                                placeholder="Enter address"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                                <ui-input 
                                    data-field="date_of_birth"
                                    type="date" 
                                    max="${new Date().toISOString().split('T')[0]}"
                                    class="w-full">
                                </ui-input>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
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
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Hire Date *</label>
                                <ui-input 
                                    data-field="hire_date"
                                    type="date" 
                                    max="${new Date().toISOString().split('T')[0]}"
                                    class="w-full">
                                </ui-input>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Salary (₵) (optional)</label>
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
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
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
                <div slot="footer" class="flex items-center justify-end gap-2">
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Cancel</ui-button>
                    <ui-button id="save-teacher-btn" color="primary" disabled>Save</ui-button>
                </div>
            </ui-dialog>
        `;
        // Attach validation and save wiring
        this.addFormEventListeners();
    }
}

customElements.define('teacher-add-dialog', TeacherAddDialog);
export default TeacherAddDialog; 