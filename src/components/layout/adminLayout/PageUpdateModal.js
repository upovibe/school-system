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
        this.isOpen = false;
        this.pageData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.updateOpenState();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && name === 'open') {
            this.updateOpenState();
        }
    }

    setupEventListeners() {
        // Listen for modal close events
        this.addEventListener('modal-close', () => {
            this.close();
        });
    }

    updateOpenState() {
        const shouldBeOpen = this.hasAttribute('open');
        
        if (shouldBeOpen && !this.isOpen) {
            this.open();
        } else if (!shouldBeOpen && this.isOpen) {
            this.close();
        }
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.setAttribute('open', '');
        this.dispatchEvent(new CustomEvent('modal-opened'));
        
        // Populate form if page data is available
        if (this.pageData) {
            this.populateForm();
        }
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.removeAttribute('open');
        this.pageData = null;
        this.dispatchEvent(new CustomEvent('modal-closed'));
    }

    // Set page data for editing
    setPageData(pageData) {
        this.pageData = pageData;
        if (this.isOpen) {
            this.populateForm();
        }
    }

    // Populate form with existing data
    populateForm() {
        if (this.pageData) {
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const slugInput = this.querySelector('ui-input[data-field="slug"]');
            const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
            const contentWysiwyg = this.querySelector('ui-wysiwyg[data-field="content"]');
            const metaDescriptionTextarea = this.querySelector('ui-textarea[data-field="meta-description"]');
            const metaKeywordsInput = this.querySelector('ui-input[data-field="meta-keywords"]');
            const bannerImageInput = this.querySelector('ui-input[data-field="banner-image"]');
            const statusRadioGroup = this.querySelector('ui-radio-group[data-field="status"]');
            const sortOrderInput = this.querySelector('ui-input[data-field="sort-order"]');

            console.log('🔧 Populating update form with data:', this.pageData);

            // Set input values using setValue method with delay to ensure initialization
            setTimeout(() => {
                if (titleInput) {
                    titleInput.setValue(this.pageData.title || '');
                    console.log('🔧 Set title:', this.pageData.title);
                }
                if (slugInput) {
                    slugInput.setValue(this.pageData.slug || '');
                    console.log('🔧 Set slug:', this.pageData.slug);
                }
                if (metaKeywordsInput) {
                    metaKeywordsInput.setValue(this.pageData.meta_keywords || '');
                    console.log('🔧 Set meta keywords:', this.pageData.meta_keywords);
                }
                if (bannerImageInput) {
                    bannerImageInput.setValue(this.pageData.banner_image || '');
                    console.log('🔧 Set banner image:', this.pageData.banner_image);
                }
                if (sortOrderInput) {
                    sortOrderInput.setValue(this.pageData.sort_order || 0);
                    console.log('🔧 Set sort order:', this.pageData.sort_order);
                }
            }, 200);

            // Set textarea values
            if (metaDescriptionTextarea) {
                metaDescriptionTextarea.setValue(this.pageData.meta_description || '');
                console.log('🔧 Set meta description:', this.pageData.meta_description);
            }

            // Set dropdown value
            if (categoryDropdown) {
                categoryDropdown.value = this.pageData.category || '';
                console.log('🔧 Set category:', this.pageData.category);
            }

            // Set radio group value
            if (statusRadioGroup) {
                statusRadioGroup.value = this.pageData.is_active ? 'active' : 'inactive';
                console.log('🔧 Set status:', this.pageData.is_active ? 'active' : 'inactive');
            }

            // Set WYSIWYG content
            if (contentWysiwyg) {
                contentWysiwyg.value = this.pageData.content || '';
                console.log('🔧 Set content:', this.pageData.content);
            }
        }
    }

    // Update the page
    async updatePage() {
        try {
            // Get form data using the new UI components
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const slugInput = this.querySelector('ui-input[data-field="slug"]');
            const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
            const contentWysiwyg = this.querySelector('ui-wysiwyg[data-field="content"]');
            const metaDescriptionTextarea = this.querySelector('ui-textarea[data-field="meta-description"]');
            const metaKeywordsInput = this.querySelector('ui-input[data-field="meta-keywords"]');
            const bannerImageInput = this.querySelector('ui-input[data-field="banner-image"]');
            const statusRadioGroup = this.querySelector('ui-radio-group[data-field="status"]');
            const sortOrderInput = this.querySelector('ui-input[data-field="sort-order"]');

            const pageData = {
                title: titleInput.value,
                slug: slugInput.value,
                category: categoryDropdown.value,
                content: contentWysiwyg.value,
                meta_description: metaDescriptionTextarea.value,
                meta_keywords: metaKeywordsInput.value,
                banner_image: bannerImageInput.value,
                is_active: statusRadioGroup.value === 'active',
                sort_order: parseInt(sortOrderInput.value) || 0
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
                ${this.isOpen ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Page Update</div>
                <div class="mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Edit Page</h3>
                        <p class="text-gray-600">Update the page information.</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                            <ui-input 
                                data-field="title"
                                type="text" 
                                placeholder="Enter page title"
                                value="${this.pageData?.title || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Slug</label>
                            <ui-input 
                                data-field="slug"
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
                                value="${this.pageData?.meta_description || ''}"
                                class="w-full">
                            </ui-textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                            <ui-input 
                                data-field="meta-keywords"
                                type="text" 
                                placeholder="Enter meta keywords (comma separated)"
                                value="${this.pageData?.meta_keywords || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                            <ui-input 
                                data-field="banner-image"
                                type="text" 
                                placeholder="Enter banner image URL"
                                value="${this.pageData?.banner_image || ''}"
                                class="w-full">
                            </ui-input>
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
                                value="${this.pageData?.sort_order || 0}"
                                class="w-full">
                            </ui-input>
                        </div>
                    </div>
                <div slot="footer" class="flex justify-end space-x-3">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" onclick="this.closest('page-update-modal').close()">
                        Cancel
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" onclick="this.closest('page-update-modal').updatePage()">
                        Update Page
                    </button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('page-update-modal', PageUpdateModal);
export default PageUpdateModal; 