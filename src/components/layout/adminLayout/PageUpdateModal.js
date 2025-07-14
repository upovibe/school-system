import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/RadioGroup.js';
import '@/components/ui/Wysiwyg.js';
import api from '@/services/api.js';

/**
 * Page Update Modal Component
 * 
 * A modal component for editing existing pages in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - page-updated: Fired when a page is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class PageUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.pageData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update Page)
        this.addEventListener('confirm', () => {
            this.updatePage();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    // Set page data for editing
    setPageData(pageData) {
        this.pageData = pageData;
        // Re-render the modal with the new data
        this.render();
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }



    // Update the page
    async updatePage() {
        try {
            // Get form data using normal HTML inputs
            const form = this.querySelector('#page-update-form');
            const formData = new FormData(form);
            
            // Get WYSIWYG content separately
            const contentWysiwyg = this.querySelector('ui-wysiwyg[data-field="content"]');
            
            // Get dropdown value separately
            const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
            
            // Get radio group value separately
            const statusRadioGroup = this.querySelector('ui-radio-group[name="status"]');
            
            // Get textarea value separately
            const metaDescriptionTextarea = this.querySelector('ui-textarea[name="meta-description"]');

            const pageData = {
                title: formData.get('title'),
                slug: formData.get('slug'),
                category: categoryDropdown ? categoryDropdown.value : '',
                content: contentWysiwyg ? contentWysiwyg.value : '',
                meta_description: metaDescriptionTextarea ? metaDescriptionTextarea.value : '',
                meta_keywords: formData.get('meta-keywords'),
                banner_image: formData.get('banner-image'),
                is_active: statusRadioGroup ? statusRadioGroup.value === 'active' : false,
                sort_order: parseInt(formData.get('sort-order')) || 0
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
                    message: 'Please log in to update pages',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Update the page
            const response = await api.withToken(token).put(`/pages/${this.pageData.id}`, pageData);
            
            Toast.show({
                title: 'Success',
                message: 'Page updated successfully',
                variant: 'success',
                duration: 3000
            });

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('page-updated', {
                detail: { page: response.data }
            }));

        } catch (error) {
            console.error('❌ Error updating page:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update page',
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
                <div slot="title">Page Update</div>
                    <form id="page-update-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                            <ui-input 
                                name="title"
                                type="text" 
                                placeholder="Enter page title"
                                value="${this.pageData?.title || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Slug</label>
                            <ui-input 
                                name="slug"
                                type="text" 
                                placeholder="Enter page slug"
                                value="${this.pageData?.slug || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <ui-dropdown 
                                data-field="category"
                                placeholder="Select category"
                                value="${this.pageData?.category || ''}"
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
                                value="${this.pageData?.content || ''}"
                                class="w-full">
                            </ui-wysiwyg>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                            <ui-textarea 
                                name="meta-description"
                                placeholder="Enter meta description for SEO"
                                value="${this.pageData?.meta_description || ''}"
                                rows="3"
                                class="w-full">
                            </ui-textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                            <ui-input 
                                name="meta-keywords"
                                type="text" 
                                placeholder="Enter meta keywords (comma separated)"
                                value="${this.pageData?.meta_keywords || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                            <ui-input 
                                name="banner-image"
                                type="text" 
                                placeholder="Enter banner image URL"
                                value="${this.pageData?.banner_image || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-radio-group 
                                name="status"
                                value="${this.pageData?.is_active ? 'active' : 'inactive'}"
                                layout="horizontal"
                                class="w-full">
                                <ui-radio-option value="active" label="Active"></ui-radio-option>
                                <ui-radio-option value="inactive" label="Inactive"></ui-radio-option>
                            </ui-radio-group>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                            <ui-input 
                                name="sort-order"
                                type="number" 
                                placeholder="Enter sort order" 
                                value="${this.pageData?.sort_order || 0}"
                                class="w-full">
                            </ui-input>
                        </div>
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('page-update-modal', PageUpdateModal);
export default PageUpdateModal; 