import App from '@/core/App.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * News Delete Dialog Component
 * 
 * Dialog for confirming news deletion
 */
class NewsDeleteDialog extends App {
    constructor() {
        super();
        this.newsData = null;
        this.loading = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('dialog-close', () => {
            this.resetData();
        });
    }

    setNewsData(newsData) {
        this.set('newsData', newsData);
    }

    resetData() {
        this.set('newsData', null);
        this.set('loading', false);
    }

    async handleDelete() {
        try {
            this.set('loading', true);

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete news',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const newsData = this.get('newsData');
            if (!newsData || !newsData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No news data to delete',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete news
            const response = await api.withToken(token).delete(`/news/${newsData.id}`);

            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'News deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with deleted news ID
                this.dispatchEvent(new CustomEvent('news-deleted', {
                    detail: { newsId: newsData.id }
                }));

                // Close dialog
                const dialog = this.querySelector('ui-dialog');
                if (dialog) {
                    dialog.close();
                }
            }

        } catch (error) {
            console.error('❌ Error deleting news:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete news',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    render() {
        const newsData = this.get('newsData');
        const loading = this.get('loading');
        const open = this.hasAttribute('open');

        if (!newsData) {
            return `<ui-dialog ${open ? 'open' : ''}>
                <div slot="header">
                    <h3 class="text-lg font-semibold text-gray-900">Delete News Article</h3>
                </div>
                <div class="p-6 text-center text-gray-500">
                    No news data available
                </div>
            </ui-dialog>`;
        }

        return `
            <ui-dialog ${open ? 'open' : ''}>
                <div slot="header">
                    <h3 class="text-lg font-semibold text-gray-900">Delete News Article</h3>
                </div>

                <div class="p-6">
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-4">
                            Are you sure you want to delete this news article? This action cannot be undone.
                        </p>
                        
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 class="font-medium text-red-800 mb-2">News to be deleted:</h4>
                            <p class="text-red-700 font-semibold">${newsData.title}</p>
                            ${newsData.slug ? `<p class="text-red-600 text-sm mt-1">Slug: ${newsData.slug}</p>` : ''}
                        </div>
                    </div>

                    <div class="text-sm text-gray-500">
                        <p><strong>Warning:</strong> This will permanently delete:</p>
                        <ul class="list-disc list-inside mt-2 space-y-1">
                            <li>The news article and all its content</li>
                            <li>Associated banner image (if any)</li>
                            <li>All related data and metadata</li>
                        </ul>
                    </div>
                </div>

                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button
                        variant="outline"
                        @click="${() => {
                            const dialog = this.querySelector('ui-dialog');
                            if (dialog) dialog.close();
                        }}"
                        disabled="${loading}"
                    >
                        Cancel
                    </ui-button>
                    <ui-button
                        variant="danger"
                        @click="${this.handleDelete.bind(this)}"
                        loading="${loading}"
                        disabled="${loading}"
                    >
                        ${loading ? 'Deleting...' : 'Delete News'}
                    </ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('news-delete-dialog', NewsDeleteDialog);
export default NewsDeleteDialog; 