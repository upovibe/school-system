import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';

// Load Quill CSS for content preview
if (!document.querySelector('link[href*="quill"]')) {
    const link = document.createElement('link');
    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

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

    // Helper method to get proper image URL
    getImageUrl(imagePath) {
        if (!imagePath) return null;
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        
        // If it's a relative path without /, construct the URL
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
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
                                    <div class="relative">
                                        <img src="${this.getImageUrl(this.pageData.banner_image)}" 
                                             alt="Banner Image" 
                                             class="w-full h-48 object-cover rounded-lg border border-gray-200"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                        <div class="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                            <div class="text-center">
                                                <i class="fas fa-image text-gray-400 text-2xl mb-2"></i>
                                                <p class="text-gray-500 text-sm">Image not found</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex justify-end">
                                        <button onclick="window.open('${this.getImageUrl(this.pageData.banner_image)}', '_blank')" 
                                                class="text-blue-500 hover:text-blue-700 text-xs">
                                            <i class="fas fa-external-link-alt mr-1"></i>Open
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <i class="fas fa-image text-gray-400 text-3xl mb-2"></i>
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
                        <div class="border-b pb-4">
                            <h4 class="text-md font-semibold text-gray-800 mb-3">Content Preview</h4>
                            <div class="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                                ${this.pageData.content ? `
                                    <div class="content-preview">
                                        ${this.pageData.content}
                                    </div>
                                ` : `
                                    <p class="text-gray-500 italic">No content available</p>
                                `}
                            </div>
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
                                    <span class="text-gray-900 text-sm">${this.pageData.created_at ? new Date(this.pageData.created_at).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.pageData.updated_at ? new Date(this.pageData.updated_at).toLocaleString() : 'N/A'}</span>
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