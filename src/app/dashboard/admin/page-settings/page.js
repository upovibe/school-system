import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/PageSettingsModal.js';
import '@/components/layout/adminLayout/PageUpdateModal.js';
import '@/components/layout/adminLayout/PageViewModal.js';
import api from '@/services/api.js';

/**
 * Page Settings Page
 * 
 * Displays pages data using Table component
 */
class PageSettingsPage extends App {
    constructor() {
        super();
        this.pages = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updatePageData = null;
        this.viewPageData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Page Settings | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.handleTableEvent.bind(this));
        this.addEventListener('table-edit', this.handleTableEvent.bind(this));
        this.addEventListener('table-delete', this.handleTableEvent.bind(this));
        this.addEventListener('table-add', this.handleTableEvent.bind(this));
        this.addEventListener('table-refresh', this.handleTableEvent.bind(this));
        
        // Add modal event listeners
        this.addEventListener('modal-closed', () => {
            this.closeAddModal();
            this.closeUpdateModal();
            this.closeViewModal();
        });
        
        this.addEventListener('page-saved', () => {
            this.closeAddModal();
            this.loadData();
        });
        
        this.addEventListener('page-updated', () => {
            this.closeUpdateModal();
            this.loadData();
        });
        
        // Listen for modal opened event to pass data
        this.addEventListener('modal-opened', (event) => {
            const modal = event.target;
            if (modal.tagName === 'PAGE-UPDATE-MODAL') {
                const updatePageData = this.get('updatePageData');
                if (updatePageData) {
                    modal.setPageData(updatePageData);
                }
            } else if (modal.tagName === 'PAGE-VIEW-MODAL') {
                const viewPageData = this.get('viewPageData');
                if (viewPageData) {
                    modal.setPageData(viewPageData);
                }
            }
        });
    }

    async loadData() {
        try {
            this.set('loading', true);
            
            // Get the auth token
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

            // Load pages data
            const pagesResponse = await api.withToken(token).get('/pages');
            
            this.set('pages', pagesResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load pages data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Handle table events
    handleTableEvent(event) {
        const { type, detail } = event;
        
        switch (type) {
            case 'table-view':
                // Find the original page data from the pages array
                const viewPage = this.get('pages').find(page => page.id === detail.row.id);
                if (viewPage) {
                    // Close other modals first
                    this.set('showAddModal', false);
                    this.set('showUpdateModal', false);
                    this.set('viewPageData', viewPage);
                    this.set('showViewModal', true);
                } else {
                    console.error('❌ Could not find page data for viewing:', detail.row);
                }
                break;
                
            case 'table-edit':
                // Find the original page data from the pages array
                const originalPage = this.get('pages').find(page => page.id === detail.row.id);
                if (originalPage) {
                    // Make sure add modal is closed first
                    this.set('showAddModal', false);
                    this.set('updatePageData', originalPage);
                    this.set('showUpdateModal', true);
                } else {
                    console.error('❌ Could not find page data for updating:', detail.row);
                }
                break;
                
            case 'table-delete':
                Toast.show({
                    title: 'Delete Page',
                    message: `Deleting: ${detail.row.title}`,
                    variant: 'warning',
                    duration: 2000
                });
                break;
                
            case 'table-add':
                // Make sure update modal is closed first
                this.set('showUpdateModal', false);
                this.set('updatePageData', null);
                this.set('showAddModal', true);
                break;
                
            case 'table-refresh':
                this.loadData();
                break;
        }
    }

    render() {
        const pages = this.get('pages');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        
        // Prepare table data and columns for pages
        const tableData = pages ? pages.map(page => ({
            id: page.id,
            title: page.title,
            slug: page.slug,
            category: page.category,
            status: page.is_active ? 'Active' : 'Inactive',
            sort_order: page.sort_order,
            created: page.created_at,
            updated: page.updated_at,
            banner: page.banner_image || 'No banner'
        })) : [];

        const tableColumns = [
            { key: 'id', label: 'ID', html: false },
            { key: 'title', label: 'Title' },
            { key: 'slug', label: 'Slug', html: false },
            { key: 'category', label: 'Category' },
            { key: 'status', label: 'Status' },
            { key: 'sort_order', label: 'Sort Order', html: false },
            { key: 'created', label: 'Created' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            <div class="bg-white rounded-lg shadow-lg p-8 m-4">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-8 w-full"></ui-skeleton>
                        <ui-skeleton class="h-8 w-full"></ui-skeleton>
                        <ui-skeleton class="h-8 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Pages Table Section -->
                    <div class="mb-8">
                        ${pages && pages.length > 0 ? `
                            <ui-table 
                                title="Pages Database"
                                data='${JSON.stringify(tableData)}'
                                columns='${JSON.stringify(tableColumns)}'
                                sortable
                                searchable
                                search-placeholder="Search pages..."
                                pagination
                                page-size="5"
                                action
                                addable
                                refresh
                                print
                                bordered
                                striped
                                class="w-full">
                            </ui-table>
                        ` : `
                            <div class="text-center py-8 text-gray-500">
                                <p>No pages found in database</p>
                            </div>
                        `}
                    </div>
                `}
            </div>
            
            <!-- Add Page Modal -->
            <page-settings-modal ${showAddModal ? 'open' : ''}></page-settings-modal>
            
            <!-- Update Page Modal -->
            <page-update-modal ${showUpdateModal ? 'open' : ''}></page-update-modal>
            
            <!-- View Page Modal -->
            <page-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></page-view-modal>
        `;
    }

    // Close the add modal
    closeAddModal() {
        this.set('showAddModal', false);
    }

    // Close the update modal
    closeUpdateModal() {
        this.set('showUpdateModal', false);
        this.set('updatePageData', null);
    }

    // Close the view modal
    closeViewModal() {
        this.set('showViewModal', false);
        this.set('viewPageData', null);
    }


}

customElements.define('app-page-settings-page', PageSettingsPage);
export default PageSettingsPage;