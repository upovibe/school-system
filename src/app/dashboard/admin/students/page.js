import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/StudentDeleteDialog.js';
import '@/components/layout/adminLayout/StudentAddDialog.js';
import '@/components/layout/adminLayout/StudentUpdateDialog.js';
import '@/components/layout/adminLayout/StudentViewDialog.js';
import api from '@/services/api.js';

/**
 * Student Management Page
 * 
 * Displays students data using Table component with navigation to separate pages
 */
class StudentManagementPage extends App {
    constructor() {
        super();
        this.students = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateStudentData = null;
        this.viewStudentData = null;
        this.deleteStudentData = null;
    }

    getHeaderCounts() {
        const students = this.get('students') || [];
        const total = students.length;
        let active = 0;
        let inactive = 0;
        const classSet = new Set();
        students.forEach((s) => {
            const isActive = String(s.status || '').toLowerCase() === 'active' || Number(s.is_active) === 1;
            if (isActive) active += 1; else inactive += 1;
            if (s.class_name) classSet.add(String(s.class_name));
        });
        return { total, active, inactive, classes: classSet.size };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <h1 class="text-2xl sm:text-3xl font-bold">Students</h1>
                            <p class="text-blue-100 text-base sm:text-lg">Manage student records and enrollment</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Students</div>
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
                                    <i class="fas fa-users text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.classes}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Classes</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-user-graduate text-white text-lg sm:text-xl"></i>
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
        document.title = 'Student Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('student-deleted', (event) => {
            // Remove the deleted student from the current data
            const deletedStudentId = event.detail.studentId;
            const currentStudents = this.get('students') || [];
            const updatedStudents = currentStudents.filter(student => student.id !== deletedStudentId);
            this.set('students', updatedStudents);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });

        // Listen for student-saved event to add new student to the list
        this.addEventListener('student-saved', (event) => {
            // Close the add modal first
            this.set('showAddModal', false);

            // Add the new student to the existing data
            const newStudent = event.detail.student;
            if (newStudent) {
                const currentStudents = this.get('students') || [];
                this.set('students', [...currentStudents, newStudent]);
                this.updateTableData();
            } else {
                this.loadData();
            }
        });

        // Listen for student-updated event to update student in the list
        this.addEventListener('student-updated', (event) => {
            // Close the update modal first
            this.set('showUpdateModal', false);

            // Update the existing student in the data
            const updatedStudent = event.detail.student;
            if (updatedStudent) {
                const currentStudents = this.get('students') || [];
                const updatedStudents = currentStudents.map(student => 
                    student.id === updatedStudent.id ? updatedStudent : student
                );
                this.set('students', updatedStudents);
                this.updateTableData();
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

            // Fetch students data
            const response = await api.withToken(token).get('/students');
            
            this.set('students', response.data.data);
            this.updateTableData();
        } catch (error) {
            console.error('Error loading students:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to load students data',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const existing = this.get('students').find(student => student.id === detail.row.id);
        const token = localStorage.getItem('token');
        const loadAndOpen = async () => {
            try {
                const resp = await api.withToken(token).get(`/students/${detail.row.id}`);
                const full = resp?.data?.data || existing;
                this.closeAllModals();
                this.set('viewStudentData', full);
                this.set('showViewModal', true);
                setTimeout(() => {
                    const viewDialog = this.querySelector('student-view-dialog');
                    if (viewDialog) {
                        viewDialog.setStudentData(full);
                    }
                }, 0);
            } catch (_) {
                // fallback to existing
                this.closeAllModals();
                this.set('viewStudentData', existing);
                this.set('showViewModal', true);
                setTimeout(() => {
                    const viewDialog = this.querySelector('student-view-dialog');
                    if (viewDialog) {
                        viewDialog.setStudentData(existing);
                    }
                }, 0);
            }
        };
        if (token) { loadAndOpen(); }
    }

    onEdit(event) {
        const { detail } = event;
        const existing = this.get('students').find(student => student.id === detail.row.id);
        const token = localStorage.getItem('token');
        const needsHydrate = !existing?.parent_name || !existing?.blood_group || !existing?.medical_conditions || !existing?.emergency_contact || !existing?.emergency_phone || !existing?.parent_phone || !existing?.parent_email;
        const openWith = (stu) => {
            this.closeAllModals();
            this.set('updateStudentData', stu);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('student-update-dialog');
                if (updateModal) {
                    updateModal.setStudentData(stu);
                }
            }, 0);
        };
        if (token && needsHydrate) {
            api.withToken(token).get(`/students/${detail.row.id}`)
                .then(resp => openWith(resp?.data?.data || existing))
                .catch(() => openWith(existing));
        } else if (existing) {
            openWith(existing);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteStudent = this.get('students').find(student => student.id === detail.row.id);
        if (deleteStudent) {
            // Close any open modals first
            this.closeAllModals();
            this.set('deleteStudentData', deleteStudent);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('student-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setStudentData(deleteStudent);
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
        const students = this.get('students');
        if (!students) return;

        // Prepare table data
        const tableData = students.map((student, index) => ({
            id: student.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            student_id: student.student_id || 'N/A',
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'N/A',
            email: student.email || 'N/A',
            class_name: student.class_name || 'N/A',
            student_type: student.student_type || 'Day',
            phone: student.phone || 'N/A',
            status: student.status === 'active' ? 'Active' : 'Inactive',
            admission_date: student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A',
            created: student.created_at,
            updated: student.updated_at
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
        this.set('updateStudentData', null);
        this.set('viewStudentData', null);
        this.set('deleteStudentData', null);
    }

    render() {
        const students = this.get('students');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare table data and columns for students
        const tableData = students ? students.map((student, index) => ({
            id: student.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            student_id: student.student_id || 'N/A',
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'N/A',
            email: student.email || 'N/A',
            class_name: student.class_name || 'N/A',
            student_type: student.student_type || 'Day',
            phone: student.phone || 'N/A',
            status: student.status === 'active' ? 'Active' : 'Inactive',
            admission_date: student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A',
            created: student.created_at,
            updated: student.updated_at
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'student_id', label: 'Student ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'class_name', label: 'Class' },
            { key: 'student_type', label: 'Type' },
            { key: 'phone', label: 'Phone' },
            { key: 'status', label: 'Status' },
            { key: 'admission_date', label: 'Admission Date' },
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
                    <!-- Students Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Students Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search students..."
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
            
            <!-- Add Student Dialog -->
            <student-add-dialog ${showAddModal ? 'open' : ''}></student-add-dialog>
            
            <!-- Update Student Dialog -->
            <student-update-dialog ${showUpdateModal ? 'open' : ''}></student-update-dialog>
            
            <!-- View Student Dialog -->
            <student-view-dialog id="view-modal" ${showViewModal ? 'open' : ''}></student-view-dialog>
            
            <!-- Delete Student Dialog -->
            <student-delete-dialog ${showDeleteDialog ? 'open' : ''}></student-delete-dialog>
        `;
    }
}

customElements.define('app-student-management-page', StudentManagementPage);
export default StudentManagementPage; 