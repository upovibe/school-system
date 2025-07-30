import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/ClassSubjectAddDialog.js';
import '@/components/layout/adminLayout/ClassSubjectUpdateDialog.js';
import '@/components/layout/adminLayout/ClassSubjectViewDialog.js';
import '@/components/layout/adminLayout/ClassSubjectDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Class Subject Management Page
 * 
 * Displays class subjects data using Table component
 */
class ClassSubjectManagementPage extends App {
    constructor() {
        super();
        this.classSubjects = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updateClassSubjectData = null;
        this.viewClassSubjectData = null;
        this.deleteClassSubjectData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Class Subject Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('class-subject-deleted', (event) => {
            // Remove the deleted class subject from the current data
            const deletedClassSubjectId = event.detail.classSubjectId;
            const currentClassSubjects = this.get('classSubjects') || [];
            const updatedClassSubjects = currentClassSubjects.filter(classSubject => classSubject.id !== deletedClassSubjectId);
            this.set('classSubjects', updatedClassSubjects);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('class-subject-saved', (event) => {
            // Close the add modal first
            this.set('showAddModal', false);

            // Add the new class subjects to the existing data
            const newClassSubjects = event.detail.classSubjects;
            if (newClassSubjects && newClassSubjects.length > 0) {
                const currentClassSubjects = this.get('classSubjects') || [];
                this.set('classSubjects', [...currentClassSubjects, ...newClassSubjects]);
                this.updateTableData();
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('class-subject-updated', (event) => {
            // Close the update modal first
            this.set('showUpdateModal', false);

            // Update the existing class subject in the data
            const updatedClassSubject = event.detail.classSubject;
            if (updatedClassSubject) {
                const currentClassSubjects = this.get('classSubjects') || [];
                const updatedClassSubjects = currentClassSubjects.map(classSubject => 
                    classSubject.id === updatedClassSubject.id ? updatedClassSubject : classSubject
                );
                this.set('classSubjects', updatedClassSubjects);
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

            // Load class subjects data
            const classSubjectsResponse = await api.withToken(token).get('/class-subjects');
            
            this.set('classSubjects', classSubjectsResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load class subjects data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    onView(event) {
        const { detail } = event;
        const viewClassSubject = this.get('classSubjects').find(classSubject => classSubject.id === detail.row.id);
        if (viewClassSubject) {
            this.closeAllModals();
            this.set('viewClassSubjectData', viewClassSubject);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewDialog = this.querySelector('class-subject-view-dialog');
                if (viewDialog) {
                    viewDialog.setClassSubjectData(viewClassSubject);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editClassSubject = this.get('classSubjects').find(classSubject => classSubject.id === detail.row.id);
        if (editClassSubject) {
            // Close any open modals first
            this.closeAllModals();
            this.set('updateClassSubjectData', editClassSubject);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('class-subject-update-dialog');
                if (updateModal) {
                    updateModal.setClassSubjectData(editClassSubject);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteClassSubject = this.get('classSubjects').find(classSubject => classSubject.id === detail.row.id);
        if (deleteClassSubject) {
            // Close any open modals first
            this.closeAllModals();
            this.set('deleteClassSubjectData', deleteClassSubject);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('class-subject-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setClassSubjectData(deleteClassSubject);
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
        const classSubjects = this.get('classSubjects');
        if (!classSubjects) return;

        // Prepare table data
        const tableData = classSubjects.map((classSubject, index) => ({
            id: classSubject.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            class_name: classSubject.class_name || 'N/A',
            class_section: classSubject.class_section || 'N/A',
            subject_name: classSubject.subject_name || 'N/A',
            subject_code: classSubject.subject_code || 'N/A',
            academic_year: classSubject.academic_year || 'N/A',
            term: classSubject.term || 'N/A',
            teaching_hours: classSubject.teaching_hours || 0,
            created: classSubject.created_at,
            updated: classSubject.updated_at
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
        this.set('updateClassSubjectData', null);
        this.set('viewClassSubjectData', null);
        this.set('deleteClassSubjectData', null);
    }

    render() {
        const classSubjects = this.get('classSubjects');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare table data and columns for class subjects
        const tableData = classSubjects ? classSubjects.map((classSubject, index) => ({
            id: classSubject.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            class_name: classSubject.class_name || 'N/A',
            class_section: classSubject.class_section || 'N/A',
            subject_name: classSubject.subject_name || 'N/A',
            subject_code: classSubject.subject_code || 'N/A',
            academic_year: classSubject.academic_year || 'N/A',
            term: classSubject.term || 'N/A',
            teaching_hours: classSubject.teaching_hours || 0,
            created: classSubject.created_at,
            updated: classSubject.updated_at
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'class_name', label: 'Class' },
            { key: 'class_section', label: 'Section' },
            { key: 'subject_name', label: 'Subject' },
            { key: 'subject_code', label: 'Subject Code' },
            { key: 'academic_year', label: 'Academic Year' },
            { key: 'term', label: 'Term' },
            { key: 'teaching_hours', label: 'Teaching Hours' },
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
                    <!-- Class Subjects Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Class Subject Assignments"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search class subjects..."
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
            
            <!-- Add Class Subject Dialog -->
            <class-subject-add-dialog ${showAddModal ? 'open' : ''}></class-subject-add-dialog>
            
            <!-- Update Class Subject Dialog -->
            <class-subject-update-dialog ${showUpdateModal ? 'open' : ''}></class-subject-update-dialog>
            
            <!-- View Class Subject Dialog -->
            <class-subject-view-dialog id="view-modal" ${showViewModal ? 'open' : ''}></class-subject-view-dialog>
            
            <!-- Delete Class Subject Dialog -->
            <class-subject-delete-dialog ${showDeleteDialog ? 'open' : ''}></class-subject-delete-dialog>
        `;
    }
}

customElements.define('app-class-subject-management-page', ClassSubjectManagementPage);
export default ClassSubjectManagementPage; 