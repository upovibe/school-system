import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/HouseViewDialog.js';
import '@/components/layout/adminLayout/HouseDeleteDialog.js';
import '@/components/layout/adminLayout/HouseAddDialog.js';
import '@/components/layout/adminLayout/HouseUpdateDialog.js';
import api from '@/services/api.js';

/**
 * House Management Page
 * 
 * Displays houses data using Table component
 */
class HouseManagementPage extends App {
    constructor() {
        super();
        this.houses = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateHouseData = null;
        this.viewHouseData = null;
        this.deleteHouseData = null;
    }

    getHeaderCounts() {
        const houses = this.get('houses') || [];
        const total = houses.length;
        const withTeachers = houses.filter(h => h.teacher_count > 0).length;
        const withoutTeachers = houses.filter(h => h.teacher_count === 0).length;
        const totalTeachers = houses.reduce((sum, h) => sum + (h.teacher_count || 0), 0);
        return { total, withTeachers, withoutTeachers, totalTeachers };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Houses</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-houses-info" title="About Houses">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-house-management-page').loadData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage school houses and teacher assignments</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Houses</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-home text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total Houses</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-users text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.withTeachers}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">With Teachers</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.withoutTeachers}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">No Teachers</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-chalkboard-teacher text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.totalTeachers}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total Teachers</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }



    render() {
        const houses = this.get('houses');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare table data and columns for houses
        const tableData = houses ? houses.map((house, index) => ({
            id: house.id, // Keep ID for internal use
            name: house.name,
            description: house.description || 'No description',
            teacher_count: house.teacher_count || 0,
            teachers: house.teachers ? house.teachers.map(t => t.name).join(', ') : 'No teachers assigned',
            created_at: house.created_at,
            updated_at: house.updated_at
        })) : [];

        const tableColumns = [
            { key: 'name', label: 'House Name', sortable: true },
            { key: 'description', label: 'Description', sortable: false },
            { key: 'teacher_count', label: 'HouseMasters Count', sortable: true, type: 'number' },
            { key: 'teachers', label: 'HouseMasters', sortable: false },
            { key: 'created_at', label: 'Created', sortable: true, type: 'date' }
        ];

        return `
            <div class="space-y-6">
                ${this.renderHeader()}
                
                ${loading ? `
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Houses Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Houses Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search houses..."
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
            
            <!-- Add House Dialog -->
            <house-add-dialog ${showAddModal ? 'open' : ''}></house-add-dialog>
            
            <!-- Update House Dialog -->
            <house-update-dialog></house-update-dialog>
            
            <!-- View House Dialog -->
            <house-view-dialog ${showViewModal ? 'open' : ''}></house-view-dialog>
            
            <!-- Delete House Dialog -->
            <house-delete-dialog ${showDeleteDialog ? 'open' : ''}></house-delete-dialog>
        `;
    }

    async loadData() {
        try {
            this.set('loading', true);
            
            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                this.showToast('Please log in to view data', 'error');
                return;
            }

            // Load houses data
            const housesResponse = await api.withToken(token).get('/houses');
            
            this.set('houses', housesResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            this.set('loading', false);
            
            this.showToast(
                error.response?.data?.message || 'Failed to load houses data', 
                'error'
            );
        }
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-houses-info') {
            this.showHousesInfo();
        }
    }

    showHousesInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-home text-green-500 mr-2"></i>
                <span class="font-semibold">About Houses</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">House Management</h4>
                    <p class="text-gray-700">This page manages school houses and teacher assignments. Houses represent different groups within the school, similar to how classes have multiple subjects.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">House Name</span>
                        <span class="text-sm text-gray-600">Unique identifier for each house</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Description</span>
                        <span class="text-sm text-gray-600">Values and characteristics of the house</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Teacher Assignment</span>
                        <span class="text-sm text-gray-600">Teachers can be assigned to multiple houses</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p class="text-sm text-green-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        Houses work like class-subject relationships where you can manage the house and assign teachers in one unified interface.
                    </p>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    onView(event) {
        const { detail } = event;
        const viewHouse = this.get('houses').find(house => house.id === detail.row.id);
        if (viewHouse) {
            this.closeAllModals();
            this.set('viewHouseData', viewHouse);
            this.set('showViewModal', true);
            
            // Set the house data in the dialog
            setTimeout(() => {
                const viewDialog = this.querySelector('house-view-dialog');
                if (viewDialog) {
                    viewDialog.setHouseData(viewHouse);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editHouse = this.get('houses').find(house => house.id === detail.row.id);
        if (editHouse) {
            this.closeAllModals();
            
            // Set the house data in the dialog and let it handle opening
            setTimeout(() => {
                const updateDialog = this.querySelector('house-update-dialog');
                if (updateDialog) {
                    updateDialog.setHouseData(editHouse);
                }
            }, 100);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteHouse = this.get('houses').find(house => house.id === detail.row.id);
        if (deleteHouse) {
            this.closeAllModals();
            this.set('deleteHouseData', deleteHouse);
            this.set('showDeleteDialog', true);
            
            // Set the house data in the dialog
            setTimeout(() => {
                const deleteDialog = this.querySelector('house-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setHouseData(deleteHouse);
                }
            }, 0);
        }
    }

    onAdd(event) {
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    updateTableData() {
        const houses = this.get('houses') || [];
        const tableData = houses.map((house, index) => ({
            id: house.id,
            name: house.name,
            description: house.description || 'No description',
            teacher_count: house.teacher_count || 0,
            teachers: house.teachers ? house.teachers.map(t => t.name).join(', ') : 'No teachers assigned',
            created_at: house.created_at,
            updated_at: house.updated_at
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
        this.set('updateHouseData', null);
        this.set('viewHouseData', null);
        this.set('deleteHouseData', null);
    }

    showToast(message, type = 'info') {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white ${
            type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 
            'bg-blue-500'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'House Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('house-deleted', (event) => {
            // Remove the deleted house from the current data
            const deletedHouseId = event.detail.houseId;
            const currentHouses = this.get('houses') || [];
            const updatedHouses = currentHouses.filter(house => house.id !== deletedHouseId);
            this.set('houses', updatedHouses);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('house-saved', (event) => {
            // Reload all data to get the complete house with teachers
            this.loadData();
            // Close the add modal
            this.set('showAddModal', false);
        });
        
        this.addEventListener('house-updated', (event) => {
            // Update the existing house in the data
            const updatedHouse = event.detail.house;
            if (updatedHouse) {
                const currentHouses = this.get('houses') || [];
                const updatedHouses = currentHouses.map(house => 
                    house.id === updatedHouse.id ? updatedHouse : house
                );
                this.set('houses', updatedHouses);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });

    }
}

customElements.define('app-house-management-page', HouseManagementPage);
export default HouseManagementPage;
