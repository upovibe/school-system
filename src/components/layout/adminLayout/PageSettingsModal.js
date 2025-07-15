import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/RadioGroup.js';
import '@/components/ui/Wysiwyg.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Page Settings Modal Component
 * 
 * A modal component for adding new pages in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - page-saved: Fired when a page is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class PageSettingsModal extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save Page)
        this.addEventListener('confirm', () => {
            this.savePage();
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

    // Save the new page
    async savePage() {
        try {
            // Get form data using the new UI components - query by order since some components might not be fully initialized
            const allInputs = this.querySelectorAll('ui-input');
            const titleInput = allInputs[0]; // First input
            const slugInput = allInputs[1]; // Second input
            const metaKeywordsInput = allInputs[2]; // Third input
            const sortOrderInput = allInputs[3]; // Fourth input (banner input removed)
            
            const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
            const contentWysiwyg = this.querySelector('ui-wysiwyg[data-field="content"]');
            const metaDescriptionTextarea = this.querySelector('ui-textarea[data-field="meta-description"]');
            const statusRadioGroup = this.querySelector('ui-radio-group[data-field="status"]');
            const bannerFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');

            const pageData = {
                title: titleInput ? titleInput.value : '',
                slug: slugInput ? slugInput.value : '',
                category: categoryDropdown ? categoryDropdown.value : '',
                content: contentWysiwyg ? contentWysiwyg.value : '',
                meta_description: metaDescriptionTextarea ? metaDescriptionTextarea.value : '',
                meta_keywords: metaKeywordsInput ? metaKeywordsInput.value : '',
                is_active: statusRadioGroup ? (statusRadioGroup.value === 'active' ? 1 : 0) : 0,
                sort_order: sortOrderInput ? parseInt(sortOrderInput.value) || 0 : 0
            };

            // Validate required fields
            if (!pageData.title || !pageData.slug) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in all required fields',
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
                    message: 'Please log in to add pages',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Prepare form data for multipart request
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(pageData).forEach(key => {
                formData.append(key, pageData[key]);
            });
            
            // Add banner file if selected
            if (bannerFileUpload && bannerFileUpload.getFiles().length > 0) {
                const file = bannerFileUpload.getFiles()[0];
                formData.append('banner', file);
            }

            // Create the page with multipart data
            const response = await api.withToken(token).post('/pages', formData);
            
            Toast.show({
                title: 'Success',
                message: 'Page created successfully',
                variant: 'success',
                duration: 3000
            });

            // Construct the new page data from response
            const newPage = {
                id: response.data.data?.id || response.data.id,
                title: pageData.title,
                slug: pageData.slug,
                category: pageData.category,
                content: pageData.content,
                meta_description: pageData.meta_description,
                meta_keywords: pageData.meta_keywords,
                banner_image: response.data.data?.banner_image || null,
                is_active: pageData.is_active,
                sort_order: pageData.sort_order,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('page-saved', {
                detail: { page: newPage },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error saving page:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create page',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Page Settings</div>
                    <form id="page-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                            <ui-input 
                                data-field="title"
                                type="text" 
                                placeholder="Enter page title"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Slug</label>
                            <ui-input 
                                data-field="slug"
                                type="text" 
                                placeholder="Enter page slug"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <ui-dropdown 
                                data-field="category"
                                placeholder="Select category"
                                class="w-full">
                                <ui-option value="general">General</ui-option>
                                <ui-option value="about">About</ui-option>
                                <ui-option value="contact">Contact</ui-option>
                                <ui-option value="academics">Academics</ui-option>
                                <ui-option value="services">Services</ui-option>
                            </ui-dropdown>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Content</label>
                            <ui-wysiwyg 
                                data-field="content"
                                placeholder="Enter page content..."
                                height="200px"
                                toolbar="full"
                                class="w-full">
                            </ui-wysiwyg>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                            <ui-textarea 
                                data-field="meta-description"
                                placeholder="Enter meta description for SEO"
                                rows="2"
                                class="w-full">
                            </ui-textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                            <ui-input 
                                data-field="meta-keywords"
                                type="text" 
                                placeholder="Enter meta keywords (comma separated)"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                            <ui-file-upload 
                                data-field="banner"
                                accept="image/*"
                                max-size="5242880"
                                max-files="1"
                                class="w-full">
                            </ui-file-upload>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-radio-group 
                                data-field="status"
                                name="status" 
                                value="active"
                                layout="horizontal">
                                <ui-radio-option value="active" label="Active"></ui-radio-option>
                                <ui-radio-option value="inactive" label="Inactive"></ui-radio-option>
                            </ui-radio-group>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                            <ui-input 
                                data-field="sort-order"
                                type="number" 
                                placeholder="Enter sort order" 
                                value="0"
                                class="w-full">
                            </ui-input>
                        </div>
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('page-settings-modal', PageSettingsModal);
export default PageSettingsModal; 