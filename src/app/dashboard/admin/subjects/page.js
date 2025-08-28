import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/SubjectAddModal.js';
import '@/components/layout/adminLayout/SubjectUpdateModal.js';
import '@/components/layout/adminLayout/SubjectViewModal.js';
import '@/components/layout/adminLayout/SubjectDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Subject Management Page
 * 
 * Displays subjects data using Table component
 */
class SubjectManagementPage extends App {
    constructor() {
        super();
        this.subjects = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updateSubjectData = null;
        this.viewSubjectData = null;
        this.deleteSubjectData = null;
    }

    // Summary for header
    getHeaderCounts() {
        const subjects = this.get('subjects') || [];
        const total = subjects.length;
        let active = 0;
        let inactive = 0;
        const categorySet = new Set();
        subjects.forEach((s) => {
            const isActive = String(s.status || '').toLowerCase() === 'active' || Number(s.is_active) === 1;
            if (isActive) active += 1; else inactive += 1;
            if (s.category) categorySet.add(String(s.category));
        });
        return { total, active, inactive, categories: categorySet.size };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Subjects</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-subjects-info" title="About Subjects">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage subjects and categories</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Subjects</div>
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
                                <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-tags text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.categories}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Categories</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-book text-white text-lg sm:text-xl"></i>
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
        document.title = 'Subject Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('subject-deleted', (event) => {
            // Remove the deleted subject from the current data
            const deletedSubjectId = event.detail.subjectId;
            const currentSubjects = this.get('subjects') || [];
            const updatedSubjects = currentSubjects.filter(subject => subject.id !== deletedSubjectId);
            this.set('subjects', updatedSubjects);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('subject-saved', (event) => {
            // Add the new subject to the existing data
            const newSubject = event.detail.subject;
            if (newSubject) {
                const currentSubjects = this.get('subjects') || [];
                this.set('subjects', [...currentSubjects, newSubject]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('subject-updated', (event) => {
            // Update the existing subject in the data
            const updatedSubject = event.detail.subject;
            if (updatedSubject) {
                const currentSubjects = this.get('subjects') || [];
                const updatedSubjects = currentSubjects.map(subject => 
                    subject.id === updatedSubject.id ? updatedSubject : subject
                );
                this.set('subjects', updatedSubjects);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-subjects-info') {
            this.showSubjectsInfo();
        }
    }

    showSubjectsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-book text-blue-500 mr-2"></i>
                <span class="font-semibold">About Subjects</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What is a Subject in this system?</h4>
                    <p class="text-gray-700">Subjects represent courses taught in the school (e.g., Mathematics, English). Each subject has a name, code, category, and status. Subjects can be assigned to classes and linked to grading periods for recording student grades.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Name</span>
                        <span class="text-sm text-gray-600">Human-readable title (e.g., Mathematics)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Code</span>
                        <span class="text-sm text-gray-600">Short identifier (e.g., MTH101)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Category</span>
                        <span class="text-sm text-gray-600">Core or elective grouping used for reporting</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Status</span>
                        <span class="text-sm text-gray-600">Active subjects are selectable throughout the app</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        Assign subjects to classes in Class Subjects. Grades recorded against a subject roll up into class and student reports.
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

            // Load subjects data
            const subjectsResponse = await api.withToken(token).get('/subjects');
            
            this.set('subjects', subjectsResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load subjects data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewSubject = this.get('subjects').find(subject => subject.id === detail.row.id);
        if (viewSubject) {
            this.closeAllModals();
            this.set('viewSubjectData', viewSubject);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('subject-view-modal');
                if (viewModal) {
                    viewModal.setSubjectData(viewSubject);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editSubject = this.get('subjects').find(subject => subject.id === detail.row.id);
        if (editSubject) {
            // Close any open modals first
            this.closeAllModals();
            this.set('updateSubjectData', editSubject);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('subject-update-modal');
                if (updateModal) {
                    updateModal.setSubjectData(editSubject);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteSubject = this.get('subjects').find(subject => subject.id === detail.row.id);
        if (deleteSubject) {
            // Close any open modals first
            this.closeAllModals();
            this.set('deleteSubjectData', deleteSubject);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('subject-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setSubjectData(deleteSubject);
                }
            }, 0);
        }
    }

    onAdd(event) {
        // Close any open modals first
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onRefresh(event) {
        this.loadData();
    }

    // Update table data without full page reload
    updateTableData() {
        const subjects = this.get('subjects');
        if (!subjects) return;

        // Prepare table data
        const tableData = subjects.map((subject, index) => ({
            id: subject.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: subject.name,
            code: subject.code,
            category: subject.category || 'core',
            description: subject.description,
            status: subject.status === 'active' ? 'Active' : 'Inactive',
            created: subject.created_at,
            updated: subject.updated_at
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
        this.set('updateSubjectData', null);
        this.set('viewSubjectData', null);
        this.set('deleteSubjectData', null);
    }

    render() {
        const subjects = this.get('subjects');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare table data and columns for subjects
        const tableData = subjects ? subjects.map((subject, index) => ({
            id: subject.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: subject.name,
            code: subject.code,
            category: subject.category || 'core',
            description: subject.description,
            status: subject.status === 'active' ? 'Active' : 'Inactive',
            created: subject.created_at,
            updated: subject.updated_at
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'name', label: 'Subject Name' },
            { key: 'code', label: 'Code' },
            { key: 'category', label: 'Category' },
            { key: 'description', label: 'Description' },
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
                    <!-- Subjects Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Subjects Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search subjects..."
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
            
            <!-- Add Subject Modal -->
            <subject-add-modal ${showAddModal ? 'open' : ''}></subject-add-modal>
            
            <!-- Update Subject Modal -->
            <subject-update-modal ${showUpdateModal ? 'open' : ''}></subject-update-modal>
            
            <!-- View Subject Modal -->
            <subject-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></subject-view-modal>
            
            <!-- Delete Subject Dialog -->
            <subject-delete-dialog ${showDeleteDialog ? 'open' : ''}></subject-delete-dialog>
        `;
    }
}

customElements.define('app-subject-management-page', SubjectManagementPage);
export default SubjectManagementPage; 