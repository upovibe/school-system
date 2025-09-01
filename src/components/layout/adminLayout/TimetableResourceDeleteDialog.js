import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Timetable Resource Delete Dialog Component
 * 
 * A dialog component for confirming deletion of timetable resources
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - resource-deleted: Fired when a resource is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class TimetableResourceDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.resourceData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Resource)
        this.addEventListener('confirm', () => {
            this.deleteResource();
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
        this.resourceData = null;
    }

    // Set resource data for deletion
    setResourceData(resource) {
        this.resourceData = resource;
        this.render();
    }

    // Delete the resource
    async deleteResource() {
        try {
            if (!this.resourceData) {
                Toast.show({
                    title: 'Error',
                    message: 'No resource data available for deletion',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Store resource ID before deletion
            const resourceId = this.resourceData.id;

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete resources',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete resource
            const response = await api.withToken(token).delete(`/timetable-resources/${resourceId}`);
            
            // Check if resource was deleted successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Timetable resource deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('resource-deleted', {
                    detail: { resourceId: resourceId },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to delete resource');
            }

        } catch (error) {
            console.error('❌ Error deleting timetable resource:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete timetable resource',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const title = this.resourceData ? this.resourceData.title : 'this resource';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="danger">
                <div slot="title">Delete Timetable Resource</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete <strong>${title}</strong>?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The resource and its associated file will be permanently deleted.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('timetable-resource-delete-dialog', TimetableResourceDeleteDialog);
export default TimetableResourceDeleteDialog;
