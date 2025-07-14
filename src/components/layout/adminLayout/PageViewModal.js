import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';

/**
 * Page View Modal Component
 * 
 * A simple modal component for viewing page details
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class PageViewModal extends HTMLElement {
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
        // Listen for confirm button click (Close)
        this.addEventListener('confirm', () => {
            this.close();
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
        this.pageData = null;
    }

    // Set page data for viewing
    setPageData(pageData) {
        this.pageData = pageData;
        // Re-render the modal with the new data
        this.render();
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Page Details</div>
                
                <div class="p-6 space-y-6">
                    ${this.pageData ? `
                        <!-- Page Title -->
                        <div class="border-b pb-4">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Page Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Title</label>
                                    <p class="text-gray-900 font-medium">${this.pageData.title || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Slug</label>
                                    <p class="text-gray-900 font-mono text-sm">${this.pageData.slug || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Page Details -->
                        <div class="border-b pb-4">
                            <h4 class="text-md font-semibold text-gray-800 mb-3">Details</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Category</label>
                                    <p class="text-gray-900">${this.pageData.category || 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Status</label>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.pageData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                        ${this.pageData.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Sort Order</label>
                                    <p class="text-gray-900">${this.pageData.sort_order || 0}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Banner Image</label>
                                    <p class="text-gray-900">${this.pageData.banner_image || 'No banner image'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- SEO Information -->
                        <div class="border-b pb-4">
                            <h4 class="text-md font-semibold text-gray-800 mb-3">SEO Information</h4>
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Meta Description</label>
                                    <p class="text-gray-900 text-sm">${this.pageData.meta_description || 'No meta description set'}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Meta Keywords</label>
                                    <p class="text-gray-900 text-sm">${this.pageData.meta_keywords || 'No meta keywords set'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Content Preview -->
                        <div>
                            <h4 class="text-md font-semibold text-gray-800 mb-3">Content Preview</h4>
                            <div class="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                                ${this.pageData.content ? `
                                    <div class="prose prose-sm max-w-none">
                                        ${this.pageData.content.substring(0, 300)}${this.pageData.content.length > 300 ? '...' : ''}
                                    </div>
                                ` : `
                                    <p class="text-gray-500 italic">No content available</p>
                                `}
                            </div>
                </div>
                
                        <!-- Timestamps -->
                        <div class="border-t pt-4">
                            <h4 class="text-md font-semibold text-gray-800 mb-3">Timestamps</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Created At</label>
                                    <p class="text-gray-900 text-sm">${this.pageData.created_at ? new Date(this.pageData.created_at).toLocaleString() : 'N/A'}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Updated At</label>
                                    <p class="text-gray-900 text-sm">${this.pageData.updated_at ? new Date(this.pageData.updated_at).toLocaleString() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No page data available</p>
                        </div>
                    `}
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('page-view-modal', PageViewModal);
export default PageViewModal; 