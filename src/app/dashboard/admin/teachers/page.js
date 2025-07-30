import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/TeacherAddModal.js';
import '@/components/layout/adminLayout/TeacherUpdateModal.js';
import '@/components/layout/adminLayout/TeacherViewModal.js';
import '@/components/layout/adminLayout/TeacherDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Teacher Management Page
 * 
 * Displays teachers data using Table component
 */
class TeacherManagementPage extends App {
    constructor() {
        super();
        this.teachers = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updateTeacherData = null;
        this.viewTeacherData = null;
        this.deleteTeacherData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Teacher Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('teacher-deleted', (event) => {
            // Remove the deleted teacher from the current data
            const deletedTeacherId = event.detail.teacherId;
            const currentTeachers = this.get('teachers') || [];
            const updatedTeachers = currentTeachers.filter(teacher => teacher.id !== deletedTeacherId);
            this.set('teachers', updatedTeachers);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('teacher-saved', (event) => {
            // Close the add modal first
            this.set('showAddModal', false);

            // Add the new teacher to the existing data
            const newTeacher = event.detail.teacher;
            if (newTeacher) {
                const currentTeachers = this.get('teachers') || [];
                this.set('teachers', [...currentTeachers, newTeacher]);
                this.updateTableData();
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('teacher-updated', (event) => {
            // Update the existing teacher in the data
            const updatedTeacher = event.detail.teacher;
            if (updatedTeacher) {
                const currentTeachers = this.get('teachers') || [];
                const updatedTeachers = currentTeachers.map(teacher => 
                    teacher.id === updatedTeacher.id ? updatedTeacher : teacher
                );
                this.set('teachers', updatedTeachers);
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

            // Load teachers data
            const teachersResponse = await api.withToken(token).get('/teachers');
            
            this.set('teachers', teachersResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load teachers data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    onView(event) {
        const { detail } = event;
        const viewTeacher = this.get('teachers').find(teacher => teacher.id === detail.row.id);
        if (viewTeacher) {
            this.closeAllModals();
            this.set('viewTeacherData', viewTeacher);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('teacher-view-modal');
                if (viewModal) {
                    viewModal.setTeacherData(viewTeacher);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editTeacher = this.get('teachers').find(teacher => teacher.id === detail.row.id);
        if (editTeacher) {
            // Close any open modals first
            this.closeAllModals();
            this.set('updateTeacherData', editTeacher);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('teacher-update-modal');
                if (updateModal) {
                    updateModal.setTeacherData(editTeacher);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteTeacher = this.get('teachers').find(teacher => teacher.id === detail.row.id);
        if (deleteTeacher) {
            // Close any open modals first
            this.closeAllModals();
            this.set('deleteTeacherData', deleteTeacher);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('teacher-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setTeacherData(deleteTeacher);
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
        const teachers = this.get('teachers');
        if (!teachers) return;

        // Prepare table data
        const tableData = teachers.map((teacher, index) => ({
            id: teacher.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: teacher.name || 'N/A',
            email: teacher.email || 'N/A',
            employee_id: teacher.employee_id || 'N/A',
            specialization: teacher.specialization || 'N/A',
            qualification: teacher.qualification || 'N/A',
            status: teacher.status === 'active' ? 'Active' : 'Inactive',
            hire_date: teacher.hire_date ? new Date(teacher.hire_date).toLocaleDateString() : 'N/A',
            salary: teacher.salary ? `₵${parseFloat(teacher.salary).toLocaleString()}` : 'N/A',
            created: teacher.created_at,
            updated: teacher.updated_at
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
        this.set('updateTeacherData', null);
        this.set('viewTeacherData', null);
        this.set('deleteTeacherData', null);
    }

    render() {
        const teachers = this.get('teachers');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare table data and columns for teachers
        const tableData = teachers ? teachers.map((teacher, index) => ({
            id: teacher.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: teacher.name || 'N/A',
            email: teacher.email || 'N/A',
            employee_id: teacher.employee_id || 'N/A',
            specialization: teacher.specialization || 'N/A',
            qualification: teacher.qualification || 'N/A',
            status: teacher.status === 'active' ? 'Active' : 'Inactive',
            hire_date: teacher.hire_date ? new Date(teacher.hire_date).toLocaleDateString() : 'N/A',
            salary: teacher.salary ? `₵${parseFloat(teacher.salary).toLocaleString()}` : 'N/A',
            created: teacher.created_at,
            updated: teacher.updated_at
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'employee_id', label: 'Employee ID' },
            { key: 'specialization', label: 'Specialization' },
            { key: 'qualification', label: 'Qualification' },
            { key: 'status', label: 'Status' },
            { key: 'hire_date', label: 'Hire Date' },
            { key: 'salary', label: 'Salary' },
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
                    <!-- Teachers Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Teachers Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search teachers..."
                            pagination
                            page-size="10"
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
            
            <!-- Add Teacher Modal -->
            <teacher-add-modal ${showAddModal ? 'open' : ''}></teacher-add-modal>
            
            <!-- Update Teacher Modal -->
            <teacher-update-modal ${showUpdateModal ? 'open' : ''}></teacher-update-modal>
            
            <!-- View Teacher Modal -->
            <teacher-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></teacher-view-modal>
            
            <!-- Delete Teacher Dialog -->
            <teacher-delete-dialog ${showDeleteDialog ? 'open' : ''}></teacher-delete-dialog>
        `;
    }
}

customElements.define('app-teacher-management-page', TeacherManagementPage);
export default TeacherManagementPage; 