import '@/components/ui/Modal.js';

/**
 * Grading Period View Modal Component
 * 
 * A modal component for viewing grading period details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * - grading-period-data: object - the grading period data to view
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
        return ['open', 'grading-period-data'];
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

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'grading-period-data' && newValue) {
            try {
                this.gradingPeriodData = JSON.parse(newValue);
                this.render();
            } catch (error) {
                console.error('Error parsing grading period data:', error);
            }
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    render() {
        const period = this.gradingPeriodData;
        
        if (!period) {
            return `
                <ui-modal 
                    title="View Grading Period"
                    size="lg"
                    ${this.hasAttribute('open') ? 'open' : ''}>
                    
                    <div class="text-center py-8">
                        <p class="text-gray-500">No grading period data to display</p>
                    </div>

                    <ui-button slot="cancel" variant="secondary">
                        Close
                    </ui-button>
                </ui-modal>
            `;
        }

        return `
            <ui-modal 
                title="Grading Period Details"
                size="lg"
                ${this.hasAttribute('open') ? 'open' : ''}>
                
                <div class="space-y-6">
                    <!-- Period Name -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Period Name</h3>
                        <p class="text-gray-700">${period.name || 'N/A'}</p>
                    </div>

                    <!-- Academic Year -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Academic Year</h3>
                        <p class="text-gray-700">${period.academic_year || 'N/A'}</p>
                    </div>

                    <!-- Date Range -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Start Date</h3>
                            <p class="text-gray-700">${this.formatDate(period.start_date)}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">End Date</h3>
                            <p class="text-gray-700">${this.formatDate(period.end_date)}</p>
                        </div>
                    </div>

                    <!-- Status -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Status</h3>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            period.is_active == 1 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }">
                            ${period.is_active == 1 ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    <!-- Description -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                        <p class="text-gray-700">${period.description || 'No description provided'}</p>
                    </div>

                    <!-- Additional Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Created</h3>
                            <p class="text-gray-700">${this.formatDate(period.created_at)}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Last Updated</h3>
                            <p class="text-gray-700">${this.formatDate(period.updated_at)}</p>
                        </div>
                    </div>

                    <!-- Period Duration -->
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-blue-900 mb-2">Period Duration</h3>
                        <p class="text-blue-700">
                            ${this.calculateDuration(period.start_date, period.end_date)}
                        </p>
                    </div>
                </div>

                <ui-button slot="cancel" variant="secondary">
                    Close
                </ui-button>
            </ui-modal>
        `;
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
}

customElements.define('grading-period-view-modal', GradingPeriodViewModal);
export default GradingPeriodViewModal;
