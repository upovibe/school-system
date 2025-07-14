import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
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
        this.isOpen = false;
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
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.removeAttribute('open');
        this.dispatchEvent(new CustomEvent('modal-closed'));
    }

    // Save the new page
    async savePage() {
        try {
            // Get form data
            const titleInput = this.querySelector('input[placeholder="Enter page title"]');
            const slugInput = this.querySelector('input[placeholder="Enter page slug"]');
            const categorySelect = this.querySelector('select');
            const statusRadio = this.querySelector('input[name="status"]:checked');
            const sortOrderInput = this.querySelector('input[type="number"]');

            const pageData = {
                title: titleInput.value,
                slug: slugInput.value,
                category: categorySelect.value,
                is_active: statusRadio.value === 'active',
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
                    message: 'Please log in to add pages',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Save the page
            const response = await api.withToken(token).post('/pages', pageData);
            
            Toast.show({
                title: 'Success',
                message: 'Page created successfully',
                variant: 'success',
                duration: 3000
            });

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('page-saved', {
                detail: { page: response.data }
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
                ${this.isOpen ? 'open' : ''} 
                position="right" 
                size="lg" 
                close-button>
                <div slot="title">Page Settings</div>
                <div class="p-4">
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Add New Page</h3>
                        <p class="text-gray-600">Create a new page for your website.</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter page title">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Slug</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter page slug">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Select category</option>
                                <option value="general">General</option>
                                <option value="about">About</option>
                                <option value="contact">Contact</option>
                                <option value="services">Services</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <div class="flex items-center space-x-4">
                                <label class="flex items-center">
                                    <input type="radio" name="status" value="active" class="mr-2" checked>
                                    <span class="text-sm">Active</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="status" value="inactive" class="mr-2">
                                    <span class="text-sm">Inactive</span>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                            <input type="number" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter sort order" value="0">
                        </div>
                    </div>
                </div>
                <div slot="footer" class="flex justify-end space-x-3">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" onclick="this.closest('page-settings-modal').close()">
                        Cancel
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" onclick="this.closest('page-settings-modal').savePage()">
                        Save Page
                    </button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('page-settings-modal', PageSettingsModal);
export default PageSettingsModal; 