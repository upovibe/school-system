import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Timetable Resource Update Dialog Component
 * 
 * A dialog component for updating existing timetable resources in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - resource-updated: Fired when a resource is successfully updated
 * - dialog-closed: Fired when dialog is closed
 */
class TimetableResourceUpdateDialog extends HTMLElement {
    constructor() {
        super();
        this.classes = [];
        this.resourceData = null;
        this.classesLoading = true;
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
        this.loadClasses();
        
        // Listen for when classes finish loading to set dropdown values
        this.addEventListener('classes-loaded', () => {
            if (this.resourceData && !this.classesLoading) {
                this.setClassDropdownValue();
            }
        });
    }

    setupEventListeners() {
        // Listen for button clicks
        this.addEventListener('click', (event) => {
            const button = event.target.closest('ui-button[data-action]');
            if (!button) return;
            
            const action = button.getAttribute('data-action');
            
            if (action === 'update') {
                this.updateResource();
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
    }

    // Set the resource data to edit
    setResourceData(resource) {
        this.resourceData = resource;
        // Re-render the modal with the new data
        this.render();
        
        // Set values after render using requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            // Set class dropdown value only after classes are loaded
            if (!this.classesLoading) {
                const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
                if (classDropdown && resource?.class_id) {
                    classDropdown.value = resource.class_id.toString();
                }
            }
            
            // Ensure file upload displays the existing file
            const fileUpload = this.querySelector('ui-file-upload[data-field="file"]');
            if (fileUpload && resource?.attachment_file) {
                const formattedPath = this.formatFilePath(resource.attachment_file);
                
                // Force set the value to ensure it displays
                if (fileUpload.setValue) {
                    fileUpload.setValue(formattedPath);
                }
                
                // Also try setting the value attribute again
                fileUpload.setAttribute('value', formattedPath);
            }
        });
    }

    // Set class dropdown value after classes are loaded
    setClassDropdownValue() {
        if (this.resourceData?.class_id && !this.classesLoading) {
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            if (classDropdown) {
                classDropdown.value = this.resourceData.class_id.toString();
            }
        }
    }

    // Format file path for display in file upload component
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

    // Load available classes for the dropdown
    async loadClasses() {
        try {
            this.classesLoading = true;
            this.render();
            
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/classes');
            this.classes = response.data.data || [];
            this.classesLoading = false;
            this.render();
            
            // Dispatch event that classes are loaded
            this.dispatchEvent(new CustomEvent('classes-loaded', {
                detail: { classes: this.classes }
            }));
        } catch (error) {
            console.error('❌ Error loading classes:', error);
            this.classesLoading = false;
            this.render();
        }
    }

    // Update the existing timetable resource
    async updateResource() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const classSearchDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            const fileUpload = this.querySelector('ui-file-upload[data-field="file"]');

            const resourceData = {
                title: titleInput ? titleInput.value : '',
                class_id: classSearchDropdown ? classSearchDropdown.value : ''
            };

            // Validate required fields
            if (!resourceData.title.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the resource title',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!resourceData.class_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a class',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update resources',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Prepare form data for file upload
            const formData = new FormData();
            
            // Add text fields
            Object.keys(resourceData).forEach(key => {
                formData.append(key, resourceData[key]);
            });
            


            // Add file only if a new one is uploaded
            if (fileUpload && fileUpload.getFiles && fileUpload.getFiles().length > 0) {
                const files = fileUpload.getFiles();
                // Check if there's a new file (not an existing one)
                const newFile = files.find(file => !file.isExisting);
                if (newFile) {
                    formData.append('file', newFile);
                }
            }

            // Update the resource
            const response = await api.withToken(token).put(`/timetable-resources/${this.resourceData.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            Toast.show({
                title: 'Success',
                message: 'Timetable resource updated successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('resource-updated', {
                detail: { resource: response.data.data },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error updating timetable resource:', error);
            
            // Get the actual error message from the API response
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update timetable resource';
            
            Toast.show({
                title: 'Error',
                message: errorMessage,
                variant: 'error',
                duration: 3000
            });
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
                        <i class="fas fa-edit text-blue-500 mr-2"></i>
                        <span class="font-semibold">Edit Timetable Resource</span>
                    </div>
                    <div slot="content" class="text-center py-8 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Loading resource data...</p>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                close-button="true">
                <div slot="header" class="flex items-center">
                    <i class="fas fa-edit text-blue-500 mr-2"></i>
                    <span class="font-semibold">Edit Timetable Resource</span>
                </div>
                
                <div slot="content" class="space-y-4">
                    <form id="resource-update-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Resource Title <span class="text-red-500">*</span></label>
                            <ui-input 
                                data-field="title"
                                type="text" 
                                placeholder="Enter resource title/description"
                                value="${resource?.title || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class <span class="text-red-500">*</span></label>
                            ${this.classesLoading ? `
                                <div class="w-full h-8 bg-gray-200 rounded-md animate-pulse"></div>
                            ` : `
                                <ui-search-dropdown 
                                    data-field="class_id"
                                    placeholder="Search and select a class"
                                    search-placeholder="Type to search classes..."
                                    value="${resource?.class_id || ''}"
                                    class="w-full">
                                    <ui-option value="">Select a class</ui-option>
                                    ${this.classes.map(
                                        (classItem) => `<ui-option value="${classItem.id}">${classItem.name} (${classItem.section})</ui-option>`
                                    ).join('')}
                                </ui-search-dropdown>
                            `}
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">File <span class="text-red-500">*</span></label>
                            <ui-file-upload 
                                data-field="file"
                                max-files="1"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                                value="${resource?.attachment_file ? this.formatFilePath(resource.attachment_file) : ''}"
                                class="w-full">
                            </ui-file-upload>
                            <p class="text-xs text-gray-500 mt-1">
                                Current file will be displayed above. Upload a new file to replace it.
                            </p>
                        </div>
                    </form>
                </div>
                
                <div slot="footer" class="flex justify-end gap-2">
                    <ui-button color="secondary" data-action="cancel">Cancel</ui-button>
                    <ui-button color="primary" data-action="update">Update Resource</ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('timetable-resource-update-dialog', TimetableResourceUpdateDialog);
export default TimetableResourceUpdateDialog;
