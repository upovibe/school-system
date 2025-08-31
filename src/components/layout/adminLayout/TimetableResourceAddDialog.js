import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Timetable Resource Add Dialog Component
 * 
 * A dialog component for adding new timetable resources in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - resource-saved: Fired when a resource is successfully saved
 * - dialog-closed: Fired when dialog is closed
 */
class TimetableResourceAddDialog extends HTMLElement {
    constructor() {
        super();
        this.classes = [];
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadClasses();
    }

    setupEventListeners() {
        // Listen for button clicks
        this.addEventListener('click', (event) => {
            const button = event.target.closest('ui-button[data-action]');
            if (!button) return;
            
            const action = button.getAttribute('data-action');
            
            if (action === 'save') {
                this.saveResource();
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

    // Load available classes for the dropdown
    async loadClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/classes');
            this.classes = response.data.data || [];
            // Re-render to update the dropdown with classes
            this.render();
        } catch (error) {
            console.error('❌ Error loading classes:', error);
        }
    }



    // Save the new timetable resource
    async saveResource() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const classSearchDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            const fileUpload = this.querySelector('ui-file-upload[data-field="file"]');

            const resourceData = {
                title: titleInput ? titleInput.value : '',
                class_id: classSearchDropdown ? classSearchDropdown.value : ''
            };

            // console.log('Resource data being sent:', resourceData); // Debug log

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

            // Check if file is uploaded
            if (!fileUpload || !fileUpload.getFiles || fileUpload.getFiles().length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please upload a file',
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
                    message: 'Please log in to add resources',
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

            // Add file
            const file = fileUpload.getFiles()[0];
            formData.append('file', file);

            // Create the resource
            const response = await api.withToken(token).post('/timetable-resources', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('✅ Timetable resource created successfully:', response.data);

            Toast.show({
                title: 'Success',
                message: 'Timetable resource created successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('resource-saved', {
                detail: { resource: response.data.data },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error creating timetable resource:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create timetable resource',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                close-button="true">
                <div slot="header" class="flex items-center">
                    <i class="fas fa-file-alt text-blue-500 mr-2"></i>
                    <span class="font-semibold">Add Timetable Resource</span>
                </div>
                
                <div slot="content" class="space-y-4">
                    <form id="resource-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Resource Title</label>
                            <ui-input 
                                data-field="title"
                                type="text" 
                                placeholder="Enter resource title/description"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <ui-search-dropdown 
                                data-field="class_id"
                                placeholder="Search and select a class"
                                search-placeholder="Type to search classes..."
                                class="w-full">
                                <ui-option value="">Select a class</ui-option>
                                ${this.classes.map(
                                    (classItem) => `<ui-option value="${classItem.id}">${classItem.name} (${classItem.section})</ui-option>`
                                ).join('')}
                            </ui-search-dropdown>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">File</label>
                            <ui-file-upload 
                                data-field="file"
                                max-files="1"
                                class="w-full">
                            </ui-file-upload>
                        </div>
                    </form>
                </div>
                
                <div slot="footer" class="flex justify-end gap-2">
                    <ui-button color="secondary" data-action="cancel">Cancel</ui-button>
                    <ui-button color="primary" data-action="save">Save Resource</ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('timetable-resource-add-dialog', TimetableResourceAddDialog);
export default TimetableResourceAddDialog;
