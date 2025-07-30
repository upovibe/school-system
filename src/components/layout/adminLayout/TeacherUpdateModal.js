import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class TeacherUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.teacherData = null;
        this.users = [];
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
        this.loadUsers();
        this.loadTeams();
    }

    setupEventListeners() {
        this.addEventListener('confirm', this.updateTeacher.bind(this));
        this.addEventListener('cancel', this.close.bind(this));
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await api.withToken(token).get('/users');
            if (response.status === 200) {
                this.users = response.data;
                this.render();
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
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
            console.error('Error loading teams:', error);
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
    }

    async updateTeacher() {
        if (!this.teacherData) {
            Toast.show({ title: 'Error', message: 'No teacher data available', variant: 'error' });
            return;
        }

        try {
            const userDropdown = this.querySelector('ui-dropdown[name="user_id"]');
            const teamDropdown = this.querySelector('ui-dropdown[name="team_id"]');
            const employeeIdInput = this.querySelector('ui-input[data-field="employee_id"]');
            const qualificationInput = this.querySelector('ui-input[data-field="qualification"]');
            const specializationInput = this.querySelector('ui-input[data-field="specialization"]');
            const hireDateInput = this.querySelector('ui-input[data-field="hire_date"]');
            const salaryInput = this.querySelector('ui-input[data-field="salary"]');
            const statusSwitch = this.querySelector('ui-switch[name="status"]');

            const updatedData = {
                team_id: teamDropdown ? teamDropdown.value : '',
                user_id: userDropdown ? userDropdown.value : '',
                employee_id: employeeIdInput ? employeeIdInput.value : '',
                qualification: qualificationInput ? qualificationInput.value : '',
                specialization: specializationInput ? specializationInput.value : '',
                hire_date: hireDateInput ? hireDateInput.value : '',
                salary: salaryInput ? parseFloat(salaryInput.value) || 0 : 0,
                status: statusSwitch ? (statusSwitch.hasAttribute('checked') ? 'active' : 'inactive') : 'active'
            };

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in', variant: 'error' });
                return;
            }

            const response = await api.withToken(token).put(`/teachers/${this.teacherData.id}`, updatedData);

            if (response.status === 200 || response.data.success) {
                Toast.show({ title: 'Success', message: 'Teacher updated successfully', variant: 'success' });

                const selectedUser = this.users.find(user => user.id == updatedData.user_id);
                const updatedTeacher = {
                    ...this.teacherData,
                    ...updatedData,
                    name: selectedUser ? selectedUser.name : this.teacherData.name,
                    email: selectedUser ? selectedUser.email : this.teacherData.email,
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
            console.error('❌ Error updating teacher:', error);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Update failed', variant: 'error' });
        }
    }

    render() {
        const teacher = this.teacherData;
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                close-button="true">
                <div slot="title">Update Teacher</div>
                <form id="teacher-update-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Team</label>
                        <ui-dropdown 
                            name="team_id" 
                            placeholder="Select a team"
                            class="w-full">
                            ${this.teams.map(team => `
                                <ui-option value="${team.id}" ${teacher && teacher.team_id == team.id ? 'selected' : ''}>${team.name} - ${team.position}</ui-option>
                            `).join('')}
                        </ui-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">User</label>
                        <ui-dropdown 
                            name="user_id" 
                            placeholder="Select a user"
                            class="w-full">
                            ${this.users.map(user => `
                                <ui-option value="${user.id}" ${teacher && teacher.user_id == user.id ? 'selected' : ''}>${user.name} (${user.email})</ui-option>
                            `).join('')}
                        </ui-dropdown>
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
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-update-modal', TeacherUpdateModal);
export default TeacherUpdateModal;
