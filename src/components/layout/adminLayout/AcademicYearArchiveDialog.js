import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * Academic Year Archive Dialog Component
 * 
 * A dialog component for confirming archiving of academic years in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - academic-year-archived: Fired when an academic year is successfully archived
 * - modal-closed: Fired when dialog is closed
 */
class AcademicYearArchiveDialog extends HTMLElement {
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
        // Listen for confirm button click (Archive Academic Year)
        this.addEventListener('confirm', () => {
            this.archiveAcademicYear();
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

    // Set academic year data for archiving
    setAcademicYearData(academicYear) {
        this.academicYearData = academicYear;
        this.render(); // Re-render to update content
    }

    // Archive the academic year
    async archiveAcademicYear() {
        try {
            if (!this.academicYearData || !this.academicYearData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No academic year data to archive',
                    variant: 'error'
                });
                return;
            }

            // Call API
            const token = localStorage.getItem('token');
            const response = await api.withToken(token).post(`/academic-years/${this.academicYearData.id}/archive`);
            
            // Check if academic year was archived successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Academic year archived successfully',
                    variant: 'success'
                });

                // Dispatch event with the archived academic year ID
                this.dispatchEvent(new CustomEvent('academic-year-archived', {
                    detail: { 
                        academicYearId: this.academicYearData.id,
                        archiveRecordId: response.data.archive_record_id
                    },
                    bubbles: true
                }));

                // Don't call this.close() - let the parent page handle it
            } else {
                throw new Error(response.data?.message || 'Failed to archive academic year');
            }
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: 'Failed to archive academic year. Please try again.',
                variant: 'error'
            });
        }
    }



    render() {
        const data = this.academicYearData;
        
        if (!data) {
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    variant="warning">
                    <div slot="title">Archive Academic Year</div>
                    <div slot="content">
                        <p class="text-gray-500">No academic year data to archive</p>
                    </div>
                </ui-dialog>
            `;
            return;
        }
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="warning">
                <div slot="title">Archive Academic Year</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to archive <strong>${data.display_name}</strong> (${data.year_code})?
                    </p>
                    <p class="text-sm text-gray-500">
                        This will create a complete snapshot of all data and mark the year as archived. The action cannot be undone, but all data will be preserved for historical reference.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('academic-year-archive-dialog', AcademicYearArchiveDialog);
export default AcademicYearArchiveDialog;
