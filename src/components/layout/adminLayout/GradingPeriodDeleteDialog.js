import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Grading Period Delete Dialog Component
 * 
 * A dialog component for confirming deletion of grading periods in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * - grading-period-data: object - the grading period data to delete
 * 
 * Events:
 * - grading-period-deleted: Fired when a grading period is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class GradingPeriodDeleteDialog extends HTMLElement {
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
        // Listen for confirm button click (Delete Grading Period)
        this.addEventListener('confirm', () => {
            this.deleteGradingPeriod();
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
    }

    // Delete the grading period
    async deleteGradingPeriod() {
        try {
            if (!this.gradingPeriodData || !this.gradingPeriodData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No grading period data to delete',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to perform this action',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Show loading state
            const confirmButton = this.querySelector('ui-button[slot="confirm"]');
            if (confirmButton) {
                confirmButton.setAttribute('loading', '');
                confirmButton.textContent = 'Deleting...';
            }

            // Send the request
            const response = await api.delete(`/grading-periods/${this.gradingPeriodData.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Grading period deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the deleted grading period ID
                this.dispatchEvent(new CustomEvent('grading-period-deleted', {
                    detail: {
                        gradingPeriodId: this.gradingPeriodData.id
                    }
                }));

                this.close();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.message || 'Failed to delete grading period',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error deleting grading period:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to delete grading period. Please try again.',
                variant: 'error',
                duration: 3000
            });
        } finally {
            // Reset loading state
            const confirmButton = this.querySelector('ui-button[slot="confirm"]');
            if (confirmButton) {
                confirmButton.removeAttribute('loading');
                confirmButton.textContent = 'Delete Grading Period';
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'grading-period-data' && newValue) {
            try {
                this.gradingPeriodData = JSON.parse(newValue);
            } catch (error) {
                console.error('Error parsing grading period data:', error);
            }
        }
    }

    render() {
        const period = this.gradingPeriodData;
        
        if (!period) {
            return `
                <ui-dialog 
                    title="Delete Grading Period"
                    ${this.hasAttribute('open') ? 'open' : ''}>
                    
                    <div class="text-center py-8">
                        <p class="text-gray-500">No grading period data to delete</p>
                    </div>

                    <ui-button slot="cancel" variant="secondary">
                        Cancel
                    </ui-button>
                </ui-dialog>
            `;
        }

        return `
            <ui-dialog 
                title="Delete Grading Period"
                ${this.hasAttribute('open') ? 'open' : ''}>
                
                <div class="text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                        Are you sure you want to delete this grading period?
                    </h3>
                    
                    <div class="mt-4 bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">
                            <strong>Period Name:</strong> ${period.name}
                        </p>
                        <p class="text-sm text-gray-600 mb-2">
                            <strong>Academic Year:</strong> ${period.academic_year}
                        </p>
                        <p class="text-sm text-gray-600">
                            <strong>Duration:</strong> ${this.formatDateRange(period.start_date, period.end_date)}
                        </p>
                    </div>
                    
                    <p class="text-sm text-gray-500 mt-4">
                        This action cannot be undone. All associated data will be permanently deleted.
                    </p>
                </div>

                <ui-button slot="confirm" variant="danger">
                    Delete Grading Period
                </ui-button>
                <ui-button slot="cancel" variant="secondary">
                    Cancel
                </ui-button>
            </ui-dialog>
        `;
    }

    formatDateRange(startDate, endDate) {
        if (!startDate || !endDate) return 'N/A';
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
}

customElements.define('grading-period-delete-dialog', GradingPeriodDeleteDialog);
export default GradingPeriodDeleteDialog;
