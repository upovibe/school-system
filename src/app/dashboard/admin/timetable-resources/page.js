import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/TimetableResourceAddDialog.js';
import '@/components/layout/adminLayout/TimetableResourceUpdateDialog.js';
import api from '@/services/api.js';

/**
 * Timetable Resources Management Page
 * 
 * Displays timetable resources data using Table component
 */
class TimetableResourcesPage extends App {
    constructor() {
        super();
        this.resources = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updateResourceData = null;
        this.viewResourceData = null;
        this.deleteResourceData = null;
    }

    getHeaderCounts() {
        const resources = this.get('resources') || [];
        const total = resources.length;
        const classes = new Set(resources.map(r => r?.class_id)).size;
        const creators = new Set(resources.map(r => r?.created_by)).size;
        const fileTypes = new Set(resources.map(r => {
            const fileName = r?.attachment_file || '';
            return fileName.split('.').pop()?.toUpperCase() || 'Unknown';
        })).size;
        return { total, classes, creators, fileTypes };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Timetable Resources</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-resources-info" title="About Timetable Resources">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage shared files and documents for classes</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Resources</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-file-alt text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Resources</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-chalkboard text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.classes}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Classes</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-users text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.creators}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Creators</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-file-archive text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.fileTypes}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">File Types</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Timetable Resources | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('resource-saved', (event) => {
            // Add the new resource to the existing data
            const newResource = event.detail.resource;
            if (newResource) {
                const currentResources = this.get('resources') || [];
                this.set('resources', [...currentResources, newResource]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('resource-updated', (event) => {
            // Update the existing resource in the data
            const updatedResource = event.detail.resource;
            if (updatedResource) {
                const currentResources = this.get('resources') || [];
                const updatedResources = currentResources.map(resource => 
                    resource.id === updatedResource.id ? updatedResource : resource
                );
                this.set('resources', updatedResources);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-resources-info') {
            this.showResourcesInfo();
        }
    }

    showResourcesInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-file-alt text-blue-500 mr-2"></i>
                <span class="font-semibold">About Timetable Resources</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What is managed here?</h4>
                    <p class="text-gray-700">Upload and manage files that can be shared with specific classes. Teachers and students can download these resources.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Title</span>
                        <span class="text-sm text-gray-600">Name/description of the resource</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Class</span>
                        <span class="text-sm text-gray-600">Which class can access this resource</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">File</span>
                        <span class="text-sm text-gray-600">Document, image, or other file type</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Creator</span>
                        <span class="text-sm text-gray-600">Who uploaded the resource</span>
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

            // Load timetable resources data
            const resourcesResponse = await api.withToken(token).get('/timetable-resources');
            
            this.set('resources', resourcesResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load timetable resources data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewResource = this.get('resources').find(resource => resource.id === detail.row.id);
        if (viewResource) {
            this.closeAllModals();
            this.set('viewResourceData', viewResource);
            this.set('showViewModal', true);
            // TODO: Implement view modal
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editResource = this.get('resources').find(resource => resource.id === detail.row.id);
        if (editResource) {
            this.closeAllModals();
            this.set('updateResourceData', editResource);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('timetable-resource-update-dialog');
                if (updateModal) {
                    updateModal.setResourceData(editResource);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteResource = this.get('resources').find(resource => resource.id === detail.row.id);
        if (deleteResource) {
            this.closeAllModals();
            this.set('deleteResourceData', deleteResource);
            this.set('showDeleteDialog', true);
            // TODO: Implement delete dialog
        }
    }

    onAdd(event) {
        this.closeAllModals();
        this.set('showAddModal', true);
        // TODO: Implement add modal
    }

    onRefresh(event) {
        this.loadData();
    }



    // Update table data without full page reload
    updateTableData() {
        const resources = this.get('resources');
        if (!resources) return;

        // Prepare table data
        const tableData = resources.map((resource, index) => ({
            id: resource.id,
            index: index + 1,
            title: resource.title,
            class_info: this.formatClassInfo(resource.class_name, resource.class_section),
            creator_name: resource.creator_name || 'Unknown',
            attachment_file: resource.attachment_file || 'No file',
            created: this.formatDate(resource.created_at)
        }));

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    // Helper method to format class name and section together
    formatClassInfo(className, classSection) {
        if (!className) return 'Unknown Class';
        if (!classSection) return className;
        return `${className} (${classSection})`;
    }

    // Helper method to format dates
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    // Close all modals and dialogs
    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateResourceData', null);
        this.set('viewResourceData', null);
        this.set('deleteResourceData', null);
    }

    render() {
        const resources = this.get('resources');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        
        // Prepare table data and columns for timetable resources
        const tableData = resources ? resources.map((resource, index) => ({
            id: resource.id,
            index: index + 1,
            title: resource.title,
            class_info: this.formatClassInfo(resource.class_name, resource.class_section),
            creator_name: resource.creator_name || 'Unknown',
            attachment_file: resource.attachment_file || 'No file',
            created: this.formatDate(resource.created_at)
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'title', label: 'Title' },
            { key: 'class_info', label: 'Class' },
            { key: 'creator_name', label: 'Created By' },
            { key: 'attachment_file', label: 'File' },
            { key: 'created', label: 'Created' }
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
                    <!-- Timetable Resources Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Timetable Resources Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search resources..."
                            pagination
                            page-size="50"
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
            
            <!-- Add Resource Dialog -->
            <timetable-resource-add-dialog ${showAddModal ? 'open' : ''}></timetable-resource-add-dialog>
            
            <!-- Update Resource Dialog -->
            <timetable-resource-update-dialog ${showUpdateModal ? 'open' : ''}></timetable-resource-update-dialog>
            
            <!-- TODO: Add other modals and dialogs here -->
            <!-- View Resource Modal -->
            <!-- Delete Resource Dialog -->
        `;
    }
}

customElements.define('app-timetable-resources-page', TimetableResourcesPage);
export default TimetableResourcesPage;
