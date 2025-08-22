import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';

/**
 * Academic Year View Modal Component
 * 
 * A modal component for viewing academic year details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class AcademicYearViewModal extends HTMLElement {
    constructor() {
        super();
        this.academicYearData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for close button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            // Re-render when modal is opened to ensure content is displayed
            this.render();
        }
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set academic year data for viewing
    setAcademicYearData(academicYear) {
        this.academicYearData = academicYear;
        this.populateView();
    }

    // Populate view with existing data
    populateView() {
        if (!this.academicYearData) return;

        // Update the view content
        this.render();
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    // Format boolean for display
    formatBoolean(value) {
        return value ? 'Yes' : 'No';
    }

    // Format status for display
    formatStatus(status) {
        if (!status) return 'N/A';
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    render() {
        if (!this.academicYearData) {
            this.innerHTML = `
                <ui-modal 
                    title="View Academic Year"
                    size="lg"
                    ${this.hasAttribute('open') ? 'open' : ''}
                >
                    <div slot="content" class="text-center py-8">
                        <p class="text-gray-500">No academic year data to display</p>
                    </div>
                    <div slot="footer" class="flex justify-end">
                        <ui-button variant="secondary" @click="${() => this.close()}">
                            Close
                        </ui-button>
                    </div>
                </ui-modal>
            `;
            return;
        }

        const data = this.academicYearData;
        
        this.innerHTML = `
            <ui-modal 
                title="Academic Year Details"
                size="lg"
                ${this.hasAttribute('open') ? 'open' : ''}
            >
                <div slot="content" class="space-y-6">
                    <!-- Basic Information -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Year Code</label>
                                <p class="text-sm text-gray-900 font-medium">${data.year_code || 'N/A'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Display Name</label>
                                <p class="text-sm text-gray-900 font-medium">${data.display_name || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Date Information -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Date Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Start Date</label>
                                <p class="text-sm text-gray-900 font-medium">${this.formatDate(data.start_date)}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">End Date</label>
                                <p class="text-sm text-gray-900 font-medium">${this.formatDate(data.end_date)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Status Information -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Status</label>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    data.status === 'active' ? 'bg-green-100 text-green-800' :
                                    data.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }">
                                    ${this.formatStatus(data.status)}
                                </span>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Active</label>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    data.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }">
                                    ${this.formatBoolean(data.is_active)}
                                </span>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Current Year</label>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    data.is_current ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }">
                                    ${this.formatBoolean(data.is_current)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Additional Information -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Created At</label>
                                <p class="text-sm text-gray-900">${this.formatDate(data.created_at)}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Last Updated</label>
                                <p class="text-sm text-gray-900">${this.formatDate(data.updated_at)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Archive Information (if archived) -->
                    ${data.status === 'archived' ? `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 class="text-lg font-semibold text-yellow-800 mb-4">Archive Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-yellow-700">Archive Date</label>
                                    <p class="text-sm text-yellow-800">${this.formatDate(data.archive_date)}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-yellow-700">Archived By</label>
                                    <p class="text-sm text-yellow-800">${data.archived_by || 'System'}</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Help Text -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-info-circle text-blue-400"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-blue-800">About This Academic Year</h3>
                                <div class="mt-2 text-sm text-blue-700">
                                    <ul class="list-disc pl-5 space-y-1">
                                        <li>This academic year period is used to organize classes, grading periods, and student records</li>
                                        <li>${data.is_current ? 'This is the current academic year in session' : 'This is not the current academic year'}</li>
                                        <li>${data.is_active ? 'This year is active and can be used for operations' : 'This year is inactive and cannot be used for new operations'}</li>
                                        <li>${data.status === 'archived' ? 'This year has been archived to preserve historical data' : 'This year is currently in use'}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div slot="footer" class="flex justify-end">
                    <ui-button variant="secondary" @click="${() => this.close()}">
                        Close
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('academic-year-view-modal', AcademicYearViewModal);
export default AcademicYearViewModal;
