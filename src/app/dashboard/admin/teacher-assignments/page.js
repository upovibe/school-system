import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Tabs.js';
import '@/components/layout/adminLayout/TeacherAssignmentAddDialog.js';
import '@/components/layout/adminLayout/TeacherAssignmentViewDialog.js';
import '@/components/layout/adminLayout/TeacherAssignmentDeleteDialog.js';
import '@/components/layout/adminLayout/TeacherAssignmentDeleteClassDialog.js';
import '@/components/layout/adminLayout/TeacherAssignmentDeleteSubjectDialog.js';
import '@/components/layout/adminLayout/TeacherAssignmentEditClassDialog.js';
import '@/components/layout/adminLayout/TeacherAssignmentUpdateDialog.js';
import '@/components/layout/adminLayout/ClassSubjectUpdateDialog.js';
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
        this.showClassSubjectUpdateDialog = false;
    }

    getHeaderCounts() {
        const data = this.get('teacherAssignments') || [];
        const total = data.length;
        const teacherSet = new Set();
        const classSet = new Set();
        data.forEach((a) => {
            teacherSet.add(a.employee_id);
            classSet.add(`${a.class_name}::${a.class_section}`);
        });
        return { total, teachers: teacherSet.size, classes: classSet.size };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <h1 class="text-2xl sm:text-3xl font-bold">Teacher Assignments</h1>
                            <p class="text-blue-100 text-base sm:text-lg">Manage class and subject assignments for teachers</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Assignments</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-user-tie text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.teachers}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Teachers</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-chalkboard text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.classes}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Classes</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-tasks text-white text-lg sm:text-xl"></i>
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
        
        this.addEventListener('teacher-class-assignments-deleted', (event) => {
            // Remove the deleted class assignments from the current data
            const deletedAssignments = event.detail.deletedAssignments;
            const currentTeacherAssignments = this.get('teacherAssignments') || [];
            const updatedTeacherAssignments = currentTeacherAssignments.filter(assignment => 
                !deletedAssignments.some(deletedAssignment => deletedAssignment.id === assignment.id)
            );
            this.set('teacherAssignments', updatedTeacherAssignments);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteClassDialog', false);
        });
        
        this.addEventListener('teacher-subject-assignment-deleted', (event) => {
            // Remove the deleted subject assignment from the current data
            const deletedAssignment = event.detail.deletedAssignment;
            const currentTeacherAssignments = this.get('teacherAssignments') || [];
            const updatedTeacherAssignments = currentTeacherAssignments.filter(assignment => 
                assignment.id !== deletedAssignment.id
            );
            this.set('teacherAssignments', updatedTeacherAssignments);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteSubjectDialog', false);
        });
        
        this.addEventListener('teacher-class-assignments-updated', (event) => {
            // Update the assignments for the specific class with full details
            const updatedAssignments = event.detail.updatedAssignments;
            const currentTeacherAssignments = this.get('teacherAssignments') || [];
            
            // Remove old assignments for this teacher and class
            const filteredAssignments = currentTeacherAssignments.filter(assignment => 
                !(assignment.teacher_id === event.detail.teacherId && 
                  assignment.class_name === event.detail.className && 
                  assignment.class_section === event.detail.classSection)
            );
            
            // Add the new assignments with full details
            const updatedTeacherAssignments = [...filteredAssignments, ...updatedAssignments];
            this.set('teacherAssignments', updatedTeacherAssignments);
            this.updateTableData();
            
            // Close the edit dialog
            this.set('showEditClassDialog', false);
            this.set('showUpdateModal', false);
            this.set('showClassSubjectUpdateDialog', false);
        });

        // Listen for delete events from view dialog
        this.addEventListener('delete-class', (event) => {
            console.log('Received delete-class event:', event.detail);
            const { employeeId, className, classSection } = event.detail;
            this.onDeleteClass(employeeId, className, classSection);
        });

        this.addEventListener('delete-subject', (event) => {
            console.log('Received delete-subject event:', event.detail);
            const { employeeId, className, classSection, subjectName, subjectCode } = event.detail;
            this.onDeleteSubject(employeeId, className, classSection, subjectName, subjectCode);
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
        const rowData = detail.row;
        
        // For grouped table, handle teacher-level view
        if (rowData.teacher_employee_id) {
            this.onViewTeacher(rowData.teacher_employee_id);
        } else {
            // Fallback to original logic for non-grouped data
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
    }

    onEdit(event) {
        const { detail } = event;
        const rowData = detail.row;
        
        // For grouped table, handle teacher-level edit
        if (rowData.teacher_employee_id) {
            this.onEditTeacher(rowData.teacher_employee_id);
        } else {
            // Fallback to original logic for non-grouped data
            const editTeacherAssignment = this.get('teacherAssignments').find(teacherAssignment => teacherAssignment.id === detail.row.id);
            if (editTeacherAssignment) {
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
    }

    onDelete(event) {
        const { detail } = event;
        const rowData = detail.row;
        
        // For grouped table, handle teacher-level delete
        if (rowData.teacher_employee_id) {
            this.onDeleteTeacher(rowData.teacher_employee_id);
        } else {
            // Fallback to original logic for non-grouped data
            const deleteTeacherAssignment = this.get('teacherAssignments').find(teacherAssignment => teacherAssignment.id === detail.row.id);
            if (deleteTeacherAssignment) {
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
    }

    onAdd(event) {
        // Close any open modals first
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onViewTeacher(employeeId) {
        // Find all teacher assignments for this employee
        const teacherAssignments = this.get('teacherAssignments');
        const teacherData = teacherAssignments.filter(assignment => assignment.employee_id === employeeId);
        
        if (teacherData.length > 0) {
            this.closeAllModals();
            this.set('viewTeacherAssignmentData', teacherData);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewDialog = this.querySelector('teacher-assignment-view-dialog');
                if (viewDialog) {
                    viewDialog.setTeacherAssignments(teacherData);
                }
            }, 0);
        }
    }

    onEditTeacher(employeeId) {
        // Find all teacher assignments for this employee
        const teacherAssignments = this.get('teacherAssignments');
        const teacherData = teacherAssignments.filter(assignment => assignment.employee_id === employeeId);
        
        if (teacherData.length > 0) {
            // For edit, we'll pass all assignments for this teacher
            const firstAssignment = teacherData[0];
            
            this.closeAllModals();
            this.set('updateTeacherAssignmentData', firstAssignment);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('teacher-assignment-update-dialog');
                if (updateModal) {
                    // Pass the first assignment as the main data, but also pass all assignments
                    updateModal.setTeacherAssignmentData(firstAssignment, teacherData);
                }
            }, 0);
        }
    }

    onDeleteTeacher(employeeId) {
        // Find all teacher assignments for this employee
        const teacherAssignments = this.get('teacherAssignments');
        const teacherData = teacherAssignments.filter(assignment => assignment.employee_id === employeeId);
        
        if (teacherData.length > 0) {
            // For delete, we'll show the first assignment as representative
            const deleteTeacherAssignment = teacherData[0];
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

    onDeleteClass(employeeId, className, classSection) {
        // Find the teacher assignments for this employee
        const teacherAssignments = this.get('teacherAssignments');
        const teacherData = teacherAssignments.filter(assignment => assignment.employee_id === employeeId);
        
        if (teacherData.length > 0) {
            // Find assignments for this specific class
            const classAssignments = teacherData.filter(assignment => 
                assignment.class_name === className && assignment.class_section === classSection
            );
            
            if (classAssignments.length > 0) {
                const firstAssignment = classAssignments[0];
                this.closeAllModals();
                this.set('showDeleteClassDialog', true);
                setTimeout(() => {
                    const deleteClassDialog = this.querySelector('teacher-assignment-delete-class-dialog');
                    if (deleteClassDialog) {
                        deleteClassDialog.setDeleteClassData({
                            teacherId: firstAssignment.teacher_id,
                            employeeId: employeeId,
                            className: className,
                            classSection: classSection,
                            assignments: classAssignments
                        });
                    }
                }, 0);
            }
        }
    }

    onEditClass(employeeId, className, classSection) {
        // Find the teacher assignments for this employee
        const teacherAssignments = this.get('teacherAssignments');
        const teacherData = teacherAssignments.filter(assignment => assignment.employee_id === employeeId);
        
        if (teacherData.length > 0) {
            // Find assignments for this specific class
            const classAssignments = teacherData.filter(assignment => 
                assignment.class_name === className && assignment.class_section === classSection
            );
            
            if (classAssignments.length > 0) {
                const firstAssignment = classAssignments[0];
                this.closeAllModals();
                this.set('showEditClassDialog', true);
                setTimeout(() => {
                    const editClassDialog = this.querySelector('teacher-assignment-edit-class-dialog');
                    if (editClassDialog) {
                        editClassDialog.setEditClassData({
                            teacherId: firstAssignment.teacher_id,
                            employeeId: employeeId,
                            className: className,
                            classSection: classSection,
                            assignments: classAssignments,
                            teacherName: `${firstAssignment.teacher_first_name} ${firstAssignment.teacher_last_name}`,
                            teacherEmployeeId: firstAssignment.employee_id
                        });
                    }
                }, 0);
            }
        }
    }

    onUpdateClassSubjects(employeeId, className, classSection) {
        // Find the teacher assignments for this employee
        const teacherAssignments = this.get('teacherAssignments') || [];
        const teacherData = teacherAssignments.filter(assignment => assignment.employee_id === employeeId);
        
        if (teacherData.length > 0) {
            // Find assignments for this specific class
            const classAssignments = teacherData.filter(assignment => 
                assignment.class_name === className && assignment.class_section === classSection
            );
            
            if (classAssignments.length > 0) {
                const first = classAssignments[0];
                this.closeAllModals();
                this.set('showClassSubjectUpdateDialog', true);
                setTimeout(() => {
                    const dlg = this.querySelector('class-subject-update-dialog');
                    if (dlg) {
                        dlg.setClassSubjectData({
                            classId: first.class_id,
                            className: className,
                            classSection: classSection,
                            teacherId: first.teacher_id,
                            employeeId: first.employee_id,
                            teacherFirstName: first.teacher_first_name,
                            teacherLastName: first.teacher_last_name,
                            assignments: classAssignments
                        });
                    }
                }, 0);
            }
        }
    }

    onDeleteSubject(employeeId, className, classSection, subjectName, subjectCode) {
        // Find the teacher assignments for this employee
        const teacherAssignments = this.get('teacherAssignments');
        const teacherData = teacherAssignments.filter(assignment => assignment.employee_id === employeeId);
        
        if (teacherData.length > 0) {
            // Find the specific assignment for this class and subject
            const subjectAssignment = teacherData.find(assignment => 
                assignment.class_name === className && 
                assignment.class_section === classSection &&
                assignment.subject_name === subjectName &&
                assignment.subject_code === subjectCode
            );
            
            if (subjectAssignment) {
                this.closeAllModals();
                this.set('showDeleteSubjectDialog', true);
                setTimeout(() => {
                    const deleteSubjectDialog = this.querySelector('teacher-assignment-delete-subject-dialog');
                    if (deleteSubjectDialog) {
                        deleteSubjectDialog.setDeleteSubjectData({
                            teacherId: subjectAssignment.teacher_id,
                            employeeId: employeeId,
                            className: className,
                            classSection: classSection,
                            subjectName: subjectName,
                            subjectCode: subjectCode,
                            assignment: subjectAssignment
                        });
                    }
                }, 0);
            }
        }
    }



    updateTableData() {
        const teacherAssignments = this.get('teacherAssignments');
        if (!teacherAssignments) return;

        // Build grouped table data consistent with render()
        const groupedData = this.groupTeacherAssignments(teacherAssignments);
        const tableData = [];
        let rowIndex = 1;
        groupedData.forEach(teacher => {
            teacher.classes.forEach((classInfo, classIndex) => {
                const subjectsText = classInfo.subjects.map(subject => 
                    `${subject.subjectName} (${subject.subjectCode})`
                ).join(', ');
                const isFirstClass = classIndex === 0;
                tableData.push({
                    id: `${teacher.employeeId}-${classInfo.className}-${classInfo.classSection}`,
                    index: rowIndex++,
                    teacher_name: isFirstClass ? teacher.teacherName : '',
                    employee_id: isFirstClass ? teacher.employeeId : '',
                    class_name: classInfo.className,
                    class_section: classInfo.classSection,
                    subjects: subjectsText,
                    subject_count: classInfo.subjects.length,
                    updated: new Date().toISOString(),
                    teacher_employee_id: teacher.employeeId,
                    teacher_name_full: teacher.teacherName,
                    is_first_class: isFirstClass,
                    class_key: `${classInfo.className}-${classInfo.classSection}`,
                    subjects_data: classInfo.subjects
                });
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
        this.set('showDeleteClassDialog', false);
        this.set('showDeleteSubjectDialog', false);
        this.set('showEditClassDialog', false);
        this.set('showClassSubjectUpdateDialog', false);
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
        
        // Prepare grouped table data for teacher assignments
        const groupedData = teacherAssignments ? this.groupTeacherAssignments(teacherAssignments) : [];
        
        // Convert grouped data to table format with proper row grouping
        const tableData = [];
        let rowIndex = 1;
        
        groupedData.forEach(teacher => {
            teacher.classes.forEach((classInfo, classIndex) => {
                const subjectsText = classInfo.subjects.map(subject => 
                    `${subject.subjectName} (${subject.subjectCode})`
                ).join(', ');
                
                const isFirstClass = classIndex === 0;
                
                tableData.push({
                    id: `${teacher.employeeId}-${classInfo.className}-${classInfo.classSection}`, // Composite ID
                    index: rowIndex++,
                    teacher_name: isFirstClass ? teacher.teacherName : '', // Only show teacher name for first class
                    employee_id: isFirstClass ? teacher.employeeId : '', // Only show employee ID for first class
                    class_name: classInfo.className,
                    class_section: classInfo.classSection,
                    subjects: subjectsText,
                    subject_count: classInfo.subjects.length,
                    updated: new Date().toISOString(), // Placeholder - you might want to track this differently
                    // Add metadata for styling and actions
                    teacher_employee_id: teacher.employeeId,
                    teacher_name_full: teacher.teacherName,
                    is_first_class: isFirstClass,
                    class_key: `${classInfo.className}-${classInfo.classSection}`,
                    subjects_data: classInfo.subjects
                });
            });
        });

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'teacher_name', label: 'Teacher' },
            { key: 'employee_id', label: 'Employee ID' },
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
                                    title="Teacher Assignments"
                                    subtitle="Search teacher assignments..."
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
                                <div class="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                    <h3 class="text-lg font-semibold text-gray-900">Teacher Assignments Preview</h3>
                                    <div class="ml-auto flex items-center space-x-4">
                                        <div class="text-sm text-gray-500">
                                            ${teacherAssignments ? `${teacherAssignments.length} assignments` : '0 assignments'}
                                        </div>
                                        <button 
                                            onclick="this.closest('app-teacher-assignment-management-page').onAdd()"
                                            class="inline-flex items-center px-2 py-1.5 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150">
                                            <i class="fas fa-plus"></i>
                                            <span class="hidden md:inline">Add Assignment</span>
                                        </button>
                                    </div>
                                </div>
                                
                                ${teacherAssignments && teacherAssignments.length > 0 ? `
                                    <div class="grid gap-6">
                                        ${this.groupTeacherAssignments(teacherAssignments).map(teacherGroup => `
                                            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                                <!-- Teacher Header -->
                                                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                                    <div class="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
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
                                                        <div class="ml-auto flex items-center space-x-3">
                                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                ${teacherGroup.classes.length} class${teacherGroup.classes.length !== 1 ? 'es' : ''}
                                                            </span>
                                                            <div class="flex items-center space-x-1">
                                                                <button 
                                                                    onclick="this.closest('app-teacher-assignment-management-page').onViewTeacher('${teacherGroup.employeeId}')"
                                                                    class="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                                    title="View assignments">
                                                                    <i class="fas fa-eye text-sm"></i>
                                                                </button>
                                                                <button 
                                                                    onclick="this.closest('app-teacher-assignment-management-page').onEditTeacher('${teacherGroup.employeeId}')"
                                                                    class="inline-flex items-center p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                                                                    title="Edit assignments">
                                                                    <i class="fas fa-edit text-sm"></i>
                                                                </button>
                                                                <button 
                                                                    onclick="this.closest('app-teacher-assignment-management-page').onDeleteTeacher('${teacherGroup.employeeId}')"
                                                                    class="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                                    title="Delete assignments">
                                                                    <i class="fas fa-trash text-sm"></i>
                                                                </button>
                                                            </div>
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
                                                                    <div class="flex flex-col md:flex-row items-center justify-between">
                                                                        <div class="flex items-center space-x-2">
                                                                            <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                                                <i class="fas fa-chalkboard text-blue-600 text-xs"></i>
                                                                            </div>
                                                                            <h5 class="text-sm font-semibold text-gray-900">${classGroup.className} - ${classGroup.classSection}</h5>
                                                                        </div>
                                                                        <div class="flex items-center space-x-2">
                                                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                                ${classGroup.subjects.length} subject${classGroup.subjects.length !== 1 ? 's' : ''}
                                                                            </span>
                                                                             <button 
                                                                                 onclick="this.closest('app-teacher-assignment-management-page').onUpdateClassSubjects('${teacherGroup.employeeId}', '${classGroup.className}', '${classGroup.classSection}')"
                                                                                 class="inline-flex items-center p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors duration-200"
                                                                                 title="Update class subjects (change teacher/classes/subjects)">
                                                                                 <i class="fas fa-exchange-alt text-xs"></i>
                                                                             </button>
                                                                            <button 
                                                                                onclick="this.closest('app-teacher-assignment-management-page').onEditClass('${teacherGroup.employeeId}', '${classGroup.className}', '${classGroup.classSection}')"
                                                                                class="inline-flex items-center p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors duration-200"
                                                                                title="Edit subjects for this class">
                                                                                <i class="fas fa-edit text-xs"></i>
                                                                            </button>
                                                                            <button 
                                                                                onclick="this.closest('app-teacher-assignment-management-page').onDeleteClass('${teacherGroup.employeeId}', '${classGroup.className}', '${classGroup.classSection}')"
                                                                                class="inline-flex items-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                                                                title="Delete all subjects for this class">
                                                                                <i class="fas fa-trash text-xs"></i>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <!-- Subjects List -->
                                                                <div class="p-4">
                                                                    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
                                                                                        <button 
                                                                                            onclick="this.closest('app-teacher-assignment-management-page').onDeleteSubject('${teacherGroup.employeeId}', '${classGroup.className}', '${classGroup.classSection}', '${subject.subjectName}', '${subject.subjectCode}')"
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
            
            <!-- Delete Class Dialog -->
            <teacher-assignment-delete-class-dialog ${this.get('showDeleteClassDialog') ? 'open' : ''}></teacher-assignment-delete-class-dialog>
            
            <!-- Delete Subject Dialog -->
            <teacher-assignment-delete-subject-dialog ${this.get('showDeleteSubjectDialog') ? 'open' : ''}></teacher-assignment-delete-subject-dialog>
            
            <!-- Edit Class Dialog -->
            <teacher-assignment-edit-class-dialog ${this.get('showEditClassDialog') ? 'open' : ''}></teacher-assignment-edit-class-dialog>
            
            <!-- Class Subject Update Dialog -->
            <class-subject-update-dialog ${this.get('showClassSubjectUpdateDialog') ? 'open' : ''}></class-subject-update-dialog>
        `;
    }
}

customElements.define('app-teacher-assignment-management-page', TeacherAssignmentManagementPage);
export default TeacherAssignmentManagementPage; 