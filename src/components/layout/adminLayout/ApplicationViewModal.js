import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';

/**
 * Application View Modal Component
 * 
 * A modal component for viewing application details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class ApplicationViewModal extends HTMLElement {
    constructor() {
        super();
        this.applicationData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('confirm', () => {
            this.close();
        });
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

    resetForm() {
        this.applicationData = null;
        this.render();
    }

    setApplicationData(applicationData) {
        this.applicationData = { ...applicationData };
        
        // Parse health_info if it's a JSON string
        if (this.applicationData.health_info && typeof this.applicationData.health_info === 'string') {
            try {
                this.applicationData.health_info = JSON.parse(this.applicationData.health_info);
            } catch (e) {
                console.error('Error parsing health_info:', e);
                this.applicationData.health_info = null;
            }
        }
        
        this.render();
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Application Details</div>
                <div>
                    ${this.applicationData ? `
                        <!-- Application Header -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.applicationData.first_name} ${this.applicationData.last_name}</h3>
                            <ui-badge color="${this.applicationData.status === 'approved' ? 'success' : this.applicationData.status === 'rejected' ? 'error' : 'warning'}">
                                <i class="fas fa-${this.applicationData.status === 'approved' ? 'check' : this.applicationData.status === 'rejected' ? 'times' : 'clock'} mr-1"></i>
                                ${this.applicationData.status === 'approved' ? 'Approved' : this.applicationData.status === 'rejected' ? 'Rejected' : 'Pending'}
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
                                        <i class="fas fa-id-card mr-1"></i>Application Number
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.applicationData.applicant_number || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-alt mr-1"></i>Academic Year
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.applicationData.academic_year_name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-user mr-1"></i>Full Name
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.applicationData.first_name} ${this.applicationData.middle_name || ''} ${this.applicationData.last_name}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-envelope mr-1"></i>Student Email
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.student_email || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-phone mr-1"></i>Student Phone
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.student_phone || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-venus-mars mr-1"></i>Gender
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.gender ? this.applicationData.gender.charAt(0).toUpperCase() + this.applicationData.gender.slice(1) : 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-day mr-1"></i>Date of Birth
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.date_of_birth || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-map-marker-alt mr-1"></i>Place of Birth
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.place_of_birth || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-flag mr-1"></i>Nationality
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.nationality || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-pray mr-1"></i>Religion
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.religion || 'N/A'}</p>
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
                                        <i class="fas fa-user mr-1"></i>Parent/Guardian Name
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.parent_full_name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-link mr-1"></i>Relationship
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.relationship || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-phone mr-1"></i>Parent Phone
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.phone_number || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-envelope mr-1"></i>Parent Email
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.email || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-briefcase mr-1"></i>Occupation
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.occupation || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-exclamation-triangle mr-1"></i>Emergency Contact
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.emergency_contact || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-home mr-1"></i>Residential Address
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.residential_address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Academic Background -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-graduation-cap text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Academic Background</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-school mr-1"></i>Previous School
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.previous_school || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-trophy mr-1"></i>Last Class Completed
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.last_class_completed || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- School Setup -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-cog text-orange-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">School Setup</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-layer-group mr-1"></i>Level Applying
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.level_applying || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-graduation-cap mr-1"></i>Class Applying
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.class_applying || 'N/A'}</p>
                                </div>
                                ${this.applicationData.level_applying && this.applicationData.level_applying.toLowerCase() === 'shs' ? `
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-book mr-1"></i>Academic Programme
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.academic_programme || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-building mr-1"></i>School Type
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.school_type || 'N/A'}</p>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Health Information -->
                        ${this.applicationData.health_info ? `
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-heartbeat text-red-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Health Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-tint mr-1"></i>Blood Group
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.health_info.blood_group || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-exclamation-triangle mr-1"></i>Allergies
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.health_info.allergies || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-stethoscope mr-1"></i>Medical Conditions
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.health_info.medical_conditions || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Administrative Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-cog text-gray-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Administrative Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-globe mr-1"></i>IP Address
                                    </label>
                                    <p class="text-gray-900 text-sm font-mono">${this.applicationData.applicant_ip || 'N/A'}</p>
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
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.applicationData.created_at)}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.applicationData.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No application data available</p>
                        </div>
                    `}
                </div>
                
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Close</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('application-view-modal', ApplicationViewModal);
export default ApplicationViewModal; 