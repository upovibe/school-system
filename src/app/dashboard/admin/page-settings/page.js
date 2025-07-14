import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
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
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('🔧 PageSettingsPage connectedCallback');
        document.title = 'Page Settings | School System';
        this.loadData();
    }

    async loadData() {
        try {
            this.set('loading', true);
            console.log('🔧 Loading pages data...');
            
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
            console.log('🔧 Pages response:', pagesResponse.data);
            
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
                console.log('View page:', detail.row);
                Toast.show({
                    title: 'View Page',
                    message: `Viewing: ${detail.row.title}`,
                    variant: 'info',
                    duration: 2000
                });
                break;
                
            case 'table-edit':
                console.log('Edit page:', detail.row);
                Toast.show({
                    title: 'Edit Page',
                    message: `Editing: ${detail.row.title}`,
                    variant: 'info',
                    duration: 2000
                });
                break;
                
            case 'table-delete':
                console.log('Delete page:', detail.row);
                Toast.show({
                    title: 'Delete Page',
                    message: `Deleting: ${detail.row.title}`,
                    variant: 'warning',
                    duration: 2000
                });
                break;
                
            case 'table-add':
                console.log('Add new page');
                Toast.show({
                    title: 'Add Page',
                    message: 'Opening add page form...',
                    variant: 'info',
                    duration: 2000
                });
                break;
                
            case 'table-refresh':
                console.log('Refresh table');
                this.loadData();
                break;
        }
    }

    render() {
        console.log('🔧 PageSettingsPage render called');
        const pages = this.get('pages');
        const loading = this.get('loading');
        
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
        `;
    }

    // Override connectedCallback to add event listeners after render
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
    }
}

customElements.define('app-page-settings-page', PageSettingsPage);
export default PageSettingsPage;