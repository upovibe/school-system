import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/NewsSettingsModal.js';
import '@/components/layout/adminLayout/NewsUpdateModal.js';
import '@/components/layout/adminLayout/NewsViewModal.js';
import '@/components/layout/adminLayout/NewsDeleteDialog.js';
import api from '@/services/api.js';

/**
 * News Management Page
 * 
 * Displays news data using Table component
 */
class NewsPage extends App {
    constructor() {
        super();
        this.news = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateNewsData = null;
        this.viewNewsData = null;
        this.deleteNewsData = null;
        
        // Initialize state properly
        this.set('news', null);
        this.set('loading', false);
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateNewsData', null);
        this.set('viewNewsData', null);
        this.set('deleteNewsData', null);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'News Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('news-deleted', (event) => {
            // Remove the deleted news from the current data
            const deletedNewsId = event.detail.newsId;
            const currentNews = this.get('news') || [];
            const updatedNews = currentNews.filter(news => news.id !== deletedNewsId);
            this.set('news', updatedNews);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('news-saved', (event) => {
            // Add the new news to the existing data
            const newNews = event.detail.news;
            if (newNews) {
                const currentNews = this.get('news') || [];
                this.set('news', [...currentNews, newNews]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('news-updated', (event) => {
            // Update the existing news in the data
            const updatedNews = event.detail.news;
            if (updatedNews) {
                const currentNews = this.get('news') || [];
                const updatedNewsList = currentNews.map(news => 
                    news.id === updatedNews.id ? updatedNews : news
                );
                this.set('news', updatedNewsList);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
        
        // Listen for modal opened event to pass data
        this.addEventListener('modal-opened', (event) => {
            const modal = event.target;
            if (modal.tagName === 'NEWS-UPDATE-MODAL') {
                const updateNewsData = this.get('updateNewsData');
                if (updateNewsData) {
                    modal.setNewsData(updateNewsData);
                }
            } else if (modal.tagName === 'NEWS-VIEW-MODAL') {
                const viewNewsData = this.get('viewNewsData');
                if (viewNewsData) {
                    modal.setNewsData(viewNewsData);
                }
            }
        });
    }

    async loadData() {
        try {
            this.set('loading', true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view data',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Load news data
            const newsResponse = await api.withToken(token).get('/news');
            
            this.set('news', newsResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load news data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewNews = this.get('news').find(news => news.id === detail.row.id);
        if (viewNews) {
            this.closeAllModals();
            this.set('viewNewsData', viewNews);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('news-view-modal');
                if (viewModal) {
                    viewModal.setNewsData(viewNews);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editNews = this.get('news').find(news => news.id === detail.row.id);
        if (editNews) {
            this.closeAllModals();
            this.set('updateNewsData', editNews);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('news-update-modal');
                if (updateModal) {
                    updateModal.setNewsData(editNews);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteNews = this.get('news').find(news => news.id === detail.row.id);
        if (deleteNews) {
            this.closeAllModals();
            this.set('deleteNewsData', deleteNews);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('news-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setNewsData(deleteNews);
                }
            }, 0);
        }
    }

    onAdd(event) {
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onRefresh(event) {
        this.loadData();
    }

    // Update table data without full page reload
    updateTableData() {
        const news = this.get('news');
        if (!news) return;

        // Prepare table data
        const tableData = news.map((newsItem, index) => ({
            id: newsItem.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            title: newsItem.title,
            slug: newsItem.slug,
            status: newsItem.is_active ? 'Active' : 'Inactive',
            created: new Date(newsItem.created_at).toLocaleString(),
            updated: new Date(newsItem.updated_at).toLocaleString(),
        }));

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    // Close all modals and dialogs
    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateNewsData', null);
        this.set('viewNewsData', null);
        this.set('deleteNewsData', null);
    }

    render() {
        const news = this.get('news');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        

        
        const tableData = news ? news.map((newsItem, index) => ({
            id: newsItem.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            title: newsItem.title,
            slug: newsItem.slug,
            status: newsItem.is_active ? 'Active' : 'Inactive',
            created: new Date(newsItem.created_at).toLocaleString(),
            updated: new Date(newsItem.updated_at).toLocaleString(),
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'title', label: 'Title' },
            { key: 'slug', label: 'Slug' },
            { key: 'status', label: 'Status' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- News Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="News Management"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search news..."
                            pagination
                            page-size="10"
                            action
                            addable
                            refresh
                            print
                            bordered
                            striped
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>
            
            <!-- Modals and Dialogs -->
            <news-settings-modal ${showAddModal ? 'open' : ''}></news-settings-modal>
            <news-update-modal ${showUpdateModal ? 'open' : ''}></news-update-modal>
            <news-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></news-view-modal>
            <news-delete-dialog ${showDeleteDialog ? 'open' : ''}></news-delete-dialog>
        `;
    }
}

customElements.define('app-news-page', NewsPage);
export default NewsPage; 