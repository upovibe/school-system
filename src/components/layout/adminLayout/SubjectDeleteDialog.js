import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Subject Delete Dialog Component
 * 
 * A dialog component for confirming subject deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - subject-deleted: Fired when a subject is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class SubjectDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.subjectData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Subject)
        this.addEventListener('confirm', () => {
            this.deleteSubject();
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

    // Set subject data for deletion
    setSubjectData(subject) {
        this.subjectData = subject;
        this.populateDialog();
    }

    // Populate dialog with subject data
    populateDialog() {
        if (!this.subjectData) return;

        const subjectNameElement = this.querySelector('[data-field="subject-name"]');
        if (subjectNameElement) {
            subjectNameElement.textContent = this.subjectData.name || 'Unknown Subject';
        }
    }

    // Delete the subject
    async deleteSubject() {
        try {
            if (!this.subjectData) {
                Toast.show({
                    title: 'Error',
                    message: 'No subject data available for deletion',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete subjects',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete subject
            const response = await api.withToken(token).delete(`/subjects/${this.subjectData.id}`);
            
            // Check if subject was deleted successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Subject deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('subject-deleted', {
                    detail: { subjectId: this.subjectData.id },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to delete subject');
            }

        } catch (error) {
            console.error('❌ Error deleting subject:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete subject',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="danger">
                <div slot="title">Delete Subject</div>
                <div class="space-y-4">
                    <p class="text-gray-600">
                        Are you sure you want to delete the subject 
                        <strong data-field="subject-name">Loading...</strong>?
                    </p>
                    <p class="text-sm text-red-600">
                        This action cannot be undone. The subject will be permanently removed from the system.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('subject-delete-dialog', SubjectDeleteDialog);
export default SubjectDeleteDialog; 