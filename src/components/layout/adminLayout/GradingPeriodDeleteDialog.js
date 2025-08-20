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
        return ['open'];
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

    // Set grading period data for deletion
    setGradingPeriodData(gradingPeriodItem) {
        this.gradingPeriodData = gradingPeriodItem;
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
            const response = await api.withToken(token).delete(`/grading-periods/${this.gradingPeriodData.id}`);

            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Grading period deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the deleted grading period data
                console.log('🗑️ Dispatching delete event with data:', this.gradingPeriodData);
                this.dispatchEvent(new CustomEvent('grading-period-deleted', {
                    detail: {
                        gradingPeriod: this.gradingPeriodData
                    },
                    bubbles: true,
                    composed: true
                }));
                console.log('🗑️ Delete event dispatched');

                this.close();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to delete grading period',
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



    render() {
        const periodName = this.gradingPeriodData ? this.gradingPeriodData.name : 'this grading period';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="danger">
                <div slot="title">Delete Grading Period</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete <strong>${periodName}</strong>?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. If this grading period has associated grades, the deletion will be prevented.
                    </p>
                </div>
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
