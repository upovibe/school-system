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

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            // Re-render when dialog is opened to ensure content is displayed
            this.render();
        }
    }

    // Set academic year data for deletion
    setAcademicYearData(academicYear) {
        this.academicYearData = academicYear;
        this.render(); // Re-render to update content
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

    // Wire events for live validation and delete
    addFormEventListeners() {
        const confirmCheckbox = this.querySelector('#confirm-delete');
        const deleteBtn = this.querySelector('#delete-academic-year-btn');

        if (confirmCheckbox) {
            confirmCheckbox.addEventListener('change', () => {
                if (deleteBtn) {
                    if (confirmCheckbox.checked) {
                        deleteBtn.removeAttribute('disabled');
                    } else {
                        deleteBtn.setAttribute('disabled', '');
                    }
                }
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteAcademicYear());
        }
    }

    render() {
        if (!this.academicYearData) {
            this.innerHTML = `
                <ui-dialog 
                    title="Delete Academic Year"
                    size="md"
                    ${this.hasAttribute('open') ? 'open' : ''}
                >
                    <div slot="content" class="text-center py-8">
                        <p class="text-gray-500">No academic year data to delete</p>
                    </div>
                    <div slot="footer" class="flex justify-end">
                        <ui-button variant="secondary" @click="${() => this.close()}">
                            Cancel
                        </ui-button>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        const data = this.academicYearData;
        
        this.innerHTML = `
            <ui-dialog 
                title="Delete Academic Year"
                size="md"
                ${this.hasAttribute('open') ? 'open' : ''}
            >
                <div slot="content" class="space-y-6">
                    <!-- Warning Message -->
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-red-400"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-red-800">Warning: This action cannot be undone</h3>
                                <div class="mt-2 text-sm text-red-700">
                                    <p>You are about to delete the academic year <strong>${data.display_name}</strong> (${data.year_code}).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Academic Year Details -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Academic Year Details</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Year Code</label>
                                <p class="text-sm text-gray-900 font-medium">${data.year_code || 'N/A'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Display Name</label>
                                <p class="text-sm text-gray-900 font-medium">${data.display_name || 'N/A'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Start Date</label>
                                <p class="text-sm text-gray-900">${this.formatDate(data.start_date)}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">End Date</label>
                                <p class="text-sm text-gray-900">${this.formatDate(data.end_date)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Impact Assessment -->
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-info-circle text-yellow-400"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-yellow-800">What happens when you delete this academic year?</h3>
                                <div class="mt-2 text-sm text-yellow-700">
                                    <ul class="list-disc pl-5 space-y-1">
                                        <li>All classes associated with this academic year will be affected</li>
                                        <li>Grading periods for this year will be removed</li>
                                        <li>Fee schedules linked to this year will be deleted</li>
                                        <li>Student records and grades may become orphaned</li>
                                        <li>This action is irreversible and may cause data inconsistencies</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Confirmation -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center space-x-3">
                            <input 
                                type="checkbox" 
                                id="confirm-delete" 
                                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            >
                            <label for="confirm-delete" class="text-sm text-gray-700">
                                I understand the consequences and want to proceed with deletion
                            </label>
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
                        disabled
                    >
                        Delete Academic Year
                    </ui-button>
                </div>
            </ui-dialog>
        `;

        // Add event listeners
        this.addFormEventListeners();
    }
}

customElements.define('academic-year-delete-dialog', AcademicYearDeleteDialog);
export default AcademicYearDeleteDialog;