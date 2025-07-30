import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class StudentUpdateDialog extends HTMLElement {
    constructor() {
        super();
        this.studentData = null;
        this.classes = [];
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
        this.addEventListener('confirm', this.updateStudent.bind(this));
        this.addEventListener('cancel', this.close.bind(this));
    }

    async loadClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/classes');
            
            if (response.status === 200 && response.data.success) {
                this.classes = response.data.data;
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

    setStudentData(student) {
        this.studentData = student;
        this.render();
        
        // Force update dropdowns after render to ensure values are displayed
        setTimeout(() => {
            const classDropdown = this.querySelector('ui-search-dropdown[name="current_class_id"]');
            const genderDropdown = this.querySelector('ui-search-dropdown[name="gender"]');
            const bloodGroupDropdown = this.querySelector('ui-search-dropdown[name="blood_group"]');
            const medicalConditionsDropdown = this.querySelector('ui-search-dropdown[name="medical_conditions"]');
            
            if (classDropdown && student?.current_class_id) {
                classDropdown.value = student.current_class_id;
            }
            
            if (genderDropdown && student?.gender) {
                genderDropdown.value = student.gender;
            }
            
            if (bloodGroupDropdown && student?.blood_group) {
                bloodGroupDropdown.value = student.blood_group;
            }
            
            if (medicalConditionsDropdown && student?.medical_conditions) {
                medicalConditionsDropdown.value = student.medical_conditions;
            }
        }, 200);
    }

    async updateStudent() {
        if (!this.studentData) {
            Toast.show({ title: 'Error', message: 'No student data available', variant: 'error' });
            return;
        }

        try {
            const classDropdown = this.querySelector('ui-search-dropdown[name="current_class_id"]');
            const studentIdInput = this.querySelector('ui-input[data-field="student_id"]');
            const firstNameInput = this.querySelector('ui-input[data-field="first_name"]');
            const lastNameInput = this.querySelector('ui-input[data-field="last_name"]');
            const emailInput = this.querySelector('ui-input[data-field="email"]');
            const phoneInput = this.querySelector('ui-input[data-field="phone"]');
            const addressInput = this.querySelector('ui-input[data-field="address"]');
            const dateOfBirthInput = this.querySelector('ui-input[data-field="date_of_birth"]');
            const genderDropdown = this.querySelector('ui-search-dropdown[name="gender"]');
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

            const updatedData = {
                current_class_id: classDropdown ? classDropdown.value : '',
                student_id: studentIdInput ? studentIdInput.value : '',
                first_name: firstNameInput ? firstNameInput.value : '',
                last_name: lastNameInput ? lastNameInput.value : '',
                email: emailInput ? emailInput.value : '',
                phone: phoneInput ? phoneInput.value : '',
                address: addressInput ? addressInput.value : '',
                date_of_birth: dateOfBirthInput ? dateOfBirthInput.value : '',
                gender: genderDropdown ? genderDropdown.value : '',
                admission_date: admissionDateInput ? admissionDateInput.value : '',
                parent_name: parentNameInput ? parentNameInput.value : '',
                parent_phone: parentPhoneInput ? parentPhoneInput.value : '',
                parent_email: parentEmailInput ? parentEmailInput.value : '',
                emergency_contact: emergencyContactInput ? emergencyContactInput.value : '',
                emergency_phone: emergencyPhoneInput ? emergencyPhoneInput.value : '',
                blood_group: bloodGroupDropdown ? bloodGroupDropdown.value : '',
                medical_conditions: medicalConditionsDropdown ? medicalConditionsDropdown.value : '',
                status: statusSwitch ? (statusSwitch.hasAttribute('checked') ? 'active' : 'inactive') : 'active'
            };

            // Add password only if provided
            if (passwordInput && passwordInput.value) {
                updatedData.password = passwordInput.value;
            }

            // Validate required fields
            if (!updatedData.student_id) {
                Toast.show({ title: 'Validation Error', message: 'Please enter student ID', variant: 'error' });
                return;
            }

            if (!updatedData.first_name) {
                Toast.show({ title: 'Validation Error', message: 'Please enter first name', variant: 'error' });
                return;
            }

            if (!updatedData.last_name) {
                Toast.show({ title: 'Validation Error', message: 'Please enter last name', variant: 'error' });
                return;
            }

            if (!updatedData.email) {
                Toast.show({ title: 'Validation Error', message: 'Please enter email', variant: 'error' });
                return;
            }

            if (!updatedData.admission_date) {
                Toast.show({ title: 'Validation Error', message: 'Please enter admission date', variant: 'error' });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in', variant: 'error' });
                return;
            }

            const response = await api.withToken(token).put(`/students/${this.studentData.id}`, updatedData);

            if (response.status === 200 || response.data.success) {
                Toast.show({ title: 'Success', message: 'Student updated successfully', variant: 'success' });

                // Find the selected class to get class name
                const selectedClass = this.classes.find(cls => cls.id == updatedData.current_class_id);

                const updatedStudent = {
                    ...this.studentData,
                    ...updatedData,
                    class_name: selectedClass ? `${selectedClass.name}-${selectedClass.section}` : 'N/A',
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                this.dispatchEvent(new CustomEvent('student-updated', {
                    detail: { student: updatedStudent },
                    bubbles: true,
                    composed: true
                }));
                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to update student');
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Update failed', variant: 'error' });
        }
    }

    render() {
        const student = this.studentData;
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Update Student">
                <div slot="content">
                    <form id="student-update-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
                            ${this.classes.length > 0 ? `
                                <ui-search-dropdown 
                                    name="current_class_id" 
                                    placeholder="Search classes..."
                                    value="${student?.current_class_id || ''}"
                                    class="w-full">
                                    ${this.classes.map(cls => `
                                        <ui-option value="${cls.id}" ${student && student.current_class_id == cls.id ? 'selected' : ''}>${cls.name}-${cls.section}</ui-option>
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
                                value="${student?.student_id || ''}"
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
                                    value="${student?.first_name || ''}"
                                    class="w-full">
                                </ui-input>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                <ui-input 
                                    data-field="last_name"
                                    type="text" 
                                    placeholder="Enter last name"
                                    value="${student?.last_name || ''}"
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
                                value="${student?.email || ''}"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <ui-input 
                                data-field="phone"
                                type="tel" 
                                placeholder="Enter phone number"
                                value="${student?.phone || ''}"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <ui-input 
                                data-field="address"
                                type="text" 
                                placeholder="Enter address"
                                value="${student?.address || ''}"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <ui-input 
                                    data-field="date_of_birth"
                                    type="date" 
                                    value="${student?.date_of_birth || ''}"
                                    class="w-full">
                                </ui-input>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <ui-search-dropdown 
                                    name="gender" 
                                    placeholder="Select gender..."
                                    value="${student?.gender || ''}"
                                    class="w-full">
                                    <ui-option value="male" ${student && student.gender === 'male' ? 'selected' : ''}>Male</ui-option>
                                    <ui-option value="female" ${student && student.gender === 'female' ? 'selected' : ''}>Female</ui-option>
                                    <ui-option value="other" ${student && student.gender === 'other' ? 'selected' : ''}>Other</ui-option>
                                </ui-search-dropdown>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Admission Date *</label>
                            <ui-input 
                                data-field="admission_date"
                                type="date" 
                                value="${student?.admission_date || ''}"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password (Leave blank to keep current)</label>
                            <ui-input 
                                data-field="password"
                                type="password" 
                                placeholder="Enter new password (optional)"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                                <ui-input 
                                    data-field="parent_name"
                                    type="text" 
                                    placeholder="Enter parent name"
                                    value="${student?.parent_name || ''}"
                                    class="w-full">
                                </ui-input>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                                <ui-input 
                                    data-field="parent_phone"
                                    type="tel" 
                                    placeholder="Enter parent phone"
                                    value="${student?.parent_phone || ''}"
                                    class="w-full">
                                </ui-input>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                            <ui-input 
                                data-field="parent_email"
                                type="email" 
                                placeholder="Enter parent email"
                                value="${student?.parent_email || ''}"
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
                                    value="${student?.emergency_contact || ''}"
                                    class="w-full">
                                </ui-input>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                                <ui-input 
                                    data-field="emergency_phone"
                                    type="tel" 
                                    placeholder="Enter emergency phone"
                                    value="${student?.emergency_phone || ''}"
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
                                    value="${student?.blood_group || ''}"
                                    class="w-full">
                                    <ui-option value="A+" ${student && student.blood_group === 'A+' ? 'selected' : ''}>A+</ui-option>
                                    <ui-option value="A-" ${student && student.blood_group === 'A-' ? 'selected' : ''}>A-</ui-option>
                                    <ui-option value="B+" ${student && student.blood_group === 'B+' ? 'selected' : ''}>B+</ui-option>
                                    <ui-option value="B-" ${student && student.blood_group === 'B-' ? 'selected' : ''}>B-</ui-option>
                                    <ui-option value="AB+" ${student && student.blood_group === 'AB+' ? 'selected' : ''}>AB+</ui-option>
                                    <ui-option value="AB-" ${student && student.blood_group === 'AB-' ? 'selected' : ''}>AB-</ui-option>
                                    <ui-option value="O+" ${student && student.blood_group === 'O+' ? 'selected' : ''}>O+</ui-option>
                                    <ui-option value="O-" ${student && student.blood_group === 'O-' ? 'selected' : ''}>O-</ui-option>
                                </ui-search-dropdown>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                                <ui-search-dropdown 
                                    name="medical_conditions" 
                                    placeholder="Select medical conditions..."
                                    value="${student?.medical_conditions || ''}"
                                    class="w-full">
                                    <ui-option value="None" ${student && student.medical_conditions === 'None' ? 'selected' : ''}>None</ui-option>
                                    <ui-option value="Asthma" ${student && student.medical_conditions === 'Asthma' ? 'selected' : ''}>Asthma</ui-option>
                                    <ui-option value="Diabetes" ${student && student.medical_conditions === 'Diabetes' ? 'selected' : ''}>Diabetes</ui-option>
                                    <ui-option value="Allergies" ${student && student.medical_conditions === 'Allergies' ? 'selected' : ''}>Allergies</ui-option>
                                    <ui-option value="Epilepsy" ${student && student.medical_conditions === 'Epilepsy' ? 'selected' : ''}>Epilepsy</ui-option>
                                    <ui-option value="Heart Condition" ${student && student.medical_conditions === 'Heart Condition' ? 'selected' : ''}>Heart Condition</ui-option>
                                    <ui-option value="Vision Problems" ${student && student.medical_conditions === 'Vision Problems' ? 'selected' : ''}>Vision Problems</ui-option>
                                    <ui-option value="Hearing Problems" ${student && student.medical_conditions === 'Hearing Problems' ? 'selected' : ''}>Hearing Problems</ui-option>
                                    <ui-option value="Other" ${student && student.medical_conditions === 'Other' ? 'selected' : ''}>Other</ui-option>
                                </ui-search-dropdown>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-switch 
                                name="status"
                                ${student?.status === 'active' ? 'checked' : ''}
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

customElements.define('student-update-dialog', StudentUpdateDialog);
export default StudentUpdateDialog; 