import App from '@/core/App.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Badge.js';

/**
 * News View Modal Component
 * 
 * Modal for viewing news article details
 */
class NewsViewModal extends App {
    constructor() {
        super();
        this.newsData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('modal-close', () => {
            this.resetData();
        });
    }

    setNewsData(newsData) {
        this.set('newsData', newsData);
    }

    resetData() {
        this.set('newsData', null);
    }

    getImageUrl(imagePath) {
        if (!imagePath) return '';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    }

    render() {
        const newsData = this.get('newsData');
        const open = this.hasAttribute('open');

        if (!newsData) {
            return `<ui-modal ${open ? 'open' : ''} size="lg">
                <div slot="header">
                    <h2 class="text-lg font-semibold text-gray-900">View News Article</h2>
                </div>
                <div class="p-6 text-center text-gray-500">
                    No news data available
                </div>
            </ui-modal>`;
        }

        return `
            <ui-modal ${open ? 'open' : ''} size="lg">
                <div slot="header" class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-gray-900">View News Article</h2>
                </div>

                <div class="space-y-6">
                    <!-- Banner Image -->
                    ${newsData.banner_image ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Banner Image
                            </label>
                            <img 
                                src="${this.getImageUrl(newsData.banner_image)}" 
                                alt="News banner" 
                                class="w-full h-48 object-cover rounded-lg border"
                            >
                        </div>
                    ` : ''}

                    <!-- Title -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Title
                        </label>
                        <p class="text-lg font-semibold text-gray-900">${newsData.title || 'N/A'}</p>
                    </div>

                    <!-- Slug -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Slug
                        </label>
                        <p class="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">${newsData.slug || 'N/A'}</p>
                    </div>

                    <!-- Status -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <ui-badge variant="${newsData.is_active ? 'success' : 'secondary'}">
                            ${newsData.is_active ? 'Active' : 'Inactive'}
                        </ui-badge>
                    </div>

                    <!-- Content -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Content
                        </label>
                        <div class="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg border">
                            ${newsData.content || 'No content available'}
                        </div>
                    </div>

                    <!-- Timestamps -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Created At
                            </label>
                            <p class="text-sm text-gray-600">${this.formatDate(newsData.created_at)}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Updated At
                            </label>
                            <p class="text-sm text-gray-600">${this.formatDate(newsData.updated_at)}</p>
                        </div>
                    </div>
                </div>

                <div slot="footer" class="flex justify-end">
                    <ui-button
                        variant="outline"
                        @click="${() => {
                            const modal = this.querySelector('ui-modal');
                            if (modal) modal.close();
                        }}"
                    >
                        Close
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('news-view-modal', NewsViewModal);
export default NewsViewModal; 