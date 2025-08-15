import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Button.js';
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

    // Handle medical conditions change to show/hide "other" input
    handleMedicalConditionsChange(value) {
        const otherInput = this.querySelector('#medical-conditions-other-input');
        if (value === 'Other') {
            otherInput.classList.remove('hidden');
        } else {
            otherInput.classList.add('hidden');
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

    // Validate required fields and toggle Save button
    validateForm() {
        try {
            const requiredSelectors = [
                'ui-input[data-field="student_id"]',
                'ui-input[data-field="first_name"]',
                'ui-input[data-field="last_name"]',
                'ui-input[data-field="email"]',
                'ui-input[data-field="password"]',
                'ui-input[data-field="admission_date"]',
                'ui-input[data-field="parent_name"]',
                'ui-input[data-field="parent_phone"]',
                'ui-input[data-field="parent_email"]'
            ];
            const saveBtn = this.querySelector('#save-student-btn');
            let allFilled = requiredSelectors.every(sel => {
                const el = this.querySelector(sel);
                const val = el ? String(el.value || '').trim() : '';
                return !!val;
            });

            // Medical conditions required; if Other selected, other input must be provided
            const medicalDropdown = this.querySelector('ui-search-dropdown[name="medical_conditions"]');
            const medicalOther = this.querySelector('ui-input[data-field="medical_conditions_other"]');
            const medVal = medicalDropdown ? String(medicalDropdown.value || '').trim() : '';
            const otherOk = medVal !== 'Other' || (medicalOther && String(medicalOther.value || '').trim() !== '');
            allFilled = allFilled && !!medVal && otherOk;

            if (saveBtn) {
                if (allFilled) saveBtn.removeAttribute('disabled');
                else saveBtn.setAttribute('disabled', '');
            }
        } catch (_) { /* noop */ }
    }

    // Wire events and initial validation
    addFormEventListeners() {
        const selectors = [
            'ui-input[data-field="student_id"]',
            'ui-input[data-field="first_name"]',
            'ui-input[data-field="last_name"]',
            'ui-input[data-field="email"]',
            'ui-input[data-field="password"]',
            'ui-input[data-field="admission_date"]',
            'ui-input[data-field="parent_name"]',
            'ui-input[data-field="parent_phone"]',
            'ui-input[data-field="parent_email"]',
            'ui-input[data-field="medical_conditions_other"]'
        ];
        selectors.forEach(sel => {
            const el = this.querySelector(sel);
            if (el) {
                el.addEventListener('input', () => this.validateForm());
                el.addEventListener('change', () => this.validateForm());
            }
        });
        const medicalDropdown = this.querySelector('ui-search-dropdown[name="medical_conditions"]');
        if (medicalDropdown) {
            medicalDropdown.addEventListener('change', () => this.validateForm());
        }
        const saveBtn = this.querySelector('#save-student-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveStudent());
        this.validateForm();
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
            const classDropdown = this.querySelector('ui-search-dropdown[name="current_class_id"]');
            const studentIdInput = this.querySelector('ui-input[data-field="student_id"]');
            const firstNameInput = this.querySelector('ui-input[data-field="first_name"]');
            const lastNameInput = this.querySelector('ui-input[data-field="last_name"]');
            const emailInput = this.querySelector('ui-input[data-field="email"]');
            const phoneInput = this.querySelector('ui-input[data-field="phone"]');
            const addressInput = this.querySelector('ui-input[data-field="address"]');
            const dateOfBirthInput = this.querySelector('ui-input[data-field="date_of_birth"]');
            const genderDropdown = this.querySelector('ui-search-dropdown[name="gender"]');
            const studentTypeDropdown = this.querySelector('ui-search-dropdown[name="student_type"]');
            const admissionDateInput = this.querySelector('ui-input[data-field="admission_date"]');
            const parentNameInput = this.querySelector('ui-input[data-field="parent_name"]');
            const parentPhoneInput = this.querySelector('ui-input[data-field="parent_phone"]');
            const parentEmailInput = this.querySelector('ui-input[data-field="parent_email"]');
            const emergencyContactInput = this.querySelector('ui-input[data-field="emergency_contact"]');
            const emergencyPhoneInput = this.querySelector('ui-input[data-field="emergency_phone"]');
            const bloodGroupDropdown = this.querySelector('ui-search-dropdown[name="blood_group"]');
            const medicalConditionsDropdown = this.querySelector('ui-search-dropdown[name="medical_conditions"]');
            const passwordInput = this.querySelector('ui-input[data-field="password"]');
            const statusSwitch = this.querySelector('ui-switch[name="status"]');

            // Get the "other" input values
            const medicalConditionsOtherInput = this.querySelector('ui-input[data-field="medical_conditions_other"]');

            // Determine the final values (use "other" input if "other" is selected)
            let finalMedicalConditions = medicalConditionsDropdown ? medicalConditionsDropdown.value : '';

            if (finalMedicalConditions === 'Other' && medicalConditionsOtherInput) {
                finalMedicalConditions = medicalConditionsOtherInput.value || 'Other';
            }

            const studentData = {
                current_class_id: classDropdown ? classDropdown.value : '',
                student_id: studentIdInput ? studentIdInput.value : '',
                first_name: firstNameInput ? firstNameInput.value : '',
                last_name: lastNameInput ? lastNameInput.value : '',
                email: emailInput ? emailInput.value : '',
                phone: phoneInput ? phoneInput.value : '',
                address: addressInput ? addressInput.value : '',
                date_of_birth: dateOfBirthInput ? dateOfBirthInput.value : '',
                gender: genderDropdown ? genderDropdown.value : '',
                student_type: studentTypeDropdown ? studentTypeDropdown.value : 'Day',
                admission_date: admissionDateInput ? admissionDateInput.value : '',
                parent_name: parentNameInput ? parentNameInput.value : '',
                parent_phone: parentPhoneInput ? parentPhoneInput.value : '',
                parent_email: parentEmailInput ? parentEmailInput.value : '',
                emergency_contact: emergencyContactInput ? emergencyContactInput.value : '',
                emergency_phone: emergencyPhoneInput ? emergencyPhoneInput.value : '',
                blood_group: bloodGroupDropdown ? bloodGroupDropdown.value : '',
                medical_conditions: finalMedicalConditions,
                password: passwordInput ? passwordInput.value : '',
                status: statusSwitch ? (statusSwitch.checked ? 'active' : 'inactive') : 'active'
            };

            // Client-side DOB guards: not future and at least 3 months old
            const todayStr = new Date().toISOString().split('T')[0];
            if (studentData.date_of_birth && studentData.date_of_birth > todayStr) {
                Toast.show({ title: 'Validation Error', message: 'Date of birth cannot be in the future', variant: 'error', duration: 3000 });
                return;
            }
            if (studentData.date_of_birth) {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
                if (studentData.date_of_birth > threeMonthsAgoStr) {
                    Toast.show({ title: 'Validation Error', message: 'Student must be at least 3 months old', variant: 'error', duration: 3000 });
                    return;
                }
            }

            // Validate required fields
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

            if (!studentData.password) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter password',
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

            // Validate class if provided
            if (studentData.current_class_id) {
                const classExists = this.classes.find(cls => cls.id == studentData.current_class_id);
                if (!classExists) {
                    Toast.show({
                        title: 'Validation Error',
                        message: 'Please select a valid class',
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
                 const selectedClass = this.classes.find(cls => cls.id == studentData.current_class_id);

                 // Construct the new student data from response (include all fields used by Update/View modals)
                 const nowTs = new Date().toISOString().slice(0, 19).replace('T', ' ');
                 const newStudent = {
                     id: response.data.data.student_id,
                     student_id: studentData.student_id,
                     first_name: studentData.first_name,
                     last_name: studentData.last_name,
                     email: studentData.email,
                     phone: studentData.phone,
                     address: studentData.address,
                     date_of_birth: studentData.date_of_birth,
                     gender: studentData.gender,
                     student_type: studentData.student_type || 'Day',
                     current_class_id: studentData.current_class_id,
                     class_name: selectedClass ? `${selectedClass.name}-${selectedClass.section}` : 'N/A',
                     admission_date: studentData.admission_date,
                     parent_name: studentData.parent_name,
                     parent_phone: studentData.parent_phone,
                     parent_email: studentData.parent_email,
                     emergency_contact: studentData.emergency_contact,
                     emergency_phone: studentData.emergency_phone,
                     blood_group: studentData.blood_group,
                     medical_conditions: studentData.medical_conditions,
                     status: studentData.status,
                     created_at: nowTs,
                     updated_at: nowTs
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
                            <label class="block text-sm font-medium text-gray-700 mb-1">Student Type</label>
                            <ui-search-dropdown 
                                name="student_type" 
                                placeholder="Select student type..."
                                class="w-full">
                                <ui-option value="Day">Day</ui-option>
                                <ui-option value="Boarding">Boarding</ui-option>
                            </ui-search-dropdown>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
                            ${this.classes.length > 0 ? `
                                <ui-search-dropdown 
                                    name="current_class_id" 
                                    placeholder="Search classes..."
                                    class="w-full">
                                                                         ${this.classes.map(cls => `
                                         <ui-option value="${cls.id}">${cls.name}-${cls.section}</ui-option>
                                     `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                            <ui-input 
                                data-field="student_id"
                                type="text" 
                                placeholder="Enter student ID"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
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

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
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
                            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <ui-input 
                                data-field="address"
                                type="text" 
                                placeholder="Enter address"
                                class="w-full">
                            </ui-input>
                        </div>

                                                 <div class="grid grid-cols-2 gap-4">
                             <div>
                                 <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                 <ui-input 
                                     data-field="date_of_birth"
                                     type="date" 
                                     max="${new Date().toISOString().split('T')[0]}"
                                     class="w-full">
                                 </ui-input>
                             </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <ui-search-dropdown 
                                    name="gender" 
                                    placeholder="Select gender..."
                                    class="w-full">
                                    <ui-option value="male">Male</ui-option>
                                    <ui-option value="female">Female</ui-option>
                                </ui-search-dropdown>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Admission Date *</label>
                            <ui-input 
                                data-field="admission_date"
                                type="date" 
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

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Parent Name *</label>
                                <ui-input 
                                    data-field="parent_name"
                                    type="text" 
                                    placeholder="Enter parent name"
                                    class="w-full">
                                </ui-input>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Parent Phone *</label>
                                <ui-input 
                                    data-field="parent_phone"
                                    type="tel" 
                                    placeholder="Enter parent phone"
                                    class="w-full">
                                </ui-input>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Parent Email *</label>
                            <ui-input 
                                data-field="parent_email"
                                type="email" 
                                placeholder="Enter parent email"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                                <ui-input 
                                    data-field="emergency_contact"
                                    type="text" 
                                    placeholder="Enter emergency contact"
                                    class="w-full">
                                </ui-input>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                                <ui-input 
                                    data-field="emergency_phone"
                                    type="tel" 
                                    placeholder="Enter emergency phone"
                                    class="w-full">
                                </ui-input>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                                <ui-search-dropdown 
                                    name="blood_group" 
                                    placeholder="Select blood group..."
                                    class="w-full">
                                    <ui-option value="A+">A+</ui-option>
                                    <ui-option value="A-">A-</ui-option>
                                    <ui-option value="B+">B+</ui-option>
                                    <ui-option value="B-">B-</ui-option>
                                    <ui-option value="AB+">AB+</ui-option>
                                    <ui-option value="AB-">AB-</ui-option>
                                    <ui-option value="O+">O+</ui-option>
                                    <ui-option value="O-">O-</ui-option>
                                </ui-search-dropdown>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Medical Conditions *</label>
                                <ui-search-dropdown 
                                    name="medical_conditions" 
                                    placeholder="Select medical conditions..."
                                    class="w-full"
                                    onchange="this.closest('student-add-dialog').handleMedicalConditionsChange(this.value)">
                                    <ui-option value="None">None</ui-option>
                                    <ui-option value="Asthma">Asthma</ui-option>
                                    <ui-option value="Diabetes">Diabetes</ui-option>
                                    <ui-option value="Allergies">Allergies</ui-option>
                                    <ui-option value="Epilepsy">Epilepsy</ui-option>
                                    <ui-option value="Heart Condition">Heart Condition</ui-option>
                                    <ui-option value="Vision Problems">Vision Problems</ui-option>
                                    <ui-option value="Hearing Problems">Hearing Problems</ui-option>
                                    <ui-option value="Other">Other</ui-option>
                                </ui-search-dropdown>
                                <div id="medical-conditions-other-input" class="mt-2 hidden">
                                    <ui-input 
                                        data-field="medical_conditions_other"
                                        type="text" 
                                        placeholder="Please specify medical condition"
                                        class="w-full">
                                    </ui-input>
                                </div>
                            </div>
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
                    <ui-button id="save-student-btn" color="primary" disabled>Save</ui-button>
                </div>
            </ui-dialog>
        `;
        // Attach validation and save wiring
        this.addFormEventListeners();
    }
}

customElements.define('student-add-dialog', StudentAddDialog);
export default StudentAddDialog;
