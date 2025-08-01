import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Avatar.js';

/**
 * Teacher Student Personal Information Modal Component
 * 
 * A modal component for viewing student personal information in the teacher panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class TeacherStudentPersonalInformation extends HTMLElement {
    constructor() {
        super();
        this.studentData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Close)
        this.addEventListener('confirm', () => {
            this.close();
        });
        
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
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.studentData = null;
        this.render();
    }

    // Set student data for viewing
    setStudentData(studentData) {
        this.studentData = { ...studentData };
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

    // Get gender display text
    getGenderDisplay(gender) {
        return gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'N/A';
    }

    // Get status badge
    getStatusBadge(status) {
        const color = status === 'active' ? 'success' : 'danger';
        return `<ui-badge color="${color}">${status === 'active' ? 'Active' : 'Inactive'}</ui-badge>`;
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">Student Personal Information</div>
                
                <div>
                    ${this.studentData ? `
                        <!-- Student Header -->
                        <div class="flex items-center gap-4 border-b pb-4">
                            <ui-avatar 
                                size="lg" 
                                src="${this.studentData.profile_image || ''}"
                                alt="${this.studentData.first_name} ${this.studentData.last_name}"
                                name="${this.studentData.first_name} ${this.studentData.last_name}">
                            </ui-avatar>
                            <div class="flex-1">
                                <h3 class="text-xl font-semibold text-gray-900">
                                    ${this.studentData.first_name} ${this.studentData.last_name}
                                </h3>
                                <p class="text-gray-600">Student ID: ${this.studentData.student_id || 'N/A'}</p>
                                ${this.getStatusBadge(this.studentData.status)}
                            </div>
                        </div>

                        <!-- Personal Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-user text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Personal Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-envelope mr-1"></i>Email
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.email || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-phone mr-1"></i>Phone
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.phone || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-venus-mars mr-1"></i>Gender
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.getGenderDisplay(this.studentData.gender)}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar mr-1"></i>Date of Birth
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.formatDate(this.studentData.date_of_birth)}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-map-marker-alt mr-1"></i>Address
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Parent/Guardian Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-users text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Parent/Guardian Information</h4>
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
                                        <i class="fas fa-user mr-1"></i>Emergency Contact
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
                                <i class="fas fa-heartbeat text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Medical Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-tint mr-1"></i>Blood Group
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.blood_group || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-notes-medical mr-1"></i>Medical Conditions
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.studentData.medical_conditions || 'None'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Academic Information -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-graduation-cap text-indigo-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Academic Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar mr-1"></i>Admission Date
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.formatDate(this.studentData.admission_date)}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-clock mr-1"></i>Last Updated
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.formatDate(this.studentData.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No student data available</p>
                        </div>
                    `}
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('teacher-student-personal-information', TeacherStudentPersonalInformation);
export default TeacherStudentPersonalInformation; 