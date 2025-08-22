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
        // Listen for confirm button click (Delete Academic Year)
        this.addEventListener('confirm', () => {
            this.deleteAcademicYear();
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
            
            // Check if academic year was deleted successfully (following subjects pattern)
            if (response.status === 200 || response.data.success) {
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

                // Don't call this.close() - let the parent page handle it
            } else {
                throw new Error(response.data?.message || 'Failed to delete academic year');
            }
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: 'Failed to delete academic year. Please try again.',
                variant: 'error'
            });
        }
    }

    // Wire events for live validation and delete
    addFormEventListeners() {
        // No need for manual button handling - ui-dialog handles it automatically
    }

    render() {
        if (!this.academicYearData) {
            this.innerHTML = `
                <ui-modal 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    position="right" 
                    close-button="true">
                    <div slot="title">Delete Academic Year</div>
                    <div class="text-center py-8">
                        <p class="text-gray-500">No academic year data to delete</p>
                    </div>
                    <div slot="footer" class="flex justify-end">
                        <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    </div>
                </ui-modal>
            `;
            return;
        }

        const data = this.academicYearData;
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="danger">
                <div slot="title">Delete Academic Year</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete <strong>${data.display_name}</strong> (${data.year_code})?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. If this academic year has classes, grading periods, or fee schedules associated with it, the deletion will be prevented.
                    </p>
                </div>
            </ui-dialog>
        `;

        // No need to add event listeners - ui-dialog handles buttons automatically
    }
}

customElements.define('academic-year-delete-dialog', AcademicYearDeleteDialog);
export default AcademicYearDeleteDialog;