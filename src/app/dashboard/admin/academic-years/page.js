import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/AcademicYearAddModal.js';
import '@/components/layout/adminLayout/AcademicYearUpdateModal.js';
import '@/components/layout/adminLayout/AcademicYearViewModal.js';
import '@/components/layout/adminLayout/AcademicYearDeleteDialog.js';
import '@/components/layout/adminLayout/AcademicYearArchiveDialog.js';
import api from '@/services/api.js';

/**
 * Academic Year Management Page
 * 
 * Displays academic years data using Table component
 */
class AcademicYearManagementPage extends App {
    constructor() {
        super();
        this.academicYears = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.showArchiveDialog = false;
        this.updateAcademicYearData = null;
        this.viewAcademicYearData = null;
        this.deleteAcademicYearData = null;
        this.archiveAcademicYearData = null;
    }

    // Summary for header
    getHeaderCounts() {
        const academicYears = this.get('academicYears') || [];
        const total = academicYears.length;
        let active = 0;
        let inactive = 0;
        let current = 0;
        let archived = 0;
        
        academicYears.forEach((ay) => {
            if (ay.is_current) current += 1;
            if (ay.is_active) active += 1;
            if (ay.status === 'archived') archived += 1;
            if (!ay.is_active && !ay.is_current && ay.status !== 'archived') inactive += 1;
        });
        
        return { total, active, inactive, current, archived };
    }

    // Format date to M/D/YYYY format
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const month = date.getMonth() + 1; // getMonth() returns 0-11
        const day = date.getDate();
        const year = date.getFullYear();
        
        return `${month}/${day}/${year}`;
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Academic Years</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-academic-years-info" title="About Academic Years">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage academic year periods and settings</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Years</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-6">
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
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-star text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.current}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Current</div>
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
                                <div class="size-10 flex items-center justify-center bg-gray-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-archive text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.archived}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Archived</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-calendar text-white text-lg sm:text-xl"></i>
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
        document.title = 'Academic Year Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        this.addEventListener('table-custom-action', this.onCustomAction.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('academic-year-deleted', (event) => {
            // Remove the deleted academic year from the current data
            const deletedYearId = event.detail.academicYearId;
            const currentYears = this.get('academicYears') || [];
            const updatedYears = currentYears.filter(year => year.id !== deletedYearId);
            this.set('academicYears', updatedYears);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('academic-year-saved', (event) => {
            // Always reload data from database to ensure we have the actual data
            this.loadData();
            // Close the add modal
            this.set('showAddModal', false);
        });
        
        this.addEventListener('academic-year-updated', (event) => {
            // Always reload data from database to ensure we have the actual data
            this.loadData();
            // Close the update modal
            this.set('showUpdateModal', false);
        });
        
        this.addEventListener('academic-year-archived', (event) => {
            // Always reload data from database to ensure we have the actual data
            this.loadData();
            // Close the archive dialog
            this.set('showArchiveDialog', false);
        });
    }

    async loadData() {
        try {
            this.set('loading', true);
            const token = localStorage.getItem('token');
            const response = await api.withToken(token).get('/academic-years');
            
            if (response.data && response.data.success) {
                this.set('academicYears', response.data.data);
            } else {
                this.set('academicYears', []);
                Toast.show({
                    title: 'Error',
                    message: response.data?.message || 'Failed to load academic years',
                    variant: 'error'
                });
            }
        } catch (error) {
            console.error('Error loading academic years:', error);
            this.set('academicYears', []);
            Toast.show({
                title: 'Error',
                message: 'Failed to load academic years',
                variant: 'error'
            });
        } finally {
            this.set('loading', false);
        }
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-academic-years-info') {
            this.showAcademicYearsInfo();
        }
    }

    showAcademicYearsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-calendar-check text-blue-500 mr-2"></i>
                <span class="font-semibold">About Academic Years</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What is an Academic Year in this system?</h4>
                    <p class="text-gray-700">Academic Years represent the time periods when school activities occur (e.g., 2024-2025). Each academic year has a start date, end date, and can be marked as active, current, or archived. Academic years are used to organize classes, grading periods, and student records.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="font-medium">Active Years:</span>
                        <span class="text-gray-600">Years that can be used for current operations</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Current Year:</span>
                        <span class="text-gray-600">The year currently in session (only one can be current)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Archived Years:</span>
                        <span class="text-gray-600">Completed years with preserved historical data</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    onView(event) {
        const { detail } = event;
        const viewYear = this.get('academicYears').find(year => year.id === detail.row.id);
        if (viewYear) {
            // Close any open modals first
            this.closeAllModals();
            this.set('viewAcademicYearData', viewYear);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('academic-year-view-modal');
                if (viewModal) {
                    viewModal.setAcademicYearData(viewYear);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editYear = this.get('academicYears').find(year => year.id === detail.row.id);
        if (editYear) {
            // console.log('onEdit called with:', editYear);
            // Close any open modals first
            this.closeAllModals();
            this.set('updateAcademicYearData', editYear);
            this.set('showUpdateModal', true);
            // Wait for the modal to be rendered and then set the data
            setTimeout(() => {
                const updateModal = this.querySelector('academic-year-update-modal');
                if (updateModal) {
                    // console.log('Found update modal, setting data...');
                    updateModal.setAcademicYearData(editYear);
                } else {
                    // console.error('Update modal not found');
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteYear = this.get('academicYears').find(year => year.id === detail.row.id);
        if (deleteYear) {
            // Close any open modals first
            this.closeAllModals();
            this.set('deleteAcademicYearData', deleteYear);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('academic-year-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setAcademicYearData(deleteYear);
                }
            }, 0);
        }
    }

    onAdd(event) {
        // Close any open modals first
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onCustomAction(event) {
        const { actionName, action, row } = event.detail;
        const act = actionName || action;
        
        if (act === 'archive-year') {
            // Find the academic year data for this row
            const yearData = this.get('academicYears')?.find(y => y.id === row.id);
            if (yearData) {
                this.closeAllModals();
                this.set('archiveAcademicYearData', yearData);
                this.set('showArchiveDialog', true);
                
                // Force a re-render to ensure the dialog is in the DOM
                this.render();
                
                setTimeout(() => {
                    const archiveDialog = this.querySelector('academic-year-archive-dialog');
                    if (archiveDialog) {
                        archiveDialog.setAcademicYearData(yearData);
                    } else {
                        console.error('Archive dialog not found');
                    }
                }, 100);
            }
        }
    }

    getCustomActions() {
        return [
            {
                name: 'archive-year',
                label: 'Archive',
                icon: 'fas fa-archive',
                variant: 'warning',
                size: 'sm',
                showField: 'can_archive'
            }
        ];
    }

    onRefresh(event) {
        this.loadData();
    }

    // Update table data without full page reload
    updateTableData() {
        const academicYears = this.get('academicYears');
        if (!academicYears) return;

        // Prepare table data
        const tableData = academicYears.map((year, index) => ({
            id: year.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            year_code: year.year_code,
            display_name: year.display_name,
            start_date: year.start_date,
            end_date: year.end_date,
            status: year.is_active ? 'Active' : 'Inactive',
            is_current: year.is_current ? 'Yes' : 'No',
            is_active: year.is_active ? 'Yes' : 'No',
            created: year.created_at,
            updated: year.updated_at ? this.formatDate(year.updated_at) : ''
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
        this.set('showArchiveDialog', false);
        this.set('updateAcademicYearData', null);
        this.set('viewAcademicYearData', null);
        this.set('deleteAcademicYearData', null);
        this.set('archiveAcademicYearData', null);
    }

    render() {
        const academicYears = this.get('academicYears');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        const showArchiveDialog = this.get('showArchiveDialog');
        
        // Prepare table data and columns for academic years
        const tableData = academicYears ? academicYears.map((year, index) => ({
            id: year.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            year_code: year.year_code,
            display_name: year.display_name,
            start_date: year.start_date,
            end_date: year.end_date,
            status: year.is_active ? 'Active' : 'Inactive',
            is_current: year.is_current ? 'Yes' : 'No',
            is_active: year.is_active ? 'Yes' : 'No',
            created: year.created_at,
            updated: year.updated_at ? this.formatDate(year.updated_at) : '',
            // Add metadata for custom actions
            can_archive: year.status !== 'archived' && !year.is_current // Can archive if not archived and not current
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'year_code', label: 'Year Code' },
            { key: 'display_name', label: 'Display Name' },
            { key: 'start_date', label: 'Start Date' },
            { key: 'end_date', label: 'End Date' },
            { key: 'status', label: 'Status' },
            { key: 'is_current', label: 'Current' },
            { key: 'is_active', label: 'Active' },
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
                    <!-- Academic Years Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Academic Years Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search academic years..."
                            pagination
                            page-size="50"
                            action
                            addable
                            refresh
                            print
                            bordered
                            striped
                            custom-actions='${JSON.stringify(this.getCustomActions())}'
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>
            
            <!-- Add Academic Year Modal -->
            <academic-year-add-modal ${showAddModal ? 'open' : ''}></academic-year-add-modal>
            
            <!-- Update Academic Year Modal -->
            <academic-year-update-modal ${showUpdateModal ? 'open' : ''}></academic-year-update-modal>
            
            <!-- View Academic Year Modal -->
            <academic-year-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></academic-year-view-modal>
            
            <!-- Delete Academic Year Dialog -->
            <academic-year-delete-dialog ${showDeleteDialog ? 'open' : ''}></academic-year-delete-dialog>
            
            <!-- Archive Academic Year Dialog -->
            <academic-year-archive-dialog ${showArchiveDialog ? 'open' : ''}></academic-year-archive-dialog>
        `;
    }
}

customElements.define('app-academic-year-management-page', AcademicYearManagementPage);
export default AcademicYearManagementPage;
