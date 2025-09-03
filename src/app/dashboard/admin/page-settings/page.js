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
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        

        
        // Listen for success events to refresh data
        this.addEventListener('page-deleted', (event) => {
            // Remove the deleted page from the current data
            const deletedPageId = event.detail.pageId;
            const currentPages = this.get('pages') || [];
            const updatedPages = currentPages.filter(page => page.id !== deletedPageId);
            this.set('pages', updatedPages);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('page-saved', (event) => {
            // Add the new page to the existing data
            const newPage = event.detail.page;
            if (newPage) {
                const currentPages = this.get('pages') || [];
                this.set('pages', [...currentPages, newPage]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('page-updated', (event) => {
            // Update the existing page in the data
            const updatedPage = event.detail.page;
            if (updatedPage) {
                const currentPages = this.get('pages') || [];
                const updatedPages = currentPages.map(page => 
                    page.id === updatedPage.id ? updatedPage : page
                );
                this.set('pages', updatedPages);
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

    renderHeader() {
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Page Settings</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-page-settings-info" title="About Page Settings">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-page-settings-page').loadData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-indigo-100 text-base sm:text-lg">Manage CMS pages metadata, visibility and ordering</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-page-settings-info') {
            this.showPageSettingsInfo();
        }
    }

    showPageSettingsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-file-alt text-indigo-500 mr-2"></i>
                <span class="font-semibold">About Page Settings</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">Control which pages appear on the site and how they are presented, including names, titles, categories and sort order.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Name & Title</span>
                        <span class="text-sm text-gray-600">Displayed labels for each page</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Category & Status</span>
                        <span class="text-sm text-gray-600">Group pages and toggle visibility</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Sort Order</span>
                        <span class="text-sm text-gray-600">Controls page listing order</span>
                    </div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
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
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editPage = this.get('pages').find(page => page.id === detail.row.id);
        // Ensure name and subtitle are present
        if (editPage && (!('name' in editPage) || !('subtitle' in editPage))) {
            // Try to get from table row if missing
            editPage.name = detail.row.name || '';
            editPage.subtitle = detail.row.subtitle || '';
        }
        if (editPage) {
            // Close any open modals first
            this.closeAllModals();
            this.set('updatePageData', editPage);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('page-update-modal');
                if (updateModal) {
                    updateModal.setPageData(editPage);
                }
            }, 0);
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
            setTimeout(() => {
                const deleteDialog = this.querySelector('page-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setPageData(deletePage);
                }
            }, 0);
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

    // Update table data without full page reload
    updateTableData() {
        const pages = this.get('pages');
        if (!pages) return;

        // Prepare table data
        const tableData = pages.map((page, index) => ({
            id: page.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: page.name,
            subtitle: page.subtitle,
            title: page.title,
            slug: page.slug,
            category: page.category,
            status: page.is_active ? 'Active' : 'Inactive',
            sort_order: page.sort_order,
            created: page.created_at,
            updated: page.updated_at,
            banner: page.banner_image || 'No banner'
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
        const tableData = pages ? pages.map((page, index) => ({
            id: page.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: page.name,
            subtitle: page.subtitle,
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
            // { key: 'id', label: 'ID', html: false }, // Hidden but kept for reference
            { key: 'index', label: 'No.', html: false },
            { key: 'name', label: 'Name' },
            { key: 'title', label: 'Title' },
            // { key: 'slug', label: 'Slug', html: false },
            // { key: 'category', label: 'Category' },
            // { key: 'status', label: 'Status' },
            // { key: 'sort_order', label: 'Sort Order', html: false },
            // { key: 'created', label: 'Created' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            ${this.renderHeader()}
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Pages Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Pages Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search pages..."
                            pagination
                            page-size="50"
                            action
                            actions="view,edit"
                            print
                            refresh
                            bordered
                            striped
                            class="w-full">
                        </ui-table>
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





