import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * Academic Year Delete Dialog Component
 * 
 * A dialog component for confirming deletion of academic years in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - academic-year-deleted: Fired when an academic year is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class AcademicYearDeleteDialog extends HTMLElement {
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

    // Set academic year data for deletion
    setAcademicYearData(academicYear) {
        this.academicYearData = academicYear;
        this.updateDeleteMessage();
    }

    // Update the delete message based on the academic year data
    updateDeleteMessage() {
        if (!this.academicYearData) return;

        const messageElement = this.querySelector('#delete-message');
        if (messageElement) {
            const data = this.academicYearData;
            messageElement.innerHTML = `
                <p class="text-sm text-gray-600 mb-4">
                    Are you sure you want to delete the academic year <strong>"${data.display_name}"</strong> (${data.year_code})?
                </p>
                
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fas fa-exclamation-triangle text-red-400"></i>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Warning: This action cannot be undone!</h3>
                            <div class="mt-2 text-sm text-red-700">
                                <ul class="list-disc pl-5 space-y-1">
                                    <li>This will permanently delete the academic year</li>
                                    <li>All associated data will be lost</li>
                                    <li>This may affect existing classes and records</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Academic Year Details:</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div><span class="font-medium">Year Code:</span> ${data.year_code}</div>
                        <div><span class="font-medium">Display Name:</span> ${data.display_name}</div>
                        <div><span class="font-medium">Start Date:</span> ${this.formatDate(data.start_date)}</div>
                        <div><span class="font-medium">End Date:</span> ${this.formatDate(data.end_date)}</div>
                        <div><span class="font-medium">Status:</span> ${this.formatStatus(data.status)}</div>
                        <div><span class="font-medium">Current Year:</span> ${data.is_current ? 'Yes' : 'No'}</div>
                    </div>
                </div>
            `;
        }
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    // Format status for display
    formatStatus(status) {
        if (!status) return 'N/A';
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    // Delete the academic year
    async deleteAcademicYear() {
        try {
            if (!this.academicYearData || !this.academicYearData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No academic year data to delete',
                    variant: 'error'
                });
                return;
            }

            // Show loading state
            const deleteBtn = this.querySelector('#delete-academic-year-btn');
            if (deleteBtn) {
                deleteBtn.setAttribute('loading', '');
                deleteBtn.textContent = 'Deleting...';
            }

            // Call API
            const token = localStorage.getItem('token');
            const response = await api.withToken(token).delete(`/academic-years/${this.academicYearData.id}`);

            if (response.data && response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Academic year deleted successfully',
                    variant: 'success'
                });

                // Dispatch event with the deleted academic year ID
                this.dispatchEvent(new CustomEvent('academic-year-deleted', {
                    detail: { academicYearId: this.academicYearData.id },
                    bubbles: true
                }));

                // Close dialog
                this.close();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data?.message || 'Failed to delete academic year',
                    variant: 'error'
                });
            }
        } catch (error) {
            console.error('Error deleting academic year:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to delete academic year. Please try again.',
                variant: 'error'
            });
        } finally {
            // Reset button state
            const deleteBtn = this.querySelector('#delete-academic-year-btn');
            if (deleteBtn) {
                deleteBtn.removeAttribute('loading');
                deleteBtn.textContent = 'Delete Academic Year';
            }
        }
    }

    render() {
        return `
            <ui-dialog 
                title="Delete Academic Year"
                size="md"
                ${this.hasAttribute('open') ? 'open' : ''}
            >
                <div slot="content" class="space-y-4">
                    <div id="delete-message">
                        <p class="text-sm text-gray-600 mb-4">
                            Are you sure you want to delete this academic year?
                        </p>
                        
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-red-400"></i>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-red-800">Warning: This action cannot be undone!</h3>
                                    <div class="mt-2 text-sm text-red-700">
                                        <ul class="list-disc pl-5 space-y-1">
                                            <li>This will permanently delete the academic year</li>
                                            <li>All associated data will be lost</li>
                                            <li>This may affect existing classes and records</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button variant="secondary" @click="${() => this.close()}">
                        Cancel
                    </ui-button>
                    <ui-button 
                        id="delete-academic-year-btn"
                        variant="danger"
                        @click="${() => this.deleteAcademicYear()}"
                    >
                        Delete Academic Year
                    </ui-button>
                </div>
            </ui-dialog>
        `;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            this.open();
        } else if (name === 'open' && newValue === null) {
            this.close();
        }
    }
}

customElements.define('academic-year-delete-dialog', AcademicYearDeleteDialog);
export default AcademicYearDeleteDialog;
