import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/GradingPeriodAddModal.js';
import '@/components/layout/adminLayout/GradingPeriodDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Grading Period Management Page
 * 
 * Displays grading periods data using Table component (read-only)
 */
class GradingPeriodManagementPage extends App {
    constructor() {
        super();
        this.gradingPeriods = null;
        this.loading = false;
        this.showAddModal = false;
        this.showDeleteDialog = false;
        this.selectedGradingPeriodToDelete = null;
    }

    // Summary counts for header
    getHeaderCounts() {
        const periods = this.get('gradingPeriods') || [];
        const total = periods.length;
        let active = 0;
        let inactive = 0;
        const yearSet = new Set();
        
        periods.forEach((p) => {
            const isActive = Number(p.is_active) === 1 || String(p.is_active || p.status).toLowerCase() === 'active';
            if (isActive) active += 1; else inactive += 1;
            if (p.academic_year) yearSet.add(String(p.academic_year));
        });
        
        return { total, active, inactive, years: yearSet.size };
    }

    // Gradient header consistent with other pages
    renderHeader() {
        const c = this.getHeaderCounts();
        
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Grading Periods</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-grading-periods-info" title="About Grading Periods">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage academic periods and timelines</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Periods</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-check text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Active</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-pause-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.inactive}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Inactive</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-calendar-alt text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.years}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Academic Years</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-layer-group text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total</div>
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
        document.title = 'Grading Period Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Listen for table add button clicks
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for table delete button clicks
        this.addEventListener('table-delete', this.onDelete.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('grading-period-saved', (event) => {
            // Add the new grading period to the existing data
            const newGradingPeriod = event.detail.gradingPeriod;
            if (newGradingPeriod) {
                const currentGradingPeriods = this.get('gradingPeriods') || [];
                this.set('gradingPeriods', [...currentGradingPeriods, newGradingPeriod]);
                this.updateTableData();
                // Force re-render to update header counts
                this.render();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        // Listen for delete success events
        this.addEventListener('grading-period-deleted', (event) => {
            console.log('🗑️ Delete event received:', event);
            console.log('🗑️ Event detail:', event.detail);
            
            // Remove the deleted grading period from the current data
            const deletedGradingPeriod = event.detail.gradingPeriod;
            console.log('🗑️ Deleted grading period:', deletedGradingPeriod);
            
            if (deletedGradingPeriod && deletedGradingPeriod.id) {
                const currentGradingPeriods = this.get('gradingPeriods') || [];
                console.log('🗑️ Current grading periods before delete:', currentGradingPeriods);
                
                const updatedGradingPeriods = currentGradingPeriods.filter(period => period.id != deletedGradingPeriod.id);
                console.log('🗑️ Updated grading periods after delete:', updatedGradingPeriods);
                
                this.set('gradingPeriods', updatedGradingPeriods);
                this.updateTableData();
                // Force re-render to update header counts
                this.render();
                // Close the delete dialog
                this.set('showDeleteDialog', false);
            } else {
                console.log('🗑️ No valid grading period data in event');
            }
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-grading-periods-info') {
            this.showGradingPeriodsInfo();
        }
    }

    showGradingPeriodsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-calendar-alt text-blue-500 mr-2"></i>
                <span class="font-semibold">About Grading Periods</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What is a Grading Period?</h4>
                    <p class="text-gray-700">Grading periods define date ranges (e.g., Term 1, Term 2) used to group and filter grades. Each grade belongs to exactly one period.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Name</span>
                        <span class="text-sm text-gray-600">e.g., Term 1, Semester 2, Quarter 3</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Academic Year</span>
                        <span class="text-sm text-gray-600">Matches the class academic year</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Start/End Dates</span>
                        <span class="text-sm text-gray-600">Used to constrain grade entry windows</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        Create periods first; grading policies and grade entry use these periods for organization and filtering.
                    </p>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    onAdd(event) {
        this.set('showAddModal', true);
    }

    onDelete(event) {
        const detail = event.detail;
        const deleteGradingPeriod = this.get('gradingPeriods').find(period => period.id === detail.row.id);
        if (deleteGradingPeriod) {
            this.set('selectedGradingPeriodToDelete', deleteGradingPeriod);
            this.set('showDeleteDialog', true);
            
            // Set the data in the delete dialog
            const deleteDialog = this.querySelector('grading-period-delete-dialog');
            if (deleteDialog) {
                deleteDialog.setGradingPeriodData(deleteGradingPeriod);
            }
        }
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

            // Load grading periods data
            const response = await api.withToken(token).get('/grading-periods');
            const rawPeriods = response?.data?.data || [];
            
            // Data loaded
            this.set('gradingPeriods', rawPeriods);
            this.set('loading', false);
            
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

    updateTableData() {
        const gradingPeriods = this.get('gradingPeriods');
        if (!gradingPeriods) return;

        // Prepare table data for grading periods
        const tableData = gradingPeriods.map((period, index) => ({
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
        }));

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    render() {
        const gradingPeriods = this.get('gradingPeriods');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
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
            
            <!-- Delete Grading Period Dialog -->
            <grading-period-delete-dialog ${showDeleteDialog ? 'open' : ''}></grading-period-delete-dialog>
        `;
    }
}

customElements.define('app-grading-period-management-page', GradingPeriodManagementPage);
export default GradingPeriodManagementPage;
