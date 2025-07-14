import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';

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
                
                <div>
                    ${this.pageData ? `
                                                 <!-- Page Title -->
                         <div class="flex items-center gap-3 border-b pb-4">
                                 <h3 class="text-xl font-semibold text-gray-900">${this.pageData.title || 'N/A'}</h3>
                                 <ui-badge color="secondary"><i class="fas fa-tag mr-1"></i>${this.pageData.category || 'N/A'}</ui-badge>
                                 <ui-badge color="${this.pageData.is_active ? 'success' : 'error'}">
                                    ${this.pageData.is_active ? '<i class="fas fa-check mr-1"></i> Active' : '<i class="fas fa-times mr-1"></i> Inactive'}
                                     </ui-badge>
                             </div>

                        <!-- Banner Image Preview -->
                        <div class="border-b pb-4">
                            ${this.pageData.banner_image ? `
                                <div class="space-y-2">
                                    <img src="${this.pageData.banner_image}" 
                                         alt="Banner Image" 
                                         class="w-full h-32 object-cover rounded-lg border border-gray-200"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                    <div class="hidden text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                        <p class="text-gray-500 text-sm">Image failed to load</p>
                                    </div>
                                    <p class="text-xs text-gray-500 break-all">${this.pageData.banner_image}</p>
                                </div>
                            ` : `
                                <div class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <p class="text-gray-500">No banner image set</p>
                                </div>
                            `}
                        </div>

                        <!-- SEO Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-search text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">SEO Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-align-left mr-1"></i>Meta Description
                                    </label>
                                    <p class="text-gray-900 text-sm leading-relaxed">${this.pageData.meta_description || 'No meta description set'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-tags mr-1"></i>Meta Keywords
                                    </label>
                                    <p class="text-gray-900 text-sm leading-relaxed">${this.pageData.meta_keywords || 'No meta keywords set'}</p>
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