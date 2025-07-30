import App from '@/core/App.js';
import '@/components/layout/adminLayout/TeacherAddModal.js';
import '@/components/layout/adminLayout/TeacherUpdateModal.js';
import '@/components/layout/adminLayout/TeacherViewModal.js';
import '@/components/layout/adminLayout/TeacherDeleteDialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Management Page Component
 * 
 * A page component for managing teachers in the admin panel
 * 
 * Features:
 * - Display teachers in a table
 * - Add new teachers
 * - Update existing teachers
 * - View teacher details
 * - Delete teachers
 * - Search teachers
 * - Refresh data
 */
class TeacherManagementPage extends HTMLElement {
    constructor() {
        super();
        this.teachers = null;
        this.loading = false;
        this.error = null;
    }

    static get observedAttributes() {
        return ['data-page'];
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Teacher Management - Admin Dashboard';
        this.render();
        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        // Table action events
        this.addEventListener('table-view', (e) => this.onView(e.detail));
        this.addEventListener('table-edit', (e) => this.onEdit(e.detail));
        this.addEventListener('table-delete', (e) => this.onDelete(e.detail));
        this.addEventListener('table-add', () => this.onAdd());
        this.addEventListener('table-refresh', () => this.onRefresh());

        // Modal events
        this.addEventListener('teacher-saved', () => {
            this.loadData();
            this.closeAllModals();
        });

        this.addEventListener('teacher-updated', () => {
            this.loadData();
            this.closeAllModals();
        });

        this.addEventListener('teacher-deleted', () => {
            this.loadData();
            this.closeAllModals();
        });
    }

    async loadData() {
        try {
            this.loading = true;
            this.error = null;
            this.updateTableData();

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await api.withToken(token).get('/teachers');
            
            if (response.status === 200 && response.data.success) {
                this.teachers = response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to load teachers');
            }
        } catch (error) {
            console.error('❌ Error loading teachers:', error);
            this.error = error.message || 'Failed to load teachers';
            Toast.show({
                title: 'Error',
                message: this.error,
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.loading = false;
            this.updateTableData();
        }
    }

    onView(teacher) {
        const viewModal = this.querySelector('teacher-view-modal');
        if (viewModal) {
            viewModal.setTeacherData(teacher);
            viewModal.open();
        }
    }

    onEdit(teacher) {
        const updateModal = this.querySelector('teacher-update-modal');
        if (updateModal) {
            updateModal.setTeacherData(teacher);
            updateModal.open();
        }
    }

    onDelete(teacher) {
        const deleteDialog = this.querySelector('teacher-delete-dialog');
        if (deleteDialog) {
            deleteDialog.setTeacherData(teacher);
            deleteDialog.open();
        }
    }

    onAdd() {
        const addModal = this.querySelector('teacher-add-modal');
        if (addModal) {
            addModal.open();
        }
    }

    onRefresh() {
        this.loadData();
    }

    updateTableData() {
        const table = this.querySelector('ui-table');
        if (table) {
            if (this.loading) {
                table.setAttribute('loading', '');
            } else {
                table.removeAttribute('loading');
            }

            if (this.error) {
                table.setAttribute('error', this.error);
            } else {
                table.removeAttribute('error');
            }

            if (this.teachers) {
                const tableData = this.teachers.map(teacher => ({
                    id: teacher.id,
                    name: teacher.name || 'N/A',
                    email: teacher.email || 'N/A',
                    employee_id: teacher.employee_id || 'N/A',
                    specialization: teacher.specialization || 'N/A',
                    qualification: teacher.qualification || 'N/A',
                    status: teacher.status || 'N/A',
                    hire_date: teacher.hire_date ? new Date(teacher.hire_date).toLocaleDateString() : 'N/A',
                    salary: teacher.salary ? `₵${parseFloat(teacher.salary).toLocaleString()}` : 'N/A'
                }));
                table.setAttribute('data', JSON.stringify(tableData));
            }
        }
    }

    closeAllModals() {
        const modals = this.querySelectorAll('teacher-add-modal, teacher-update-modal, teacher-view-modal, teacher-delete-dialog');
        modals.forEach(modal => {
            if (modal.hasAttribute('open')) {
                modal.removeAttribute('open');
            }
        });
    }

    render() {
        this.innerHTML = `
            <div class="container mx-auto px-4 py-6">
                <div class="mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">Teacher Management</h1>
                    <p class="text-gray-600">Manage teachers, their qualifications, and assignments</p>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <ui-table 
                        title="Teachers"
                        description="Manage all teachers in the system"
                        :columns='[
                            {"key": "name", "label": "Name", "sortable": true},
                            {"key": "email", "label": "Email", "sortable": true},
                            {"key": "employee_id", "label": "Employee ID", "sortable": true},
                            {"key": "specialization", "label": "Specialization", "sortable": true},
                            {"key": "qualification", "label": "Qualification", "sortable": true},
                            {"key": "status", "label": "Status", "sortable": true},
                            {"key": "hire_date", "label": "Hire Date", "sortable": true},
                            {"key": "salary", "label": "Salary", "sortable": true}
                        ]'
                        :actions='[
                            {"key": "view", "label": "View", "icon": "fas fa-eye", "variant": "secondary"},
                            {"key": "edit", "label": "Edit", "icon": "fas fa-edit", "variant": "primary"},
                            {"key": "delete", "label": "Delete", "icon": "fas fa-trash", "variant": "danger"}
                        ]'
                        :search="true"
                        :pagination="true"
                        :refresh="true"
                        :add="true"
                        add-label="Add Teacher">
                    </ui-table>
                </div>

                <!-- Modals and Dialogs -->
                <teacher-add-modal></teacher-add-modal>
                <teacher-update-modal></teacher-update-modal>
                <teacher-view-modal></teacher-view-modal>
                <teacher-delete-dialog></teacher-delete-dialog>
            </div>
        `;
    }
}

customElements.define('teacher-management-page', TeacherManagementPage);
export default TeacherManagementPage; 