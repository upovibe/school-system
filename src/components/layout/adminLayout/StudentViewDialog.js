import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';

/**
 * Student View Modal Component
 * 
 * A modal component for viewing student details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class StudentViewDialog extends HTMLElement {
    constructor() {
        super();
        this.studentData = null;
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
        // Listen for cancel button click (Close modal)
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

    setStudentData(student) {
        this.studentData = student;
        this.render();
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
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
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="View Student Details">
                <div slot="content">
                
                <div>
                    ${this.studentData ? `
                        <!-- Student Header -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.studentData.first_name} ${this.studentData.last_name}</h3>
                            <ui-badge color="${this.studentData.status === 'active' ? 'success' : 'error'}">
                                <i class="fas fa-${this.studentData.status === 'active' ? 'check' : 'times'} mr-1"></i>
                                ${this.studentData.status === 'active' ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>

                        <!-- Student Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Student Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-id-card mr-1"></i>Student ID
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.studentData.student_id || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-user mr-1"></i>Full Name
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.studentData.first_name} ${this.studentData.last_name}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-envelope mr-1"></i>Email Address
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.email || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-phone mr-1"></i>Phone Number
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.phone || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-map-marker-alt mr-1"></i>Address
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.address || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-day mr-1"></i>Date of Birth
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.formatDate(this.studentData.date_of_birth)}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-venus-mars mr-1"></i>Gender
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.gender ? this.studentData.gender.charAt(0).toUpperCase() + this.studentData.gender.slice(1) : 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-check mr-1"></i>Admission Date
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.formatDate(this.studentData.admission_date)}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-graduation-cap mr-1"></i>Current Class
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.class_name && this.studentData.class_section ? `${this.studentData.class_name}(${this.studentData.class_section})` : (this.studentData.class_name || 'N/A')}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-user-graduate mr-1"></i>Student Type
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.student_type || 'Day'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Parent Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-users text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Parent Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-user mr-1"></i>Parent Name
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.parent_name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-phone mr-1"></i>Parent Phone
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.parent_phone || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-envelope mr-1"></i>Parent Email
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.parent_email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Emergency Contact -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-exclamation-triangle text-red-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Emergency Contact</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-user mr-1"></i>Emergency Contact Name
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.emergency_contact || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-phone mr-1"></i>Emergency Phone
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.emergency_phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Medical Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-heartbeat text-pink-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Medical Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-tint mr-1"></i>Blood Group
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.blood_group || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-notes-medical mr-1"></i>Medical Conditions
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.medical_conditions || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Timestamps -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-clock text-orange-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-plus mr-1"></i>Created
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.studentData.created_at)}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.studentData.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No student data available</p>
                        </div>
                    `}
                </div>
                </div>
                
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Close</ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('student-view-dialog', StudentViewDialog);
export default StudentViewDialog; 