import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import api from '@/services/api.js';

/**
 * Timetable Resource View Dialog Component
 * 
 * A dialog component for viewing timetable resource details in read-only mode
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - dialog-closed: Fired when dialog is closed
 */
class TimetableResourceViewDialog extends HTMLElement {
    constructor() {
        super();
        this.resourceData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && oldValue !== newValue) {
            this.render();
        }
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
            
            if (action === 'close') {
                this.close();
            } else if (action === 'download') {
                this.downloadFile();
            } else if (action === 'edit') {
                this.switchToEdit();
            }
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set the resource data to view
    setResourceData(resource) {
        this.resourceData = resource;
        this.render();
    }

    // Format file path for display
    formatFilePath(filePath) {
        if (!filePath) return '';
        
        // If it's already a full URL, return as is
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (filePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            const fullUrl = baseUrl + filePath;
            return fullUrl;
        }
        
        // For relative paths like "uploads/timetable-resources/filename.jpg"
        // Construct the URL by adding the base URL and /api
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        const fullUrl = baseUrl + apiPath + '/' + filePath;
        return fullUrl;
    }

    // Get file type icon based on file extension
    getFileTypeIcon(filePath) {
        if (!filePath) return '📄';
        
        const fileName = filePath.split('/').pop() || filePath;
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        
        // Image files
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
            return '🖼️';
        }
        
        // PDF files
        if (extension === 'pdf') {
            return '📄';
        }
        
        // Word documents
        if (['doc', 'docx'].includes(extension)) {
            return '📝';
        }
        
        // Excel files
        if (['xls', 'xlsx'].includes(extension)) {
            return '📊';
        }
        
        // PowerPoint files
        if (['ppt', 'pptx'].includes(extension)) {
            return '📽️';
        }
        
        // Text files
        if (extension === 'txt') {
            return '📄';
        }
        
        // Video files
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
            return '🎥';
        }
        
        // Audio files
        if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)) {
            return '🎵';
        }
        
        // Archive files
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
            return '📦';
        }
        
        // Default file icon
        return '📄';
    }

    // Download the file
    async downloadFile() {
        try {
            if (!this.resourceData?.attachment_file) {
                Toast.show({
                    title: 'No File',
                    message: 'This resource has no file attached',
                    variant: 'warning',
                    duration: 3000
                });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to download files',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get the filename from the path
            const fileName = this.resourceData.attachment_file.split('/').pop();
            
            // Construct the direct file URL with token (same as StudentAssignmentViewDialog)
            const fileUrl = `/api/uploads/timetable-resources/${fileName}?token=${encodeURIComponent(token)}`;
            
            // Open the file in a new tab/window for download
            window.open(fileUrl, '_blank');

            Toast.show({
                title: 'Download Started',
                message: 'File download has started',
                variant: 'success',
                duration: 2000
            });

        } catch (error) {
            console.error('❌ Error downloading file:', error);
            Toast.show({
                title: 'Download Error',
                message: 'Failed to download file. Please try again.',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Switch to edit mode
    switchToEdit() {
        // Close this dialog and open the edit dialog
        this.close();
        
        // Dispatch event to open edit dialog
        this.dispatchEvent(new CustomEvent('switch-to-edit', {
            detail: { resource: this.resourceData },
            bubbles: true,
            composed: true
        }));
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    render() {
        const resource = this.resourceData;
        
        // If no resource data, show a placeholder or empty dialog
        if (!resource) {
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    close-button="true">
                    <div slot="header" class="flex items-center">
                        <i class="fas fa-eye text-blue-500 mr-2"></i>
                        <span class="font-semibold">View Timetable Resource</span>
                    </div>
                    <div slot="content" class="text-center py-8 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Loading resource data...</p>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        const fileIcon = this.getFileTypeIcon(resource.attachment_file);
        const fileName = resource.attachment_file ? resource.attachment_file.split('/').pop() : 'No file attached';
        const fileUrl = this.formatFilePath(resource.attachment_file);

        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                close-button="true">
                <div slot="header" class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-eye text-blue-500 mr-2"></i>
                        <span class="font-semibold">View Timetable Resource</span>
                    </div>
                    <div class="flex gap-2">
                        <ui-button 
                            color="secondary" 
                            size="sm" 
                            data-action="edit"
                            title="Edit this resource">
                            <i class="fas fa-edit mr-1"></i>
                            Edit
                        </ui-button>
                    </div>
                </div>
                
                                 <div slot="content">
                 
                 <div>
                     ${this.resourceData ? `
                         <!-- Resource Header -->
                         <div class="flex items-center gap-3 border-b pb-4">
                             <h3 class="text-xl font-semibold text-gray-900">${resource.title || 'Untitled Resource'}</h3>
                             <ui-badge color="success">
                                 <i class="fas fa-file-alt mr-1"></i>
                                 Resource
                             </ui-badge>
                         </div>

                         <!-- Resource Information -->
                         <div class="border-b pb-4">
                             <div class="flex items-center gap-2 mb-3">
                                 <i class="fas fa-info-circle text-blue-500"></i>
                                 <h4 class="text-md font-semibold text-gray-800">Resource Information</h4>
                             </div>
                             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div class="bg-gray-50 p-3 rounded-lg">
                                     <label class="block text-sm font-medium text-gray-700 mb-1">
                                         <i class="fas fa-chalkboard mr-1"></i>Class
                                     </label>
                                     <p class="text-gray-900 text-sm font-medium">${resource.class_name || 'Unknown'} (${resource.class_section || 'Unknown'})</p>
                                 </div>
                                 <div class="bg-gray-50 p-3 rounded-lg">
                                     <label class="block text-sm font-medium text-gray-700 mb-1">
                                         <i class="fas fa-user mr-1"></i>Created By
                                     </label>
                                     <p class="text-gray-900 text-sm font-medium">${resource.creator_name || 'Unknown'}</p>
                                 </div>
                             </div>
                         </div>

                         <!-- File Information -->
                         <div class="border-b pb-4">
                             <div class="flex items-center gap-2 mb-3">
                                 <i class="fas fa-file-alt text-green-500"></i>
                                 <h4 class="text-md font-semibold text-gray-800">File Information</h4>
                             </div>
                             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div class="bg-gray-50 p-3 rounded-lg">
                                     <label class="block text-sm font-medium text-gray-700 mb-1">
                                         <i class="fas fa-file mr-1"></i>File Name
                                     </label>
                                     <p class="text-gray-900 text-sm font-medium">${fileName}</p>
                                 </div>
                                 <div class="bg-gray-50 p-3 rounded-lg">
                                     <label class="block text-sm font-medium text-gray-700 mb-1">
                                         <i class="fas fa-download mr-1"></i>File Type
                                     </label>
                                     <p class="text-gray-900 text-sm font-medium">${fileIcon} ${fileName.split('.').pop()?.toUpperCase() || 'Unknown'}</p>
                                 </div>
                             </div>
                             ${resource.attachment_file ? `
                                 <div class="mt-3 flex justify-center">
                                     <ui-button 
                                         color="primary" 
                                         data-action="download"
                                         title="Download this file">
                                         <i class="fas fa-download mr-2"></i>
                                         Download File
                                     </ui-button>
                                 </div>
                             ` : ''}
                         </div>

                         <!-- Timestamps -->
                         <div>
                             <div class="flex items-center gap-2 mb-3">
                                 <i class="fas fa-clock text-orange-500"></i>
                                 <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                             </div>
                             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div class="bg-gray-50 p-3 rounded-lg">
                                     <label class="block text-sm font-medium text-gray-700 mb-1">
                                         <i class="fas fa-plus mr-1"></i>Created
                                     </label>
                                     <span class="text-gray-900 text-sm">${this.formatDate(resource.created_at)}</span>
                                 </div>
                                 <div class="bg-gray-50 p-3 rounded-lg">
                                     <label class="block text-sm font-medium text-gray-700 mb-1">
                                         <i class="fas fa-edit mr-1"></i>Updated
                                     </label>
                                     <span class="text-gray-900 text-sm">${this.formatDate(resource.updated_at)}</span>
                                 </div>
                             </div>
                         </div>
                     ` : `
                         <div class="text-center py-8">
                             <p class="text-gray-500">No resource data available</p>
                         </div>
                     `}
                 </div>
                 </div>
                
                                 <div slot="footer" class="flex justify-end gap-2">
                     <ui-button color="secondary" data-action="close">Close</ui-button>
                 </div>
            </ui-dialog>
        `;
    }
}

customElements.define('timetable-resource-view-dialog', TimetableResourceViewDialog);
export default TimetableResourceViewDialog;
