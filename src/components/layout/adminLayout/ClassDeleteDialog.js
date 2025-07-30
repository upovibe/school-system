import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Class Delete Dialog Component
 * 
 * A dialog component for confirming class deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - class-deleted: Fired when a class is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class ClassDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.classData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Class)
        this.addEventListener('confirm', () => {
            this.deleteClass();
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

    // Set class data for deletion
    setClassData(classItem) {
        this.classData = classItem;
    }

    // Delete the class
    async deleteClass() {
        try {
            if (!this.classData) {
                Toast.show({
                    title: 'Error',
                    message: 'No class data available for deletion',
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
                    message: 'Please log in to delete classes',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete class
            const response = await api.withToken(token).delete(`/classes/${this.classData.id}`);
            
            // Check if class was deleted successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Class deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('class-deleted', {
                    detail: { class: this.classData },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to delete class');
            }

        } catch (error) {
            console.error('❌ Error deleting class:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete class',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const className = this.classData ? `${this.classData.name} Section ${this.classData.section}` : 'this class';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="danger">
                <div slot="title">Delete Class</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete <strong>${className}</strong>?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. If this class has students assigned to it, the deletion will be prevented.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('class-delete-dialog', ClassDeleteDialog);
export default ClassDeleteDialog; 