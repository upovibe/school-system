import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';

/**
 * Teacher View Dialog Component
 * 
 * A modal component for viewing teacher details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class TeacherViewDialog extends HTMLElement {
    constructor() {
        super();
        this.teacherData = null;
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
    }

    setupEventListeners() {
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
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

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="View Teacher Details">
                <div slot="content">
                    ${this.teacherData ? `
                        <!-- Teacher Header -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.teacherData.first_name} ${this.teacherData.last_name}</h3>
                            <ui-badge color="${this.teacherData.status === 'active' ? 'success' : 'error'}">
                                <i class="fas fa-${this.teacherData.status === 'active' ? 'check' : 'times'} mr-1"></i>
                                ${this.teacherData.status === 'active' ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>
                        
                        <!-- Teacher Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Teacher Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Employee ID</label>
                                    <p class="text-gray-900">${this.teacherData.employee_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Email</label>
                                    <p class="text-gray-900">${this.teacherData.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Phone</label>
                                    <p class="text-gray-900">${this.teacherData.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Gender</label>
                                    <p class="text-gray-900">${this.teacherData.gender ? this.teacherData.gender.charAt(0).toUpperCase() + this.teacherData.gender.slice(1) : 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Date of Birth</label>
                                    <p class="text-gray-900">${this.formatDate(this.teacherData.date_of_birth)}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Hire Date</label>
                                    <p class="text-gray-900">${this.formatDate(this.teacherData.hire_date)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Address Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-map-marker-alt text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Address Information</h4>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-600">Address</label>
                                <p class="text-gray-900">${this.teacherData.address || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <!-- Professional Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-graduation-cap text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Professional Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Qualification</label>
                                    <p class="text-gray-900">${this.teacherData.qualification || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Specialization</label>
                                    <p class="text-gray-900">${this.teacherData.specialization || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Salary</label>
                                    <p class="text-gray-900">${this.teacherData.salary ? `₵${parseFloat(this.teacherData.salary).toLocaleString()}` : 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Team</label>
                                    <p class="text-gray-900">${this.teacherData.team_name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Timestamps -->
                        <div class="pt-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-clock text-gray-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Created</label>
                                    <p class="text-gray-900">${this.formatDate(this.teacherData.created_at)}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-medium text-gray-600">Last Updated</label>
                                    <p class="text-gray-900">${this.formatDate(this.teacherData.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No teacher data available</p>
                        </div>
                    `}
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-view-dialog', TeacherViewDialog);
export default TeacherViewDialog; 