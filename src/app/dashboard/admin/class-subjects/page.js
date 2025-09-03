import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Tabs.js';
import '@/components/layout/adminLayout/ClassSubjectAddDialog.js';
import '@/components/layout/adminLayout/ClassSubjectUpdateDialog.js';
import '@/components/layout/adminLayout/ClassSubjectViewDialog.js';
import '@/components/layout/adminLayout/ClassSubjectDeleteDialog.js';
import '@/components/layout/adminLayout/ClassSubjectDeleteSubjectDialog.js';
import api from '@/services/api.js';

/**
 * Class Subject Management Page
 * 
 * Displays class subjects data using Table component with tabs
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
        this.activeTab = 'table'; // Default to table tab
    }

    getHeaderCounts() {
        const data = this.get('classSubjects') || [];
        const total = data.length;
        const classes = new Set();
        const subjects = new Set();
        data.forEach((a) => {
            classes.add(`${a.class_name}::${a.class_section}`);
            subjects.add(`${a.subject_name}::${a.subject_code}`);
        });
        return { total, classCount: classes.size, subjectCount: subjects.size };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Class Subjects</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-class-subjects-info" title="About Class Subjects">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-class-subject-management-page').loadData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage subject assignments to classes</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Assignments</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-chalkboard text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.classCount}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Classes</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-book text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.subjectCount}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Unique Subjects</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-layer-group text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Assignments</div>
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
        document.title = 'Class Subject Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('class-subject-deleted', (event) => {
            // Check if this is a class deletion (new format) or subject deletion (old format)
            if (event.detail.deletedClass) {
                // Class deletion - remove all subjects for the deleted class
                const deletedClass = event.detail.deletedClass;
                const currentClassSubjects = this.get('classSubjects') || [];
                const updatedClassSubjects = currentClassSubjects.filter(classSubject => 
                    !(classSubject.class_name === deletedClass.className && 
                      classSubject.class_section === deletedClass.classSection)
                );
                this.set('classSubjects', updatedClassSubjects);
                this.updateTableData();
                
                // Close the delete dialog
                this.set('showDeleteDialog', false);
            } else if (event.detail.deletedSubject) {
                // Subject deletion - remove the specific subject from the class
                const deletedSubject = event.detail.deletedSubject;
                const currentClassSubjects = this.get('classSubjects') || [];
                const updatedClassSubjects = currentClassSubjects.filter(classSubject => 
                    !(classSubject.class_name === deletedSubject.className && 
                      classSubject.class_section === deletedSubject.classSection &&
                      classSubject.subject_name === deletedSubject.subjectName &&
                      classSubject.subject_code === deletedSubject.subjectCode)
                );
                this.set('classSubjects', updatedClassSubjects);
                this.updateTableData();
                
                // Close the delete dialog
                this.set('showDeleteSubjectDialog', false);
            } else if (event.detail.classSubjectId) {
                // Old format - individual class subject deletion
                const deletedClassSubjectId = event.detail.classSubjectId;
                const currentClassSubjects = this.get('classSubjects') || [];
                const updatedClassSubjects = currentClassSubjects.filter(classSubject => classSubject.id !== deletedClassSubjectId);
                this.set('classSubjects', updatedClassSubjects);
                this.updateTableData();
                
                // Close the delete dialog
                this.set('showDeleteDialog', false);
            }
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

        // Listen for delete events from view dialog
        this.addEventListener('delete-subject', (event) => {
            console.log('Received delete-subject event from view dialog:', event.detail);
            const { className, classSection, subjectName, subjectCode } = event.detail;
            this.onDeleteSubject(className, classSection, subjectName, subjectCode);
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-class-subjects-info') {
            this.showClassSubjectsInfo();
        }
    }

    showClassSubjectsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-book text-blue-500 mr-2"></i>
                <span class="font-semibold">About Class Subjects</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What are Class Subjects?</h4>
                    <p class="text-gray-700">Class subject assignments connect subjects to specific classes. This is how the system knows which subjects are taught in each class, and which teachers can record grades for those subjects.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Subject</span>
                        <span class="text-sm text-gray-600">e.g., Mathematics (MTH101)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Class</span>
                        <span class="text-sm text-gray-600">e.g., JHS 1, Section A</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Teachers</span>
                        <span class="text-sm text-gray-600">Subject teachers can be assigned per class via Teacher Assignments</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        Update class subjects here, then assign teachers to these subjects in Teacher Assignments for grading access.
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
        const rowData = detail.row;
        
        // For grouped table, handle class-level view
        if (rowData.class_key) {
            this.onViewClass(rowData.class_name, rowData.class_section);
        } else {
            // Fallback to original logic for non-grouped data
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
    }

    onEdit(event) {
        const { detail } = event;
        const rowData = detail.row;
        
        // For grouped table, handle class-level edit
        if (rowData.class_key) {
            this.onEditClass(rowData.class_name, rowData.class_section);
        } else {
            // Fallback to original logic for non-grouped data
            const editClassSubject = this.get('classSubjects').find(classSubject => classSubject.id === detail.row.id);
            if (editClassSubject) {
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
    }

    onDelete(event) {
        const { detail } = event;
        const rowData = detail.row;
        
        // For grouped table, handle class-level delete
        if (rowData.class_key) {
            this.onDeleteClass(rowData.class_name, rowData.class_section);
        } else {
            // Fallback to original logic for non-grouped data
            const deleteClassSubject = this.get('classSubjects').find(classSubject => classSubject.id === detail.row.id);
            if (deleteClassSubject) {
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
    }

    onAdd(event) {
        // Close any open modals first
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onDeleteSubject(className, classSection, subjectName, subjectCode) {
        // Find the specific class subject for this class and subject
        const classSubjects = this.get('classSubjects');
        const subjectAssignment = classSubjects.find(classSubject => 
            classSubject.class_name === className && 
            classSubject.class_section === classSection &&
            classSubject.subject_name === subjectName &&
            classSubject.subject_code === subjectCode
        );
        
        if (subjectAssignment) {
            this.closeAllModals();
            this.set('showDeleteSubjectDialog', true);
            setTimeout(() => {
                const deleteSubjectDialog = this.querySelector('class-subject-delete-subject-dialog');
                if (deleteSubjectDialog) {
                    deleteSubjectDialog.setDeleteSubjectData({
                        classId: subjectAssignment.class_id,
                        subjectId: subjectAssignment.subject_id,
                        className: className,
                        classSection: classSection,
                        subjectName: subjectName,
                        subjectCode: subjectCode
                    });
                }
            }, 0);
        }
    }

    onViewClass(className, classSection) {
        // Find all class subjects for this class
        const classSubjects = this.get('classSubjects');
        const classData = classSubjects.filter(classSubject => 
            classSubject.class_name === className && 
            classSubject.class_section === classSection
        );
        
        if (classData.length > 0) {
            this.closeAllModals();
            this.set('viewClassSubjectData', classData);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewDialog = this.querySelector('class-subject-view-dialog');
                if (viewDialog) {
                    viewDialog.setClassSubjectsData(classData); // Pass all subjects for the class
                }
            }, 0);
        }
    }

    onEditClass(className, classSection) {
        // Find all class subjects for this class
        const classSubjects = this.get('classSubjects');
        const classData = classSubjects.filter(classSubject => 
            classSubject.class_name === className && 
            classSubject.class_section === classSection
        );
        
        if (classData.length > 0) {
            // For edit, we'll pass the first assignment as representative
            const firstAssignment = classData[0];
            
            this.closeAllModals();
            this.set('updateClassSubjectData', firstAssignment);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('class-subject-update-dialog');
                if (updateModal) {
                    // Pass the first assignment as the main data, but also pass all assignments
                    updateModal.setClassSubjectData(firstAssignment, classData);
                }
            }, 0);
        }
    }

    onDeleteClass(className, classSection) {
        // Find all class subjects for this class
        const classSubjects = this.get('classSubjects');
        const classData = classSubjects.filter(classSubject => 
            classSubject.class_name === className && 
            classSubject.class_section === classSection
        );
        
        if (classData.length > 0) {
            // For delete, we'll show the first assignment as representative
            const deleteClassSubject = classData[0];
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

    updateTableData() {
        const classSubjects = this.get('classSubjects');
        if (!classSubjects) return;

        // Group class subjects by class
        const groupedData = this.groupClassSubjects(classSubjects);
        
        // Convert grouped data to table format with proper row grouping
        const tableData = [];
        let rowIndex = 1;
        
        groupedData.forEach(classGroup => {
            const subjectsText = classGroup.subjects.map(subject => 
                `${subject.subjectName} (${subject.subjectCode})`
            ).join(', ');
            
            tableData.push({
                id: `${classGroup.className}-${classGroup.classSection}`, // Composite ID
                index: rowIndex++,
                class_name: classGroup.className,
                class_section: classGroup.classSection,
                subjects: subjectsText,
                subject_count: classGroup.subjects.length,
                updated: new Date().toISOString(), // Placeholder - you might want to track this differently
                // Add metadata for styling and actions
                class_key: `${classGroup.className}-${classGroup.classSection}`,
                subjects_data: classGroup.subjects
            });
        });

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
        this.set('showDeleteSubjectDialog', false);
        this.set('updateClassSubjectData', null);
        this.set('viewClassSubjectData', null);
        this.set('deleteClassSubjectData', null);
    }

    groupClassSubjects(classSubjects) {
        const grouped = {};
        classSubjects.forEach(assignment => {
            const key = `${assignment.class_name}-${assignment.class_section}`;
            if (!grouped[key]) {
                grouped[key] = {
                    className: assignment.class_name,
                    classSection: assignment.class_section,
                    subjects: []
                };
            }
            grouped[key].subjects.push({
                subjectName: assignment.subject_name,
                subjectCode: assignment.subject_code
            });
        });
        return Object.values(grouped);
    }

    render() {
        const classSubjects = this.get('classSubjects');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare grouped table data for class subjects
        const groupedData = classSubjects ? this.groupClassSubjects(classSubjects) : [];
        
        // Convert grouped data to table format with proper row grouping
        const tableData = [];
        let rowIndex = 1;
        
        groupedData.forEach(classGroup => {
            const subjectsText = classGroup.subjects.map(subject => 
                `${subject.subjectName} (${subject.subjectCode})`
            ).join(', ');
            
            tableData.push({
                id: `${classGroup.className}-${classGroup.classSection}`, // Composite ID
                index: rowIndex++,
                class_name: classGroup.className,
                class_section: classGroup.classSection,
                subjects: subjectsText,
                subject_count: classGroup.subjects.length,
                updated: new Date().toISOString(), // Placeholder - you might want to track this differently
                // Add metadata for styling and actions
                class_key: `${classGroup.className}-${classGroup.classSection}`,
                subjects_data: classGroup.subjects
            });
        });

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'class_name', label: 'Class' },
            { key: 'class_section', label: 'Section' },
            { key: 'subjects', label: 'Subjects' },
            { key: 'subject_count', label: 'Subject Count' }
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
                                    title="Class Subject Assignments"
                                    data='${JSON.stringify(tableData)}'
                                    columns='${JSON.stringify(tableColumns)}'
                                    sortable
                                    searchable
                                    search-placeholder="Search class subjects..."
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
                                <div class="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                    <h3 class="text-lg font-semibold text-gray-900">Class Subject Assignments Preview</h3>
                                    <div class="ml-auto flex items-center space-x-4">
                                        <div class="text-sm text-gray-500">
                                            ${classSubjects ? `${classSubjects.length} assignments` : '0 assignments'}
                                        </div>
                                        <button 
                                            onclick="this.closest('app-class-subject-management-page').onAdd()"
                                            class="inline-flex items-center px-2 py-1.5 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150">
                                            <i class="fas fa-plus"></i>
                                            <span class="hidden md:inline">Add Assignment</span>
                                        </button>
                                    </div>
                                </div>
                                
                                ${classSubjects && classSubjects.length > 0 ? `
                                    <div class="grid gap-6">
                                        ${this.groupClassSubjects(classSubjects).map(classGroup => `
                                            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                                <!-- Class Header -->
                                                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex items-center space-x-3">
                                                            <div class="flex-shrink-0">
                                                                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                    <i class="fas fa-chalkboard-teacher text-blue-600 text-lg"></i>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 class="text-lg font-semibold text-gray-900">${classGroup.className}</h4>
                                                                <p class="text-sm text-gray-600">Section ${classGroup.classSection}</p>
                                                            </div>
                                                        </div>
                                                        <div class="flex items-center space-x-2">
                                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                ${classGroup.subjects.length} subject${classGroup.subjects.length !== 1 ? 's' : ''}
                                                            </span>
                                                            <div class="flex items-center space-x-1">
                                                                <button 
                                                                    onclick="this.closest('app-class-subject-management-page').onViewClass('${classGroup.className}', '${classGroup.classSection}')"
                                                                    class="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                                    title="View subjects">
                                                                    <i class="fas fa-eye text-sm"></i>
                                                                </button>
                                                                <button 
                                                                    onclick="this.closest('app-class-subject-management-page').onEditClass('${classGroup.className}', '${classGroup.classSection}')"
                                                                    class="inline-flex items-center p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                                                                    title="Edit subjects">
                                                                    <i class="fas fa-edit text-sm"></i>
                                                                </button>
                                                                <button 
                                                                    onclick="this.closest('app-class-subject-management-page').onDeleteClass('${classGroup.className}', '${classGroup.classSection}')"
                                                                    class="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                                    title="Delete all subjects">
                                                                    <i class="fas fa-trash text-sm"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <!-- Subjects List -->
                                                <div class="p-6">
                                                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                        ${classGroup.subjects.map(subject => `
                                                            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                                                                <div class="flex items-start justify-between">
                                                                    <div class="flex-1">
                                                                        <div class="flex items-center space-x-2 mb-2">
                                                                            <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                                                                <i class="fas fa-book text-green-600 text-xs"></i>
                                                                            </div>
                                                                            <h5 class="text-sm font-medium text-gray-900">${subject.subjectName}</h5>
                                                                        </div>
                                                                        <span class="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded w-fit">${subject.subjectCode}</span>
                                                                    </div>
                                                                    <div class="flex items-center space-x-1">
                                                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                            Active
                                                                        </span>
                                                                        <button 
                                                                            onclick="this.closest('app-class-subject-management-page').onDeleteSubject('${classGroup.className}', '${classGroup.classSection}', '${subject.subjectName}', '${subject.subjectCode}')"
                                                                            class="inline-flex items-center p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                                                            title="Delete this subject">
                                                                            <i class="fas fa-trash text-xs"></i>
                                                                        </button>
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
                                        <i class="fas fa-chalkboard-teacher text-6xl"></i>
                                    </div>
                                            <h3 class="text-lg font-medium text-gray-900 mb-2">No Class Subject Assignments</h3>
                                            <p class="text-gray-500">No class subject assignments have been created yet. Use the Table tab to add new assignments.</p>
                                        </div>
                                    </div>
                                `}
                            </div>
                        </ui-tab-panel>
                    </ui-tabs>
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
            
            <!-- Delete Subject Dialog -->
            <class-subject-delete-subject-dialog ${this.get('showDeleteSubjectDialog') ? 'open' : ''}></class-subject-delete-subject-dialog>
        `;
    }
}

customElements.define('app-class-subject-management-page', ClassSubjectManagementPage);
export default ClassSubjectManagementPage; 