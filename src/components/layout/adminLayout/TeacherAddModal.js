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
        this.teams = [];
        this.loading = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadUsers();
        this.loadTeams();
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

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found for loading users');
                return;
            }

            console.log('Loading users...');
            const response = await api.withToken(token).get('/users');
            console.log('Users API response:', response);
            
            if (response.status === 200) {
                // Show all users, not just teachers, so they can be assigned as teachers
                this.users = response.data; // The users array is directly in response.data
                console.log('Loaded users:', this.users);
                // Re-render to update the dropdown with users
                this.render();
            } else {
                console.error('Failed to load users:', response);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadTeams() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found for loading teams');
                return;
            }

            console.log('Loading teams...');
            const response = await api.withToken(token).get('/teams');
            console.log('Teams API response:', response);
            
            if (response.status === 200 && response.data.success) {
                this.teams = response.data.data; // Teams array is in response.data.data
                console.log('Loaded teams:', this.teams);
                // Re-render to update the dropdown with teams
                this.render();
            } else {
                console.error('Failed to load teams:', response);
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
            const userDropdown = this.querySelector('ui-dropdown[name="user_id"]');
            const teamDropdown = this.querySelector('ui-dropdown[name="team_id"]');
            const employeeIdInput = this.querySelector('ui-input[data-field="employee_id"]');
            const qualificationInput = this.querySelector('ui-input[data-field="qualification"]');
            const specializationInput = this.querySelector('ui-input[data-field="specialization"]');
            const hireDateInput = this.querySelector('ui-input[data-field="hire_date"]');
            const salaryInput = this.querySelector('ui-input[data-field="salary"]');
            const statusSwitch = this.querySelector('ui-switch[name="status"]');

            const teacherData = {
                team_id: teamDropdown ? teamDropdown.value : '',
                user_id: userDropdown ? userDropdown.value : '',
                employee_id: employeeIdInput ? employeeIdInput.value : '',
                qualification: qualificationInput ? qualificationInput.value : '',
                specialization: specializationInput ? specializationInput.value : '',
                hire_date: hireDateInput ? hireDateInput.value : '',
                salary: salaryInput ? parseFloat(salaryInput.value) || 0 : 0,
                status: statusSwitch ? (statusSwitch.checked ? 'active' : 'inactive') : 'active'
            };

            console.log('Teacher data being sent:', teacherData); // Debug log

            // Validate required fields
            if (!teacherData.team_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a team',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.user_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a user',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.employee_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter employee ID',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.qualification) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter qualification',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherData.specialization) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter specialization',
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
                    id: response.data.data.id,
                    user_id: teacherData.user_id,
                    employee_id: teacherData.employee_id,
                    qualification: teacherData.qualification,
                    specialization: teacherData.specialization,
                    hire_date: teacherData.hire_date,
                    salary: teacherData.salary,
                    status: teacherData.status,
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
            console.error('❌ Error saving teacher:', error);
            
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
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Add New Teacher</div>
                <form id="teacher-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Team</label>
                        <ui-dropdown 
                            name="team_id" 
                            placeholder="Select a team"
                            class="w-full">
                            ${this.teams.map(team => `
                                <ui-option value="${team.id}">${team.name} - ${team.position}</ui-option>
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
                                <ui-option value="${user.id}">${user.name} (${user.email})</ui-option>
                            `).join('')}
                        </ui-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                        <ui-input 
                            data-field="employee_id"
                            type="text" 
                            placeholder="Enter employee ID"
                            class="w-full">
                        </ui-input>
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
            </ui-modal>
        `;
    }
}

customElements.define('teacher-add-modal', TeacherAddModal);
export default TeacherAddModal; 