import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/GradingPeriodAddModal.js';
import '@/components/layout/adminLayout/GradingPeriodUpdateModal.js';
import '@/components/layout/adminLayout/GradingPeriodViewModal.js';
import '@/components/layout/adminLayout/GradingPeriodDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Grading Period Management Page
 * 
 * Displays grading periods data using Table component
 */
class GradingPeriodManagementPage extends App {
    constructor() {
        super();
        this.gradingPeriods = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updateGradingPeriodData = null;
        this.viewGradingPeriodData = null;
        this.deleteGradingPeriodData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Grading Period Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('grading-period-deleted', (event) => {
            // Remove the deleted grading period from the current data
            const deletedGradingPeriodId = event.detail.gradingPeriodId;
            const currentGradingPeriods = this.get('gradingPeriods') || [];
            const updatedGradingPeriods = currentGradingPeriods.filter(period => period.id !== deletedGradingPeriodId);
            this.set('gradingPeriods', updatedGradingPeriods);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('grading-period-saved', (event) => {
            // Add the new grading period to the existing data
            const newGradingPeriod = event.detail.gradingPeriod;
            if (newGradingPeriod) {
                const currentGradingPeriods = this.get('gradingPeriods') || [];
                this.set('gradingPeriods', [...currentGradingPeriods, newGradingPeriod]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('grading-period-updated', (event) => {
            // Update the existing grading period in the data
            const updatedGradingPeriod = event.detail.gradingPeriod;
            if (updatedGradingPeriod) {
                const currentGradingPeriods = this.get('gradingPeriods') || [];
                const updatedGradingPeriods = currentGradingPeriods.map(period => 
                    period.id === updatedGradingPeriod.id ? updatedGradingPeriod : period
                );
                this.set('gradingPeriods', updatedGradingPeriods);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
        
        // Listen for modal data updates
        this.addEventListener('update-modal-data', (event) => {
            const { modalType, data } = event.detail;
            if (modalType === 'update' && data) {
                this.set('updateGradingPeriodData', data);
            } else if (modalType === 'view' && data) {
                this.set('viewGradingPeriodData', data);
            } else if (modalType === 'delete' && data) {
                this.set('deleteGradingPeriodData', data);
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

            // Fetch grading periods data
            const response = await api.withToken(token).get('/grading-periods');
            
            this.set('gradingPeriods', response.data.data);
            this.updateTableData();
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load grading periods data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    onView(event) {
        const gradingPeriodId = event.detail.id;
        const gradingPeriod = this.get('gradingPeriods').find(period => period.id === gradingPeriodId);
        
        if (gradingPeriod) {
            this.set('viewGradingPeriodData', gradingPeriod);
            this.set('showViewModal', true);
        }
    }

    onEdit(event) {
        const gradingPeriodId = event.detail.id;
        const gradingPeriod = this.get('gradingPeriods').find(period => period.id === gradingPeriodId);
        
        if (gradingPeriod) {
            this.set('updateGradingPeriodData', gradingPeriod);
            this.set('showUpdateModal', true);
        }
    }

    onDelete(event) {
        const gradingPeriodId = event.detail.id;
        const gradingPeriod = this.get('gradingPeriods').find(period => period.id === gradingPeriodId);
        
        if (gradingPeriod) {
            this.set('deleteGradingPeriodData', gradingPeriod);
            this.set('showDeleteDialog', true);
        }
    }

    onAdd(event) {
        this.set('showAddModal', true);
    }

    updateTableData() {
        const gradingPeriods = this.get('gradingPeriods');
        
        // Prepare table data for grading periods
        const tableData = gradingPeriods ? gradingPeriods.map((period, index) => ({
            id: period.id,
            index: index + 1,
            name: period.name,
            academic_year: period.academic_year,
            start_date: new Date(period.start_date).toLocaleDateString(),
            end_date: new Date(period.end_date).toLocaleDateString(),
            is_active: period.is_active ? 'Active' : 'Inactive',
            description: period.description || 'No description',
            created: new Date(period.created_at).toLocaleDateString(),
            updated: new Date(period.updated_at).toLocaleDateString()
        })) : [];

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateGradingPeriodData', null);
        this.set('viewGradingPeriodData', null);
        this.set('deleteGradingPeriodData', null);
    }

    render() {
        const gradingPeriods = this.get('gradingPeriods');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare table data and columns for grading periods
        const tableData = gradingPeriods ? gradingPeriods.map((period, index) => ({
            id: period.id,
            index: index + 1,
            name: period.name,
            academic_year: period.academic_year,
            start_date: new Date(period.start_date).toLocaleDateString(),
            end_date: new Date(period.end_date).toLocaleDateString(),
            is_active: period.is_active ? 'Active' : 'Inactive',
            description: period.description || 'No description',
            created: new Date(period.created_at).toLocaleDateString(),
            updated: new Date(period.updated_at).toLocaleDateString()
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'name', label: 'Period Name' },
            { key: 'academic_year', label: 'Academic Year' },
            { key: 'start_date', label: 'Start Date' },
            { key: 'end_date', label: 'End Date' },
            { key: 'is_active', label: 'Status' },
            { key: 'description', label: 'Description' },
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
                    <!-- Grading Periods Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Grading Periods Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search grading periods..."
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
            
            <!-- Add Grading Period Modal -->
            <grading-period-add-modal ${showAddModal ? 'open' : ''}></grading-period-add-modal>
            
            <!-- Update Grading Period Modal -->
            <grading-period-update-modal 
                ${showUpdateModal ? 'open' : ''} 
                grading-period-data='${this.get('updateGradingPeriodData') ? JSON.stringify(this.get('updateGradingPeriodData')) : ''}'>
            </grading-period-update-modal>
            
            <!-- View Grading Period Modal -->
            <grading-period-view-modal 
                id="view-modal" 
                ${showViewModal ? 'open' : ''} 
                grading-period-data='${this.get('viewGradingPeriodData') ? JSON.stringify(this.get('viewGradingPeriodData')) : ''}'>
            </grading-period-view-modal>
            
            <!-- Delete Grading Period Dialog -->
            <grading-period-delete-dialog 
                ${showDeleteDialog ? 'open' : ''} 
                grading-period-data='${this.get('deleteGradingPeriodData') ? JSON.stringify(this.get('deleteGradingPeriodData')) : ''}'>
            </grading-period-delete-dialog>
        `;
    }
}

customElements.define('app-grading-period-management-page', GradingPeriodManagementPage);
export default GradingPeriodManagementPage;
