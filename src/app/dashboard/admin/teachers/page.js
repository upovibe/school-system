import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/TeacherAddDialog.js';
import '@/components/layout/adminLayout/TeacherUpdateDialog.js';
import '@/components/layout/adminLayout/TeacherViewDialog.js';
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

    getHeaderCounts() {
        const teachers = this.get('teachers') || [];
        const total = teachers.length;
        let active = 0;
        let inactive = 0;
        const classAssigned = teachers.filter(t => t.class_name && t.class_section).length;
        teachers.forEach((t) => {
            const isActive = String(t.status || '').toLowerCase() === 'active' || Number(t.is_active) === 1;
            if (isActive) active += 1; else inactive += 1;
        });
        return { total, active, inactive, classAssigned };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Teachers</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-teachers-info" title="About Teachers">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-teacher-management-page').loadData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage teacher records and assignments</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Teachers</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                                    <i class="fas fa-chalkboard-teacher text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.classAssigned}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Class Teachers</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-user-tie text-white text-lg sm:text-xl"></i>
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
        document.title = 'Teacher Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
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
            // Close the update modal first
            this.set('showUpdateModal', false);

            // Update the existing teacher in the data
            const updatedTeacher = event.detail.teacher;
            if (updatedTeacher) {
                const currentTeachers = this.get('teachers') || [];
                const updatedTeachers = currentTeachers.map(teacher => 
                    teacher.id === updatedTeacher.id ? updatedTeacher : teacher
                );
                this.set('teachers', updatedTeachers);
                this.updateTableData();
            } else {
                this.loadData();
            }
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-teachers-info') {
            this.showTeachersInfo();
        }
    }

    showTeachersInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-chalkboard-teacher text-blue-500 mr-2"></i>
                <span class="font-semibold">About Teachers</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Teacher Records</h4>
                    <p class="text-gray-700">This page manages teacher profiles, employment details, class teacher assignments, and subject teaching assignments. Important validations include no future dates for hire or birth and minimum age requirements.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Employee ID</span>
                        <span class="text-sm text-gray-600">Unique identifier for each teacher</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Hire Date</span>
                        <span class="text-sm text-gray-600">Cannot be in the future</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Date of Birth</span>
                        <span class="text-sm text-gray-600">At least 10 years old; not in the future</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Class Teacher</span>
                        <span class="text-sm text-gray-600">Optional homeroom/class ownership</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Subject Teacher</span>
                        <span class="text-sm text-gray-600">Assign teachers to teach specific subjects in specific classes</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Status</span>
                        <span class="text-sm text-gray-600">Active teachers are visible and assignable</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        As subject teachers, they can record grades for their assigned subjects/classes. Without a class teacher assignment, class-dependent pages will show empty results instead of errors.
                    </p>
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

            // Load teachers data
            const teachersResponse = await api.withToken(token).get('/teachers');
            
            this.set('teachers', teachersResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
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
                const viewDialog = this.querySelector('teacher-view-dialog');
                if (viewDialog) {
                    viewDialog.setTeacherData(viewTeacher);
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
                const updateModal = this.querySelector('teacher-update-dialog');
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
            class: teacher.class_name ? `${teacher.class_name} ${teacher.class_section}` : 'Not Assigned',
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
            class: teacher.class_name ? `${teacher.class_name} ${teacher.class_section}` : 'Not Assigned',
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
            { key: 'class', label: 'Class Teacher' },
            { key: 'status', label: 'Status' },
            { key: 'hire_date', label: 'Hire Date' },
            { key: 'salary', label: 'Salary' },
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
            
            <!-- Add Teacher Dialog -->
            <teacher-add-dialog ${showAddModal ? 'open' : ''}></teacher-add-dialog>
            
            <!-- Update Teacher Dialog -->
            <teacher-update-dialog ${showUpdateModal ? 'open' : ''}></teacher-update-dialog>
            
            <!-- View Teacher Dialog -->
            <teacher-view-dialog id="view-modal" ${showViewModal ? 'open' : ''}></teacher-view-dialog>
            
            <!-- Delete Teacher Dialog -->
            <teacher-delete-dialog ${showDeleteDialog ? 'open' : ''}></teacher-delete-dialog>
        `;
    }
}

customElements.define('app-teacher-management-page', TeacherManagementPage);
export default TeacherManagementPage; 