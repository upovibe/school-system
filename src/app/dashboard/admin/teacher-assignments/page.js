import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Tabs.js';
import '@/components/layout/adminLayout/TeacherAssignmentAddDialog.js';
import '@/components/layout/adminLayout/TeacherAssignmentUpdateDialog.js';
import '@/components/layout/adminLayout/TeacherAssignmentViewDialog.js';
import '@/components/layout/adminLayout/TeacherAssignmentDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Teacher Assignment Management Page
 * 
 * Displays teacher assignments data using Table component with tabs
 */
class TeacherAssignmentManagementPage extends App {
    constructor() {
        super();
        this.teacherAssignments = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updateTeacherAssignmentData = null;
        this.viewTeacherAssignmentData = null;
        this.deleteTeacherAssignmentData = null;
        this.activeTab = 'table'; // Default to table tab
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Teacher Assignment Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('teacher-assignment-deleted', (event) => {
            // Remove the deleted teacher assignment from the current data
            const deletedTeacherAssignmentId = event.detail.teacherAssignmentId;
            const currentTeacherAssignments = this.get('teacherAssignments') || [];
            const updatedTeacherAssignments = currentTeacherAssignments.filter(teacherAssignment => teacherAssignment.id !== deletedTeacherAssignmentId);
            this.set('teacherAssignments', updatedTeacherAssignments);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('teacher-assignment-saved', (event) => {
            // Close the add modal first
            this.set('showAddModal', false);

            // Add the new teacher assignments to the existing data
            const newTeacherAssignments = event.detail.teacherAssignments;
            if (newTeacherAssignments && newTeacherAssignments.length > 0) {
                const currentTeacherAssignments = this.get('teacherAssignments') || [];
                this.set('teacherAssignments', [...currentTeacherAssignments, ...newTeacherAssignments]);
                this.updateTableData();
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('teacher-assignment-updated', (event) => {
            // Close the update modal first
            this.set('showUpdateModal', false);

            // Update the existing teacher assignment in the data
            const updatedTeacherAssignment = event.detail.teacherAssignment;
            if (updatedTeacherAssignment) {
                const currentTeacherAssignments = this.get('teacherAssignments') || [];
                const updatedTeacherAssignments = currentTeacherAssignments.map(teacherAssignment => 
                    teacherAssignment.id === updatedTeacherAssignment.id ? updatedTeacherAssignment : teacherAssignment
                );
                this.set('teacherAssignments', updatedTeacherAssignments);
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

            // Load teacher assignments data
            const teacherAssignmentsResponse = await api.withToken(token).get('/teacher-assignments');
            
            this.set('teacherAssignments', teacherAssignmentsResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load teacher assignments data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    onView(event) {
        const { detail } = event;
        const viewTeacherAssignment = this.get('teacherAssignments').find(teacherAssignment => teacherAssignment.id === detail.row.id);
        if (viewTeacherAssignment) {
            this.closeAllModals();
            this.set('viewTeacherAssignmentData', viewTeacherAssignment);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewDialog = this.querySelector('teacher-assignment-view-dialog');
                if (viewDialog) {
                    viewDialog.setTeacherAssignmentData(viewTeacherAssignment);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editTeacherAssignment = this.get('teacherAssignments').find(teacherAssignment => teacherAssignment.id === detail.row.id);
        if (editTeacherAssignment) {
            // Close any open modals first
            this.closeAllModals();
            this.set('updateTeacherAssignmentData', editTeacherAssignment);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('teacher-assignment-update-dialog');
                if (updateModal) {
                    updateModal.setTeacherAssignmentData(editTeacherAssignment);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteTeacherAssignment = this.get('teacherAssignments').find(teacherAssignment => teacherAssignment.id === detail.row.id);
        if (deleteTeacherAssignment) {
            // Close any open modals first
            this.closeAllModals();
            this.set('deleteTeacherAssignmentData', deleteTeacherAssignment);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('teacher-assignment-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setTeacherAssignmentData(deleteTeacherAssignment);
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
        const teacherAssignments = this.get('teacherAssignments');
        if (!teacherAssignments) return;

        // Prepare table data
        const tableData = teacherAssignments.map((teacherAssignment, index) => ({
            id: teacherAssignment.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            teacher_name: `${teacherAssignment.teacher_first_name || 'N/A'} ${teacherAssignment.teacher_last_name || 'N/A'}`,
            employee_id: teacherAssignment.employee_id || 'N/A',
            class_name: teacherAssignment.class_name || 'N/A',
            class_section: teacherAssignment.class_section || 'N/A',
            subject_name: teacherAssignment.subject_name || 'N/A',
            subject_code: teacherAssignment.subject_code || 'N/A',
            created: teacherAssignment.created_at,
            updated: teacherAssignment.updated_at
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
        this.set('updateTeacherAssignmentData', null);
        this.set('viewTeacherAssignmentData', null);
        this.set('deleteTeacherAssignmentData', null);
    }

    groupTeacherAssignments(teacherAssignments) {
        const grouped = {};
        teacherAssignments.forEach(assignment => {
            const key = `${assignment.teacher_first_name}-${assignment.teacher_last_name}-${assignment.employee_id}`;
            if (!grouped[key]) {
                grouped[key] = {
                    teacherName: `${assignment.teacher_first_name} ${assignment.teacher_last_name}`,
                    employeeId: assignment.employee_id,
                    classes: {}
                };
            }
            
            // Group by class
            const classKey = `${assignment.class_name}-${assignment.class_section}`;
            if (!grouped[key].classes[classKey]) {
                grouped[key].classes[classKey] = {
                    className: assignment.class_name,
                    classSection: assignment.class_section,
                    subjects: []
                };
            }
            
            // Add subject to the class
            grouped[key].classes[classKey].subjects.push({
                subjectName: assignment.subject_name,
                subjectCode: assignment.subject_code
            });
        });
        
        // Convert to array format and sort
        return Object.values(grouped).map(teacher => ({
            teacherName: teacher.teacherName,
            employeeId: teacher.employeeId,
            classes: Object.values(teacher.classes).sort((a, b) => {
                // Sort by class name, then by section
                if (a.className !== b.className) {
                    return a.className.localeCompare(b.className);
                }
                return a.classSection.localeCompare(b.classSection);
            })
        }));
    }

    render() {
        const teacherAssignments = this.get('teacherAssignments');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare table data and columns for teacher assignments
        const tableData = teacherAssignments ? teacherAssignments.map((teacherAssignment, index) => ({
            id: teacherAssignment.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            teacher_name: `${teacherAssignment.teacher_first_name || 'N/A'} ${teacherAssignment.teacher_last_name || 'N/A'}`,
            employee_id: teacherAssignment.employee_id || 'N/A',
            class_name: teacherAssignment.class_name || 'N/A',
            class_section: teacherAssignment.class_section || 'N/A',
            subject_name: teacherAssignment.subject_name || 'N/A',
            subject_code: teacherAssignment.subject_code || 'N/A',
            created: teacherAssignment.created_at,
            updated: teacherAssignment.updated_at
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'teacher_name', label: 'Teacher' },
            { key: 'employee_id', label: 'Employee ID' },
            { key: 'class_name', label: 'Class' },
            { key: 'class_section', label: 'Section' },
            { key: 'subject_name', label: 'Subject' },
            { key: 'subject_code', label: 'Subject Code' },
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
                    <!-- Tabs Section -->
                    <ui-tabs>
                        <ui-tab-list>
                            <ui-tab value="table">Table</ui-tab>
                            <ui-tab value="preview">Preview</ui-tab>
                        </ui-tab-list>
                        
                        <!-- Table Tab Panel -->
                        <ui-tab-panel value="table">
                            <div class="mb-8">
                                <ui-table 
                                    title="Teacher Assignments"
                                    data='${JSON.stringify(tableData)}'
                                    columns='${JSON.stringify(tableColumns)}'
                                    sortable
                                    searchable
                                    search-placeholder="Search teacher assignments..."
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
                        </ui-tab-panel>
                        
                        <!-- Preview Tab Panel -->
                        <ui-tab-panel value="preview">
                            <div class="space-y-6">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-semibold text-gray-900">Teacher Assignments Preview</h3>
                                    <div class="text-sm text-gray-500">
                                        ${teacherAssignments ? `${teacherAssignments.length} assignments` : '0 assignments'}
                                    </div>
                                </div>
                                
                                ${teacherAssignments && teacherAssignments.length > 0 ? `
                                    <div class="grid gap-6">
                                        ${this.groupTeacherAssignments(teacherAssignments).map(teacherGroup => `
                                            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                                <!-- Teacher Header -->
                                                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex items-center space-x-3">
                                                            <div class="flex-shrink-0">
                                                                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                                    <i class="fas fa-user-tie text-purple-600 text-lg"></i>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 class="text-lg font-semibold text-gray-900">${teacherGroup.teacherName}</h4>
                                                                <p class="text-sm text-gray-600">ID: ${teacherGroup.employeeId}</p>
                                                            </div>
                                                        </div>
                                                        <div class="flex items-center space-x-2">
                                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                ${teacherGroup.classes.length} class${teacherGroup.classes.length !== 1 ? 'es' : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <!-- Classes and Subjects Hierarchy -->
                                                <div class="p-6">
                                                    <div class="space-y-4">
                                                        ${teacherGroup.classes.map(classGroup => `
                                                            <div class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                                                <!-- Class Header -->
                                                                <div class="bg-blue-50 px-4 py-3 border-b border-gray-200">
                                                                    <div class="flex items-center justify-between">
                                                                        <div class="flex items-center space-x-2">
                                                                            <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                                                <i class="fas fa-chalkboard text-blue-600 text-xs"></i>
                                                                            </div>
                                                                            <h5 class="text-sm font-semibold text-gray-900">${classGroup.className} - ${classGroup.classSection}</h5>
                                                                        </div>
                                                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            ${classGroup.subjects.length} subject${classGroup.subjects.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <!-- Subjects List -->
                                                                <div class="p-4">
                                                                    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                                        ${classGroup.subjects.map(subject => `
                                                                            <div class="bg-white rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors">
                                                                                <div class="flex items-center justify-between">
                                                                                    <div class="flex-1">
                                                                                        <div class="flex items-center space-x-2 mb-1">
                                                                                            <div class="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                                                                                <i class="fas fa-book text-green-600 text-xs"></i>
                                                                                            </div>
                                                                                            <h6 class="text-sm font-medium text-gray-900">${subject.subjectName}</h6>
                                                                                        </div>
                                                                                        <span class="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded wi-fit">${subject.subjectCode}</span>
                                                                                    </div>
                                                                                    <div class="flex items-center space-x-1">
                                                                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                            Active
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        `).join('')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <div class="text-center py-12">
                                        <div class="max-w-md mx-auto">
                                            <div class="text-gray-400 mb-4">
                                                <i class="fas fa-user-tie text-6xl"></i>
                                            </div>
                                            <h3 class="text-lg font-medium text-gray-900 mb-2">No Teacher Assignments</h3>
                                            <p class="text-gray-500">No teacher assignments have been created yet. Use the Table tab to add new assignments.</p>
                                        </div>
                                    </div>
                                `}
                            </div>
                        </ui-tab-panel>
                    </ui-tabs>
                `}
            </div>
            
            <!-- Add Teacher Assignment Dialog -->
            <teacher-assignment-add-dialog ${showAddModal ? 'open' : ''}></teacher-assignment-add-dialog>
            
            <!-- Update Teacher Assignment Dialog -->
            <teacher-assignment-update-dialog ${showUpdateModal ? 'open' : ''}></teacher-assignment-update-dialog>
            
            <!-- View Teacher Assignment Dialog -->
            <teacher-assignment-view-dialog id="view-modal" ${showViewModal ? 'open' : ''}></teacher-assignment-view-dialog>
            
            <!-- Delete Teacher Assignment Dialog -->
            <teacher-assignment-delete-dialog ${showDeleteDialog ? 'open' : ''}></teacher-assignment-delete-dialog>
        `;
    }
}

customElements.define('app-teacher-assignment-management-page', TeacherAssignmentManagementPage);
export default TeacherAssignmentManagementPage; 