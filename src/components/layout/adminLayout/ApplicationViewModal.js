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
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">
                                ${this.applicationData.student_first_name || ''} ${this.applicationData.student_last_name || ''}
                            </h3>
                            <ui-badge color="info">
                                <i class="fas fa-user-graduate mr-1"></i>
                                ${this.applicationData.grade || 'N/A'}
                            </ui-badge>
                        </div>
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Application Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-user mr-1"></i>Student Name
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">
                                        ${this.applicationData.student_first_name || ''} ${this.applicationData.student_last_name || ''}
                                    </p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-envelope mr-1"></i>Email Address
                                    </label>
                                    <p class="text-gray-900 text-sm">
                                        ${this.applicationData.email ? `<a href="mailto:${this.applicationData.email}" class="text-blue-600 hover:underline">${this.applicationData.email}</a>` : 'N/A'}
                                    </p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-phone mr-1"></i>Parent Phone
                                    </label>
                                    <p class="text-gray-900 text-sm">
                                        ${this.applicationData.parent_phone ? `<a href="tel:${this.applicationData.parent_phone}" class="text-blue-600 hover:underline">${this.applicationData.parent_phone}</a>` : 'N/A'}
                                    </p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-phone-alt mr-1"></i>Student Phone
                                    </label>
                                    <p class="text-gray-900 text-sm">
                                        ${this.applicationData.student_phone ? `<a href="tel:${this.applicationData.student_phone}" class="text-blue-600 hover:underline">${this.applicationData.student_phone}</a>` : 'N/A'}
                                    </p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-male mr-1"></i>Father's Name
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.father_name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-female mr-1"></i>Mother's Name
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.mother_name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-user-shield mr-1"></i>Guardian Name
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.applicationData.guardian_name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
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
            </ui-modal>
        `;
    }
}

customElements.define('application-view-modal', ApplicationViewModal);
export default ApplicationViewModal; 