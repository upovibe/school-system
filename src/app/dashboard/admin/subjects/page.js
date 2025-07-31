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

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Subject Management | School System';
        this.loadData();
        
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
            description: subject.description,
            status: subject.status === 'active' ? 'Active' : 'Inactive',
            created: subject.created_at,
            updated: subject.updated_at
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'name', label: 'Subject Name' },
            { key: 'code', label: 'Code' },
            { key: 'description', label: 'Description' },
            { key: 'status', label: 'Status' },
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