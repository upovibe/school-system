import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/ClassAddModal.js';
import '@/components/layout/adminLayout/ClassUpdateModal.js';
import '@/components/layout/adminLayout/ClassViewModal.js';
import '@/components/layout/adminLayout/ClassDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Class Management Page
 * 
 * Displays classes data using Table component
 */
class ClassManagementPage extends App {
    constructor() {
        super();
        this.classes = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updateClassData = null;
        this.viewClassData = null;
        this.deleteClassData = null;
    }

    // Summary counts for header
    getHeaderCounts() {
        const classes = this.get('classes') || [];
        const total = classes.length;
        let active = 0;
        let inactive = 0;
        const sectionSet = new Set();
        const yearSet = new Set();
        classes.forEach((c) => {
            const isActive = String(c.status || '').toLowerCase() === 'active' || Number(c.is_active) === 1;
            if (isActive) active += 1; else inactive += 1;
            if (c.section) sectionSet.add(String(c.section));
            if (c.academic_year) yearSet.add(String(c.academic_year));
        });
        return { total, active, inactive, sections: sectionSet.size, years: yearSet.size };
    }

    // Gradient header consistent with other pages
    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <h1 class="text-2xl sm:text-3xl font-bold">Classes</h1>
                            <p class="text-blue-100 text-base sm:text-lg">Manage academic classes and sections</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Classes</div>
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
                                <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-layer-group text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.sections}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Sections</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-red-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-calendar-alt text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.years}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Academic Years</div>
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
        document.title = 'Class Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('class-deleted', (event) => {
            // Remove the deleted class from the current data
            const deletedClass = event.detail.class;
            if (deletedClass && deletedClass.id) {
                const currentClasses = this.get('classes') || [];
                const updatedClasses = currentClasses.filter(classItem => classItem.id != deletedClass.id);
                this.set('classes', updatedClasses);
                this.updateTableData();
            }
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('class-saved', (event) => {
            // Add the new class to the existing data
            const newClass = event.detail.class;
            if (newClass) {
                const currentClasses = this.get('classes') || [];
                this.set('classes', [...currentClasses, newClass]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('class-updated', (event) => {
            // Update the existing class in the data
            const updatedClass = event.detail.class;
            if (updatedClass) {
                const currentClasses = this.get('classes') || [];
                const updatedClasses = currentClasses.map(classItem => 
                    classItem.id === updatedClass.id ? updatedClass : classItem
                );
                this.set('classes', updatedClasses);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
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

            // Load classes data
            const classesResponse = await api.withToken(token).get('/classes');
            
            this.set('classes', classesResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load classes data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    onView(event) {
        const { detail } = event;
        const viewClass = this.get('classes').find(classItem => classItem.id === detail.row.id);
        if (viewClass) {
            this.closeAllModals();
            this.set('viewClassData', viewClass);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('class-view-modal');
                if (viewModal) {
                    viewModal.setClassData(viewClass);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editClass = this.get('classes').find(classItem => classItem.id === detail.row.id);
        if (editClass) {
            // Close any open modals first
            this.closeAllModals();
            this.set('updateClassData', editClass);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('class-update-modal');
                if (updateModal) {
                    updateModal.setClassData(editClass);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteClass = this.get('classes').find(classItem => classItem.id === detail.row.id);
        if (deleteClass) {
            // Close any open modals first
            this.closeAllModals();
            this.set('deleteClassData', deleteClass);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('class-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setClassData(deleteClass);
                }
            }, 0);
        }
    }

    onAdd(event) {
        // Close any open modals first
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    updateTableData() {
        const classes = this.get('classes');
        if (!classes) return;

        // Prepare table data
        const tableData = classes.map((classItem, index) => ({
            id: classItem.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: classItem.name,
            section: classItem.section,
            academic_year: classItem.academic_year,
            capacity: classItem.capacity,
            status: classItem.status === 'active' ? 'Active' : 'Inactive',
            created: classItem.created_at,
            updated: classItem.updated_at
        }));

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
        this.set('updateClassData', null);
        this.set('viewClassData', null);
        this.set('deleteClassData', null);
    }

    render() {
        const classes = this.get('classes');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare table data and columns for classes
        const tableData = classes ? classes.map((classItem, index) => ({
            id: classItem.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: classItem.name,
            section: classItem.section,
            academic_year: classItem.academic_year,
            capacity: classItem.capacity,
            status: classItem.status === 'active' ? 'Active' : 'Inactive',
            created: classItem.created_at,
            updated: classItem.updated_at
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'name', label: 'Class Name' },
            { key: 'section', label: 'Section' },
            { key: 'academic_year', label: 'Academic Year' },
            { key: 'capacity', label: 'Capacity' },
            { key: 'status', label: 'Status' },
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
                    <!-- Classes Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Classes Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search classes..."
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
            
            <!-- Add Class Modal -->
            <class-add-modal ${showAddModal ? 'open' : ''}></class-add-modal>
            
            <!-- Update Class Modal -->
            <class-update-modal ${showUpdateModal ? 'open' : ''}></class-update-modal>
            
            <!-- View Class Modal -->
            <class-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></class-view-modal>
            
            <!-- Delete Class Dialog -->
            <class-delete-dialog ${showDeleteDialog ? 'open' : ''}></class-delete-dialog>
        `;
    }
}

customElements.define('app-class-management-page', ClassManagementPage);
export default ClassManagementPage; 