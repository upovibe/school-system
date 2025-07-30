import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class TeacherUpdateDialog extends HTMLElement {
    constructor() {
        super();
        this.teacherData = null;
        this.teams = [];
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
        this.loadTeams();
    }

    setupEventListeners() {
        this.addEventListener('confirm', this.updateTeacher.bind(this));
        this.addEventListener('cancel', this.close.bind(this));
    }



    async loadTeams() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await api.withToken(token).get('/teams');
            if (response.status === 200 && response.data.success) {
                this.teams = response.data.data;
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

    setTeacherData(teacher) {
        this.teacherData = teacher;
        this.render();
        
        // Force update dropdowns after render to ensure values are displayed
        // Use a longer timeout to ensure data is loaded
        setTimeout(() => {
            const teamDropdown = this.querySelector('ui-search-dropdown[name="team_id"]');
            const genderDropdown = this.querySelector('ui-search-dropdown[name="gender"]');
            
            if (teamDropdown && teacher?.team_id) {
                teamDropdown.value = teacher.team_id;
            }
            
            if (genderDropdown && teacher?.gender) {
                genderDropdown.value = teacher.gender;
            }
        }, 200);
    }

    async updateTeacher() {
        if (!this.teacherData) {
            Toast.show({ title: 'Error', message: 'No teacher data available', variant: 'error' });
            return;
        }

        try {
            const teamDropdown = this.querySelector('ui-search-dropdown[name="team_id"]');
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

            const updatedData = {
                team_id: teamDropdown ? teamDropdown.value : '',
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
                status: statusSwitch ? (statusSwitch.hasAttribute('checked') ? 'active' : 'inactive') : 'active'
            };

            // Validate required fields
            if (!updatedData.employee_id) {
                Toast.show({ title: 'Validation Error', message: 'Please enter employee ID', variant: 'error' });
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

            if (!updatedData.hire_date) {
                Toast.show({ title: 'Validation Error', message: 'Please enter hire date', variant: 'error' });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in', variant: 'error' });
                return;
            }

            const response = await api.withToken(token).put(`/teachers/${this.teacherData.id}`, updatedData);

            if (response.status === 200 || response.data.success) {
                Toast.show({ title: 'Success', message: 'Teacher updated successfully', variant: 'success' });

                const updatedTeacher = {
                    ...this.teacherData,
                    ...updatedData,
                    name: `${updatedData.first_name} ${updatedData.last_name}`,
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                this.dispatchEvent(new CustomEvent('teacher-updated', {
                    detail: { teacher: updatedTeacher },
                    bubbles: true,
                    composed: true
                }));
                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to update teacher');
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Update failed', variant: 'error' });
        }
    }

    render() {
        const teacher = this.teacherData;
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Update Teacher">
                <div slot="content">
                    <form id="teacher-update-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Team</label>
                            ${this.teams.length > 0 ? `
                                <ui-search-dropdown 
                                    name="team_id" 
                                    placeholder="Search teams..."
                                    value="${teacher?.team_id || ''}"
                                    class="w-full">
                                    ${this.teams.map(team => `
                                        <ui-option value="${team.id}" ${teacher && teacher.team_id == team.id ? 'selected' : ''}>${team.name} - ${team.position}</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <ui-input 
                                data-field="employee_id"
                                type="text" 
                                placeholder="Enter employee ID"
                                value="${teacher?.employee_id || ''}"
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
                                    value="${teacher?.first_name || ''}"
                                    class="w-full">
                                </ui-input>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <ui-input 
                                    data-field="last_name"
                                    type="text" 
                                    placeholder="Enter last name"
                                    value="${teacher?.last_name || ''}"
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
                                    value="${teacher?.email || ''}"
                                    class="w-full">
                                </ui-input>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <ui-input 
                                    data-field="phone"
                                    type="tel" 
                                    placeholder="Enter phone number"
                                    value="${teacher?.phone || ''}"
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
                                value="${teacher?.address || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <ui-input 
                                    data-field="date_of_birth"
                                    type="date" 
                                    value="${teacher?.date_of_birth || ''}"
                                    class="w-full">
                                </ui-input>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <ui-search-dropdown 
                                    name="gender" 
                                    placeholder="Select gender"
                                    value="${teacher?.gender || ''}"
                                    class="w-full">
                                    <ui-option value="male" ${teacher && teacher.gender === 'male' ? 'selected' : ''}>Male</ui-option>
                                    <ui-option value="female" ${teacher && teacher.gender === 'female' ? 'selected' : ''}>Female</ui-option>
                                    <ui-option value="other" ${teacher && teacher.gender === 'other' ? 'selected' : ''}>Other</ui-option>
                                </ui-search-dropdown>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                            <ui-input 
                                data-field="qualification"
                                type="text" 
                                placeholder="e.g., B.Ed, M.Ed, PhD"
                                value="${teacher?.qualification || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                            <ui-input 
                                data-field="specialization"
                                type="text" 
                                placeholder="e.g., Mathematics, Science, English"
                                value="${teacher?.specialization || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                                <ui-input 
                                    data-field="hire_date"
                                    type="date"
                                    value="${teacher?.hire_date || ''}"
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
                                    value="${teacher?.salary || ''}"
                                    class="w-full">
                                </ui-input>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password (Optional)</label>
                            <ui-input 
                                data-field="password"
                                type="password" 
                                placeholder="Leave blank to keep current password"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-switch 
                                name="status"
                                ${teacher?.status === 'active' ? 'checked' : ''}
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

customElements.define('teacher-update-dialog', TeacherUpdateDialog);
export default TeacherUpdateDialog;
