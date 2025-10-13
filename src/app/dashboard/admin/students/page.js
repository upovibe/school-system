import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/layout/adminLayout/StudentDeleteDialog.js';
import '@/components/layout/adminLayout/StudentAddDialog.js';
import '@/components/layout/adminLayout/StudentUpdateDialog.js';
import '@/components/layout/adminLayout/StudentViewDialog.js';
import '@/components/layout/adminLayout/PromoteStudentDialog.js';
import '@/components/layout/adminLayout/StudentImportDialog.js';
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
        this.classes = [];
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.showPromoteDialog = false;
        this.updateStudentData = null;
        this.viewStudentData = null;
        this.deleteStudentData = null;
        this.promoteStudentData = null;
        this.filters = { class_id: '' };
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
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Students</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-students-info" title="About Students">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="test-promote-dialog" title="Test Promote Dialog">
                                    <i class="fas fa-test-tube text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-student-management-page').loadData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage student records and enrollment</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Students</div>
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
        this.loadClasses();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        this.addEventListener('table-custom-action', this.onCustomAction.bind(this));
        this.addEventListener('table-menu-action', this.handleMenuAction.bind(this));
        this.addEventListener('import-completed', this.handleImportCompleted.bind(this));
        
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

        // Listen for filter changes
        this.addEventListener('filter-change', this.handleFilterChange.bind(this));

        // Listen for dropdown changes directly
        this.addEventListener('change', (e) => {
            const dropdown = e.target.closest('ui-search-dropdown');
            if (dropdown && dropdown.getAttribute('name') === 'class_id') {
                const value = dropdown.value;
                this.filters.class_id = value;
                this.filterStudents();
            }
        });

        // Listen for clear filters action
        this.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.getAttribute('data-action');
            if (action === 'clear-filters') {
                this.clearFilters();
            }
        });

        // Listen for student-saved event to reload data
        this.addEventListener('student-saved', (event) => {
            // Reload all data to get the complete student with all fields
            this.loadData();
            // Close the add modal
            this.set('showAddModal', false);
        });

        // Listen for student-updated event to reload data
        this.addEventListener('student-updated', (event) => {
            // Reload all data to get the complete student with all fields
            this.loadData();
            // Close the update modal
            this.set('showUpdateModal', false);
        });

        // Listen for student-promoted event to refresh data
        this.addEventListener('student-promoted', (event) => {
            // Close the promote dialog first
            this.set('showPromoteDialog', false);
            this.set('promoteStudentData', null);
            
            // Clear the class filter since the student moved to a different class
            this.filters.class_id = '';
            
            // Reset the dropdown to "All Classes"
            const dropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
            if (dropdown) {
                dropdown.value = '';
            }
            
            // Refresh the data to show updated class information
            this.loadData();
            
            // Show success toast
            Toast.show({
                title: 'Success',
                message: event.detail.message || 'Student promotion completed',
                variant: 'success',
                duration: 5000
            });
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-students-info') {
            this.showStudentsInfo();
        } else if (action === 'test-promote-dialog') {
            this.testPromoteDialog();
        }
    }

    showStudentsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-user-graduate text-blue-500 mr-2"></i>
                <span class="font-semibold">About Students</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Student Records</h4>
                    <p class="text-gray-700">This page manages student enrollment records, class membership, and profile information. Key rules include preventing future dates of birth and ensuring students are at least 3 months old.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Student ID</span>
                        <span class="text-sm text-gray-600">Unique identifier for each student</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Class</span>
                        <span class="text-sm text-gray-600">Optional at creation; can be assigned later</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Gender</span>
                        <span class="text-sm text-gray-600">Male or Female only</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Medical Conditions</span>
                        <span class="text-sm text-gray-600">Select predefined options or specify “Other”</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Date of Birth</span>
                        <span class="text-sm text-gray-600">Not in the future; at least 3 months old</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        You can update class membership, emergency contacts, and other details at any time.
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

            // Fetch students data
            const response = await api.withToken(token).get('/students');
            
            this.set('students', response.data.data);
            
            // Apply current filters after loading new data
            this.filterStudents();
            
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

    async loadClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/classes');
            
            if (response.status === 200 && response.data.success) {
                this.set('classes', response.data.data);
            }
        } catch (error) {
            // Silent error handling
        }
    }

    handleFilterChange(event) {
        const { name, value } = event.detail;
        this.filters[name] = value;
        this.filterStudents();
    }

    filterStudents() {
        const allStudents = this.get('students') || [];
        const classId = this.filters.class_id;
        
        let filteredStudents = allStudents;
        
        if (classId && classId !== '') {
            filteredStudents = allStudents.filter(student => 
                student.current_class_id == classId
            );
        }
        
        this.updateTableData(filteredStudents);
    }

    clearFilters() {
        this.filters.class_id = '';
        this.filterStudents();
        
        // Reset the dropdown to "All Classes"
        const dropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
        if (dropdown) {
            dropdown.value = '';
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

    // Get custom actions for the table
    getCustomActions() {
        return [
            {
                name: 'promote-student',
                label: 'Promote',
                icon: 'fas fa-arrow-up',
                variant: 'primary',
                size: 'sm',
                showField: 'can_promote'
            }
        ];
    }

    // Handle custom action clicks
    onCustomAction(event) {
        const { detail } = event;
        const { actionName, row } = detail;
        
        if (actionName === 'promote-student') {
            this.showPromoteStudentDialog(row);
        }
    }

    // Handle menu actions (export/import)
    handleMenuAction(event) {
        const { action, item } = event.detail;
        
        switch (action) {
            case 'export':
                this.exportStudents();
                break;
            case 'import':
                this.openImportModal();
                break;
            case 'refresh':
                this.loadData();
                break;
            case 'print':
                window.print();
                break;
        }
    }

    // Export students to CSV
    async exportStudents() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to export data',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const response = await fetch('/api/students/export', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/csv'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export students data');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Try to use showSaveFilePicker for modern browsers
            if (window.showSaveFilePicker) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: `students_export_${new Date().toISOString().split('T')[0]}.csv`,
                        types: [{
                            description: 'CSV files',
                            accept: { 'text/csv': ['.csv'] }
                        }]
                    });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    
                    Toast.show({
                        title: 'Export Successful',
                        message: 'Students data exported successfully',
                        variant: 'success',
                        duration: 3000
                    });
                    return;
                } catch (error) {
                    // User cancelled or error occurred, fall back to direct download
                }
            }
            
            // Fallback: Direct download using iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);
            
            setTimeout(() => {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(url);
            }, 1000);
            
            Toast.show({
                title: 'Export Successful',
                message: 'Students data exported successfully',
                variant: 'success',
                duration: 3000
            });
            
        } catch (error) {
            Toast.show({
                title: 'Export Error',
                message: error.message || 'Failed to export students data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Open import modal
    openImportModal() {
        this.closeAllModals();
        const importDialog = this.querySelector('student-import-dialog');
        
        if (importDialog) {
            // Check if dialog is already open
            if (importDialog.hasAttribute('open')) {
                console.log('Dialog is already open, closing first...');
                importDialog.close();
            }
            
            // Open the dialog
            setTimeout(() => {
                importDialog.open();
            }, 100);
        } else {
            console.error('Import dialog not found');
        }
    }

    // Handle import completion
    handleImportCompleted(event) {
        // Refresh the table data
        this.loadData();
    }

    // Show promote student dialog
    showPromoteStudentDialog(studentData) {
        // Find the full student data from students array
        const students = this.get('students') || [];
        const fullStudentData = students.find(s => s.id == studentData.id);
        
        if (fullStudentData) {
            // Close any open modals first
            this.closeAllModals();
            
            // Set the student data and show the dialog
            this.set('promoteStudentData', fullStudentData);
            this.set('showPromoteDialog', true);
            
            // Ensure the dialog is properly initialized
            setTimeout(() => {
                const promoteDialog = this.querySelector('promote-student-dialog');
                if (promoteDialog) {
                    promoteDialog.setStudentData(fullStudentData);
                }
            }, 0);
        }
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

    updateTableData(dataToUpdate = null) {
        const students = dataToUpdate || this.get('students');
        if (!students) {
            return;
        }

        // Prepare table data
        const tableData = students.map((student, index) => ({
            id: student.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            student_id: student.student_id || 'N/A',
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'N/A',
            email: student.email || 'N/A',
            class_name: student.class_name && student.class_section ? `${student.class_name}(${student.class_section})` : (student.class_name || 'N/A'),
            student_type: student.student_type || 'Day',
            phone: student.phone || 'N/A',
            status: student.status === 'active' ? 'Active' : 'Inactive',
            admission_date: student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A',
            created: student.created_at,
            updated: student.updated_at,
            // Add metadata for custom actions
            can_promote: student.status === 'active' // Only active students can be promoted
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
        this.set('promoteStudentData', null);
        this.set('showPromoteDialog', false);
    }

    render() {
        const students = this.get('students');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        const showPromoteDialog = this.get('showPromoteDialog');
        
        // Get filtered students based on current filter
        const allStudents = students || [];
        const classId = this.filters.class_id;
        let filteredStudents = allStudents;
        
        if (classId && classId !== '') {
            filteredStudents = allStudents.filter(student => 
                student.current_class_id == classId
            );
        }
        
        // Prepare table data and columns for students
        const tableData = (filteredStudents || []).map((student, index) => ({
            id: student.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            student_id: student.student_id || 'N/A',
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'N/A',
            email: student.email || 'N/A',
            class_name: student.class_name && student.class_section ? `${student.class_name}(${student.class_section})` : (student.class_name || 'N/A'),
            student_type: student.student_type || 'Day',
            phone: student.phone || 'N/A',
            status: student.status === 'active' ? 'Active' : 'Inactive',
            admission_date: student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A',
            created: student.created_at,
            updated: student.updated_at,
            // Add metadata for custom actions
            can_promote: student.status === 'active' // Only active students can be promoted
        }));

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
            
            <!-- Filter Section - SEPARATED from table container -->
            <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300 my-10">
                <div class="grid grid-cols-1 md:grid-cols-1 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Class</label>
                        <ui-search-dropdown 
                            name="class_id"
                            placeholder="All Classes"
                            class="w-full">
                            <ui-option value="">All Classes</ui-option>
                            ${this.get('classes') ? this.get('classes').map(cls => `
                                <ui-option value="${cls.id}">${cls.name}-${cls.section}</ui-option>
                            `).join('') : ''}
                        </ui-search-dropdown>
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-3">
                    <ui-button type="button" data-action="clear-filters" variant="secondary" size="sm">
                        <i class="fas fa-times mr-1"></i> Clear Filters
                    </ui-button>
                </div>
            </div>
            
            <!-- Table Container - SEPARATE from filter -->
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
                            ${!loading ? 'addable' : ''}
                            bordered
                            striped
                            ${!loading ? `custom-actions='${JSON.stringify(this.getCustomActions())}'` : ''}
                            menu-items='${JSON.stringify([
                                {
                                    type: 'title',
                                    label: 'Data Management'
                                },
                                {
                                    action: 'export',
                                    label: 'Export CSV',
                                    icon: 'fas fa-download'
                                },
                                {
                                    action: 'import',
                                    label: 'Import CSV',
                                    icon: 'fas fa-upload'
                                },
                                {
                                    type: 'separator'
                                },
                                {
                                    type: 'title',
                                    label: 'Actions'
                                },
                                {
                                    action: 'refresh',
                                    label: 'Refresh Data',
                                    icon: 'fas fa-sync-alt'
                                },
                                {
                                    action: 'print',
                                    label: 'Print Table',
                                    icon: 'fas fa-print'
                                }
                            ])}'
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
            
            <!-- Promote Student Dialog -->
            <promote-student-dialog ${showPromoteDialog ? 'open' : ''}></promote-student-dialog>
            
            <!-- Import Student Dialog -->
            <student-import-dialog></student-import-dialog>
        `;
    }
}

customElements.define('app-student-management-page', StudentManagementPage);
export default StudentManagementPage; 