import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
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
 * - dialog-closed: Fired when dialog is closed
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
        // Listen for button clicks
        this.addEventListener('click', (event) => {
            const button = event.target.closest('ui-button[data-action]');
            if (!button) return;
            
            const action = button.getAttribute('data-action');
            
            if (action === 'delete') {
                this.confirmDelete();
            } else if (action === 'cancel') {
                this.close();
            }
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
    setResourceData(resourceData) {
        this.resourceData = resourceData;
        // Update the dialog content immediately
        this.updateDialogContent();
    }

    // Update dialog content without full re-render
    updateDialogContent() {
        const contentSlot = this.querySelector('[slot="content"]');
        if (contentSlot && this.resourceData) {
            const title = this.resourceData.title || 'Untitled Resource';
            const className = this.resourceData.class_name;
            const classSection = this.resourceData.class_section;
            const fileName = this.resourceData.attachment_file ? this.resourceData.attachment_file.split('/').pop() : null;
            
            // Only show class info if we have valid data
            const classInfo = className && classSection ? `${className} (${classSection})` : null;
            
            contentSlot.innerHTML = `
                <p class="text-gray-700 mb-4">
                    Are you sure you want to delete the resource "<strong>${title}</strong>"?
                </p>
                ${classInfo || fileName ? `
                    <div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                        ${classInfo ? `
                            <div class="flex justify-between mb-1">
                                <span class="text-gray-600 font-medium">Class:</span>
                                <span class="text-gray-900">${classInfo}</span>
                            </div>
                        ` : ''}
                        ${fileName ? `
                            <div class="flex justify-between">
                                <span class="text-gray-600 font-medium">File:</span>
                                <span class="text-gray-900">${fileName}</span>
                            </div>
                        ` : ''}
                        </div>
                    ` : ''}
                <p class="text-sm text-gray-500">
                    This action cannot be undone. The resource and its associated file will be permanently deleted.
                </p>
            `;
        }
    }

    // Handle delete confirmation
    async confirmDelete() {
        if (!this.resourceData) {
            console.error('❌ No resource data available for deletion');
            Toast.show({
                title: 'Error',
                message: 'No resource data available for deletion',
                variant: 'error',
                duration: 3000
            });
            return;
        }

        try {
            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No authentication token found');
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete resources',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Store resource ID before deletion
            const resourceId = this.resourceData.id;

            // Delete the resource
            await api.withToken(token).delete(`/timetable-resources/${resourceId}`);
            
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
        const title = this.resourceData?.title || 'Unknown';
        const className = this.resourceData?.class_name;
        const classSection = this.resourceData?.class_section;
        const fileName = this.resourceData?.attachment_file ? this.resourceData.attachment_file.split('/').pop() : null;
        
        // Only show class info if we have valid data
        const classInfo = className && classSection ? `${className} (${classSection})` : null;
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                close-button="true">
                <div slot="header" class="flex items-center">
                    <i class="fas fa-trash text-red-500 mr-2"></i>
                    <span class="font-semibold">Delete Timetable Resource</span>
                </div>
                
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the resource "<strong>${title}</strong>"?
                    </p>
                    ${classInfo || fileName ? `
                        <div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                            ${classInfo ? `
                                <div class="flex justify-between mb-1">
                                    <span class="text-gray-600 font-medium">Class:</span>
                                    <span class="text-gray-900">${classInfo}</span>
                                </div>
                            ` : ''}
                            ${fileName ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-600 font-medium">File:</span>
                                    <span class="text-gray-900">${fileName}</span>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The resource and its associated file will be permanently deleted.
                    </p>
                </div>
                
                <div slot="footer" class="flex justify-end gap-3">
                    <ui-button color="secondary" data-action="cancel">Cancel</ui-button>
                    <ui-button color="error" data-action="delete">
                        <i class="fas fa-trash mr-2"></i>
                        Delete Resource
                    </ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('timetable-resource-delete-dialog', TimetableResourceDeleteDialog);
export default TimetableResourceDeleteDialog;
