import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/PageSettingsModal.js';
import '@/components/layout/adminLayout/PageUpdateModal.js';
import '@/components/layout/adminLayout/PageViewModal.js';
import '@/components/layout/adminLayout/PageDeleteDialog.js';
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
        this.deletePageData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Page Settings | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        this.addEventListener('table-refresh', this.onRefresh.bind(this));
        
        // Listen for dialog events
        this.addEventListener('dialog-opened', (event) => {
            const dialog = event.target;
            if (dialog.tagName === 'PAGE-DELETE-DIALOG') {
                const deletePageData = this.get('deletePageData');
                if (deletePageData) {
                    dialog.setPageData(deletePageData);
                }
            }
        });
        
        // Listen for success events to refresh data
        this.addEventListener('page-deleted', () => {
            this.loadData();
        });
        
        this.addEventListener('page-saved', () => {
            this.loadData();
        });
        
        this.addEventListener('page-updated', () => {
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

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewPage = this.get('pages').find(page => page.id === detail.row.id);
        if (viewPage) {
            this.closeAllModals();
            this.set('viewPageData', viewPage);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('page-view-modal');
                if (viewModal) {
                    viewModal.setPageData(viewPage);
                }
            }, 100);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editPage = this.get('pages').find(page => page.id === detail.row.id);
        if (editPage) {
            // Close any open modals first
            this.closeAllModals();
            this.set('updatePageData', editPage);
            this.set('showUpdateModal', true);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deletePage = this.get('pages').find(page => page.id === detail.row.id);
        if (deletePage) {
            // Close any open modals first
            this.closeAllModals();
            this.set('deletePageData', deletePage);
            this.set('showDeleteDialog', true);
        }
    }

    onAdd(event) {
        // Close any open modals first
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onRefresh(event) {
        this.loadData();
    }

    // Close all modals and dialogs
    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updatePageData', null);
        this.set('viewPageData', null);
        this.set('deletePageData', null);
    }

    render() {
        const pages = this.get('pages');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
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
            
            <!-- Delete Page Dialog -->
            <page-delete-dialog ${showDeleteDialog ? 'open' : ''}></page-delete-dialog>
        `;
    }


}

customElements.define('app-page-settings-page', PageSettingsPage);
export default PageSettingsPage;





