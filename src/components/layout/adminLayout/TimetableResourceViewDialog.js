import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
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

            // Create a temporary link to download the file
            const fileUrl = this.formatFilePath(this.resourceData.attachment_file);
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = this.resourceData.attachment_file.split('/').pop() || 'download';
            link.target = '_blank';
            
            // Add authorization header if needed
            if (fileUrl.includes('/api/')) {
                // For API files, we might need to handle authentication differently
                // For now, let's try direct download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // For direct file URLs
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

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
                
                <div slot="content" class="space-y-6">
                    <!-- Resource Title -->
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-blue-900 mb-2">${resource.title || 'Untitled Resource'}</h3>
                        <p class="text-blue-700 text-sm">Resource title and description</p>
                    </div>
                    
                    <!-- Class Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-medium text-gray-900 mb-2">Class Information</h4>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Class:</span>
                                    <span class="font-medium">${resource.class_name || 'Unknown'} (${resource.class_section || 'Unknown'})</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Class ID:</span>
                                    <span class="font-mono text-sm">${resource.class_id || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-medium text-gray-900 mb-2">Creator Information</h4>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Created By:</span>
                                    <span class="font-medium">${resource.creator_name || 'Unknown'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Creator ID:</span>
                                    <span class="font-mono text-sm">${resource.created_by || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- File Information -->
                    <div class="bg-green-50 rounded-lg p-4">
                        <h4 class="font-medium text-green-900 mb-3">File Information</h4>
                        <div class="flex items-center space-x-3">
                            <div class="text-3xl">${fileIcon}</div>
                            <div class="flex-1">
                                <div class="font-medium text-green-900">${fileName}</div>
                                <div class="text-sm text-green-700">File attached to this resource</div>
                            </div>
                            ${resource.attachment_file ? `
                                <ui-button 
                                    color="primary" 
                                    size="sm" 
                                    data-action="download"
                                    title="Download this file">
                                    <i class="fas fa-download mr-1"></i>
                                    Download
                                </ui-button>
                            ` : ''}
                        </div>
                        ${resource.attachment_file ? `
                            <div class="mt-3 text-xs text-green-600">
                                <strong>File Path:</strong> ${resource.attachment_file}
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Timestamps -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-medium text-gray-900 mb-2">Created</h4>
                            <div class="text-gray-700">${this.formatDate(resource.created_at)}</div>
                        </div>
                        
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-medium text-gray-900 mb-2">Last Updated</h4>
                            <div class="text-gray-700">${this.formatDate(resource.updated_at)}</div>
                        </div>
                    </div>
                    
                    <!-- Resource ID -->
                    <div class="bg-gray-100 rounded-lg p-3">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Resource ID:</span>
                            <span class="font-mono text-sm bg-white px-2 py-1 rounded">${resource.id}</span>
                        </div>
                    </div>
                </div>
                
                <div slot="footer" class="flex justify-end gap-2">
                    <ui-button color="secondary" data-action="close">Close</ui-button>
                    ${resource.attachment_file ? `
                        <ui-button color="primary" data-action="download">
                            <i class="fas fa-download mr-1"></i>
                            Download File
                        </ui-button>
                    ` : ''}
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('timetable-resource-view-dialog', TimetableResourceViewDialog);
export default TimetableResourceViewDialog;
