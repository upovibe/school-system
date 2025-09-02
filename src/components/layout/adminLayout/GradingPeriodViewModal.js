import '@/components/ui/Modal.js';
import '@/components/ui/Badge.js';

/**
 * Grading Period View Modal Component
 * 
 * A modal component for viewing grading period details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class GradingPeriodViewModal extends HTMLElement {
    constructor() {
        super();
        this.gradingPeriodData = null;
    }

    static get observedAttributes() {
        return ['open'];
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

    // Set grading period data for viewing
    setGradingPeriodData(gradingPeriodItem) {
        this.gradingPeriodData = gradingPeriodItem;
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
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    calculateDuration(startDate, endDate) {
        if (!startDate || !endDate) return 'N/A';
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return '1 day';
        } else if (diffDays < 30) {
            return `${diffDays} days`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months !== 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years} year${years !== 1 ? 's' : ''}`;
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Grading Period Details</div>
                
                <div>
                    ${this.gradingPeriodData ? `
                        <!-- Grading Period Header -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.gradingPeriodData.name || 'N/A'}</h3>
                            <ui-badge color="${this.gradingPeriodData.is_active == 1 ? 'success' : 'error'}">
                                <i class="fas fa-${this.gradingPeriodData.is_active == 1 ? 'check' : 'times'} mr-1"></i>
                                ${this.gradingPeriodData.is_active == 1 ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>

                        <!-- Grading Period Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Period Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar mr-1"></i>Period Name
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.gradingPeriodData.name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-alt mr-1"></i>Academic Year
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.gradingPeriodData.academic_year || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-day mr-1"></i>Start Date
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.formatDate(this.gradingPeriodData.start_date)}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-day mr-1"></i>End Date
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.formatDate(this.gradingPeriodData.end_date)}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Description -->
                        ${this.gradingPeriodData.description ? `
                            <div class="border-b pb-4">
                                <div class="flex items-center gap-2 mb-3">
                                    <i class="fas fa-align-left text-green-500"></i>
                                    <h4 class="text-md font-semibold text-gray-800">Description</h4>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <p class="text-gray-700 text-sm">${this.gradingPeriodData.description}</p>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Duration -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-clock text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Duration</h4>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <p class="text-gray-700 text-sm">${this.calculateDuration(this.gradingPeriodData.start_date, this.gradingPeriodData.end_date)}</p>
                            </div>
                        </div>

                        <!-- Timestamps -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-history text-gray-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-plus mr-1"></i>Created
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.formatDate(this.gradingPeriodData.created_at)}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.formatDate(this.gradingPeriodData.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No grading period data to display</p>
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

customElements.define('grading-period-view-modal', GradingPeriodViewModal);
export default GradingPeriodViewModal;
