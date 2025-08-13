import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Card.js';
import '@/components/ui/Tabs.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Alert.js';
import '@/components/ui/Table.js';
import '@/components/ui/Accordion.js';
import '@/components/ui/Button.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import '@/components/layout/teacherLayout/TeacherAssignmentViewDialog.js';
import '@/components/layout/teacherLayout/TeacherEditAssignmentModal.js';
import '@/components/layout/teacherLayout/TeacherStudentAssignmentDialog.js';

/**
 * Teacher Assignments Page Component (/dashboard/teacher/assignments)
 * 
 * Displays the current teacher's created assignments with details.
 */
class TeacherAssignmentsPage extends App {
    constructor() {
        super();
        this.assignmentsData = null;
        this.loading = true;
        this.error = null;
        this.showEditModal = false;
        this.searchTerm = '';
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        this.activeTab = 'published'; // Default active tab
        this.filters = {
            class_id: '',
            subject_id: '',
            assignment_type: ''
        };
        this.filteredAssignments = null;
    }

    // Override set method to prevent re-rendering for search updates
    set(property, value) {
        // For filteredAssignments, update without re-rendering to maintain input focus
        if (property === 'filteredAssignments') {
            this.state = this.state || {};
            this.state[property] = value;
            // Only update the assignments list part of the DOM, not the entire component
            this.updateAssignmentsList(value);
            return;
        }
        
        // For other properties, use the normal set method
        super.set(property, value);
    }

    // Update only the assignments list without full re-render
    updateAssignmentsList(filteredAssignments) {
        const assignmentsData = this.get('assignmentsData');
        const assignmentsContainer = this.querySelector('.assignments-list-container');
        
        if (!assignmentsContainer || !assignmentsData) return;
        
        // Generate the assignments HTML
        const assignmentsHTML = (filteredAssignments && filteredAssignments.length > 0) ? 
            filteredAssignments.map(assignment => this.generateAssignmentHTML(assignment)).join('') :
            this.generateNoAssignmentsHTML();
            
        assignmentsContainer.innerHTML = assignmentsHTML;
        
        // Update the results count
        const resultsCount = this.querySelector('.results-count');
        if (resultsCount) {
            resultsCount.innerHTML = `
                Showing <span class="font-medium text-gray-900">${filteredAssignments?.length || 0}</span> 
                of <span class="font-medium text-gray-900">${this.getAssignmentsByStatus(this.activeTab).length}</span> assignments
            `;
        }
        
        // Update filters applied indicator
        const filtersIndicator = this.querySelector('.filters-indicator');
        if (filtersIndicator) {
            const totalInTab = this.getAssignmentsByStatus(this.activeTab).length;
            if ((filteredAssignments?.length || 0) !== totalInTab) {
                filtersIndicator.innerHTML = `
                    <span class="text-blue-600 font-medium">
                        <i class="fas fa-filter mr-1"></i>
                        Filters Applied
                    </span>
                `;
            } else {
                filtersIndicator.innerHTML = '';
            }
        }
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'My Assignments | School System';
        await this.loadAssignments();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for button clicks
        this.addEventListener('click', this.onButtonClick.bind(this));
        
        // Add event listeners for table row clicks
        this.addEventListener('table-row-click', this.onStudentRowClick.bind(this));
        
        // Add event listeners for modal events
        this.addEventListener('assignment-updated', this.onAssignmentUpdated.bind(this));
        this.addEventListener('modal-closed', this.onModalClosed.bind(this));
        
        // Add event listeners for filtering and search
        this.addEventListener('input', this.onFilterChange.bind(this));
        this.addEventListener('change', this.onFilterChange.bind(this));
        
        // Add event listener for tab changes
        this.addEventListener('tab-changed', this.onTabChanged.bind(this));
        
        // Add event listener for tab clicks
        this.addEventListener('click', this.handleTabClick.bind(this));
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-teacher-assignments-info') {
            this.showTeacherAssignmentsInfo();
        }
    }

    showTeacherAssignmentsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-tasks text-blue-500 mr-2"></i>
                <span class="font-semibold">About My Class Assignments</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">Manage assignments you created for your classes. Filter, search, and open student submissions.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between"><span class="text-sm font-medium">Tabs</span><span class="text-sm text-gray-600">Published, Draft, Archived, Deleted</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Filters</span><span class="text-sm text-gray-600">Type, Class, Subject, Sort</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Actions</span><span class="text-sm text-gray-600">View, Edit, Archive, Delete, Restore</span></div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    // Handle tab changes
    onTabChanged(event) {
        const { detail } = event;
        if (detail && detail.activeTab) {
            this.activeTab = detail.activeTab;
            this.applyFiltersAndSearch();
        }
    }

    // Handle tab click events
    handleTabClick(event) {
        const tab = event.target.closest('ui-tab');
        if (tab) {
            const tabValue = tab.getAttribute('value');
            if (tabValue && tabValue !== this.activeTab) {
                this.activeTab = tabValue;
                this.applyFiltersAndSearch();
            }
        }
    }

    // Get assignments by status
    getAssignmentsByStatus(status) {
        const assignmentsData = this.get('assignmentsData') || [];
        
        switch (status) {
            case 'published':
                return assignmentsData.filter(a => a.status === 'published' && !a.deleted_at);
            case 'draft':
                return assignmentsData.filter(a => a.status === 'draft' && !a.deleted_at);
            case 'archived':
                return assignmentsData.filter(a => a.status === 'archived' && !a.deleted_at);
            case 'deleted':
                return assignmentsData.filter(a => a.deleted_at);
            default:
                return assignmentsData;
        }
    }

    // Get tab counts
    getTabCounts() {
        const assignmentsData = this.get('assignmentsData') || [];
        
        return {
            published: assignmentsData.filter(a => a.status === 'published' && !a.deleted_at).length,
            draft: assignmentsData.filter(a => a.status === 'draft' && !a.deleted_at).length,
            archived: assignmentsData.filter(a => a.status === 'archived' && !a.deleted_at).length,
            deleted: assignmentsData.filter(a => a.deleted_at).length
        };
    }

    async loadAssignments() {
        try {
            this.set('loading', true);
            this.set('error', null);

            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                this.set('error', 'Authentication required. Please log in again.');
                return;
            }

            // Build query parameters for filtering
            const queryParams = new URLSearchParams();
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const queryString = queryParams.toString();
            const endpoint = `/teachers/my-class-assignments${queryString ? '?' + queryString : ''}`;

            const response = await api.withToken(token).get(endpoint);
            
            if (response.data && response.data.success) {
                this.set('assignmentsData', response.data.data);
                this.applyFiltersAndSearch();
            } else {
                this.set('error', 'Failed to load assignments data');
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            if (error.response && error.response.status === 401) {
                this.set('error', 'Authentication failed. Please log in again.');
            } else {
                this.set('error', 'Failed to load assignments. Please try again.');
            }
        } finally {
            this.set('loading', false);
        }
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'No date set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Get status badge color
    getStatusColor(status) {
        switch (status?.toLowerCase()) {
            case 'published': return 'success';
            case 'draft': return 'warning';
            case 'archived': return 'secondary';
            default: return 'primary';
        }
    }

    // Get assignment type badge color
    getTypeColor(type) {
        switch (type?.toLowerCase()) {
            case 'homework': return 'info';
            case 'quiz': return 'warning';
            case 'exam': return 'error';
            case 'project': return 'success';
            default: return 'primary';
        }
    }





    // Handle button clicks for view assignment
    onButtonClick(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const assignmentId = button.getAttribute('data-assignment-id');
        
        if (!assignmentId) return;

        if (button.classList.contains('view-assignment-btn')) {
            this.openAssignmentDialog(assignmentId);
        } else if (button.classList.contains('edit-assignment-btn')) {
            this.openEditModal(assignmentId);
        } else if (button.classList.contains('archive-assignment-btn')) {
            this.archiveAssignment(assignmentId);
        } else if (button.classList.contains('unarchive-assignment-btn')) {
            this.unarchiveAssignment(assignmentId);
        } else if (button.classList.contains('delete-assignment-btn')) {
            this.softDeleteAssignment(assignmentId);
        } else if (button.classList.contains('restore-assignment-btn')) {
            this.restoreAssignment(assignmentId);
        }
    }

    // Get the current assignment ID from the page context


    // Handle student row clicks
    async onStudentRowClick(event) {
        const { detail } = event;
        const studentData = detail.row;
        
        // Get the full student data including submission details
        if (studentData.full_data) {
            const student = studentData.full_data;
            
            // Get the assignment ID from the table's data attribute
            const table = event.target.closest('ui-table');
            const assignmentId = table ? table.getAttribute('data-assignment-id') : null;
            
            if (assignmentId) {
                // Open the student assignment dialog
                const dialog = this.querySelector('teacher-student-assignment-dialog');
                if (dialog) {
                    await dialog.openStudentAssignment(assignmentId, student.id);
                }
            }
        }
    }

    // Open assignment view dialog
    openAssignmentDialog(assignmentId) {
        const dialog = this.querySelector('teacher-assignment-view-dialog');
        if (dialog) {
            dialog.openAssignment(assignmentId);
        }
    }

    // Open edit modal
    openEditModal(assignmentId) {
        this.set('showEditModal', true);
        
        // Open the modal
        const modal = this.querySelector('teacher-edit-assignment-modal');
        if (modal) {
            modal.open(assignmentId);
        }
    }

    // Soft delete assignment
    async softDeleteAssignment(assignmentId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication required');
                return;
            }

            if (!confirm('Are you sure you want to delete this assignment? It will be hidden from students but can be restored later.')) {
                return;
            }

            const response = await api.withToken(token).patch(`/teachers/assignments/${assignmentId}/delete`);
            
            if (response.data && response.data.success) {
                // Show success message
                this.showToast('Assignment deleted successfully', 'success');
                
                // Reload assignments to reflect the change
                await this.loadAssignments();
            } else {
                this.showToast(response.data?.message || 'Failed to delete assignment', 'error');
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            this.showToast(error.response?.data?.message || 'Failed to delete assignment', 'error');
        }
    }

    // Restore assignment
    async restoreAssignment(assignmentId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication required');
                return;
            }

            if (!confirm('Are you sure you want to restore this assignment? It will be visible to students again.')) {
                return;
            }

            const response = await api.withToken(token).patch(`/teachers/assignments/${assignmentId}/restore`);
            
            if (response.data && response.data.success) {
                // Show success message
                this.showToast('Assignment restored successfully', 'success');
                
                // Reload assignments to reflect the change
                await this.loadAssignments();
            } else {
                this.showToast(response.data?.message || 'Failed to restore assignment', 'error');
            }
        } catch (error) {
            console.error('Error restoring assignment:', error);
            this.showToast(error.response?.data?.message || 'Failed to restore assignment', 'error');
        }
    }

    // Archive assignment
    async archiveAssignment(assignmentId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication required');
                return;
            }

            if (!confirm('Are you sure you want to archive this assignment? It will be hidden from students but can be unarchived later.')) {
                return;
            }

            const response = await api.withToken(token).patch(`/teachers/assignments/${assignmentId}/archive`);
            
            if (response.data && response.data.success) {
                // Show success message
                this.showToast('Assignment archived successfully', 'success');
                
                // Reload assignments to reflect the change
                await this.loadAssignments();
            } else {
                this.showToast(response.data?.message || 'Failed to archive assignment', 'error');
            }
        } catch (error) {
            console.error('Error archiving assignment:', error);
            this.showToast(error.response?.data?.message || 'Failed to archive assignment', 'error');
        }
    }

    // Unarchive assignment
    async unarchiveAssignment(assignmentId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication required');
                return;
            }

            if (!confirm('Are you sure you want to unarchive this assignment? It will be visible to students again.')) {
                return;
            }

            const response = await api.withToken(token).patch(`/teachers/assignments/${assignmentId}/unarchive`);
            
            if (response.data && response.data.success) {
                // Show success message
                this.showToast('Assignment unarchived successfully', 'success');
                
                // Reload assignments to reflect the change
                await this.loadAssignments();
            } else {
                this.showToast(response.data?.message || 'Failed to unarchive assignment', 'error');
            }
        } catch (error) {
            console.error('Error unarchiving assignment:', error);
            this.showToast(error.response?.data?.message || 'Failed to unarchive assignment', 'error');
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        // Check if Toast component is available
        if (window.Toast) {
            window.Toast.show({
                message: message,
                variant: type,
                duration: 3000
            });
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    // Handle assignment updated
    onAssignmentUpdated(event) {
        // Update the specific assignment in the current data instead of reloading everything
        const { assignmentId, data } = event.detail;
        const assignmentsData = this.get('assignmentsData');
        
        if (assignmentsData && assignmentId) {
            // Find and update the specific assignment
            const updatedAssignments = assignmentsData.map(assignment => {
                if (assignment.id == assignmentId) {
                    // Merge the updated data with existing assignment data
                    return { ...assignment, ...data };
                }
                return assignment;
            });
            
            // Update the state without causing a full reload
            this.set('assignmentsData', updatedAssignments);
        }
        
        // Ensure modal is closed
        this.set('showEditModal', false);
    }

    // Handle modal closed
    onModalClosed(event) {
        if (event.detail?.type === 'edit-assignment') {
            this.set('showEditModal', false);
        }
    }

    // Prepare student data for table using new API structure
    prepareStudentTableData(students) {
        return students.map(student => ({
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            gender: student.gender === 'male' ? 'Male' : 'Female',
            email: student.email || 'No email',
            phone: student.phone || 'No phone',
            submitted: student.overall_status === 'submitted' ? 'Yes' : 'No',
            grade: student.grade ? `${student.grade}` : 'Not graded',
            // Store full student data for click handling
            full_data: student
        }));
    }

    // Get student table columns
    getStudentTableColumns() {
        return [
            { key: 'name', label: 'Student Name' },
            { key: 'gender', label: 'Gender' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'submitted', label: 'Submitted' },
            { key: 'grade', label: 'Grade' }
        ];
    }



    // Handle filter and search changes
    onFilterChange(event) {
        const target = event.target;
        
        if (target.matches('[data-filter="search"]')) {
            this.searchTerm = target.value;
            // Use debounced search to avoid too many re-renders
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.applyFiltersAndSearch();
            }, 300);
            return; // Don't call applyFiltersAndSearch immediately for search
        } else if (target.matches('[data-filter="assignment_type"]')) {
            this.filters.assignment_type = target.value;
        } else if (target.matches('[data-filter="class"]')) {
            this.filters.class_id = target.value;
        } else if (target.matches('[data-filter="subject"]')) {
            this.filters.subject_id = target.value;
        } else if (target.matches('[data-filter="sort"]')) {
            const [sortBy, sortOrder] = target.value.split(':');
            this.sortBy = sortBy;
            this.sortOrder = sortOrder;
        }
        
        this.applyFiltersAndSearch();
    }

    // Apply filters and search
    applyFiltersAndSearch() {
        // Get assignments for the current tab
        const assignments = this.getAssignmentsByStatus(this.activeTab);
        let filtered = [...assignments];

        // Apply search filter
        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            filtered = filtered.filter(assignment => 
                assignment.title?.toLowerCase().includes(search) ||
                assignment.description?.toLowerCase().includes(search) ||
                assignment.class_name?.toLowerCase().includes(search) ||
                assignment.subject_name?.toLowerCase().includes(search) ||
                assignment.assignment_type?.toLowerCase().includes(search)
            );
        }

        // Apply assignment type filter
        if (this.filters.assignment_type) {
            filtered = filtered.filter(assignment => assignment.assignment_type === this.filters.assignment_type);
        }

        // Apply class filter
        if (this.filters.class_id) {
            filtered = filtered.filter(assignment => assignment.class_id == this.filters.class_id);
        }

        // Apply subject filter
        if (this.filters.subject_id) {
            filtered = filtered.filter(assignment => assignment.subject_id == this.filters.subject_id);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            // Handle date sorting
            if (this.sortBy.includes('date') || this.sortBy.includes('at')) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            // Handle string sorting
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            // Handle numeric sorting
            if (this.sortBy === 'total_points' || this.sortBy === 'submission_count') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }

            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        this.set('filteredAssignments', filtered);
    }

    // Get unique values for filter options
    getUniqueClasses() {
        const assignments = this.getAssignmentsByStatus(this.activeTab);
        const classes = assignments.map(a => ({ 
            id: a.class_id, 
            name: `${a.class_name}-${a.class_section}` 
        }));
        return [...new Map(classes.map(c => [c.id, c])).values()];
    }

    getUniqueSubjects() {
        const assignments = this.getAssignmentsByStatus(this.activeTab);
        const subjects = assignments.map(a => ({ 
            id: a.subject_id, 
            name: a.subject_name 
        }));
        return [...new Map(subjects.map(s => [s.id, s])).values()];
    }

    getUniqueAssignmentTypes() {
        const assignments = this.getAssignmentsByStatus(this.activeTab);
        const types = [...new Set(assignments.map(a => a.assignment_type).filter(Boolean))];
        return types.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }));
    }

    // Generate HTML for a single assignment
    generateAssignmentHTML(assignment) {
        return `
            <div class="bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden border border-gray-100">
                <!-- Assignment Header -->
                <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-5 border-b border-gray-200">
                    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                        <div class="flex-1 min-w-0">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">${assignment.title}</h3>
                            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span class="flex items-center">
                                    <i class="fas fa-graduation-cap mr-1"></i>
                                    ${assignment.class_name}-${assignment.class_section}
                                </span>
                                <span class="flex items-center">
                                    <i class="fas fa-book mr-1"></i>
                                    ${assignment.subject_name}
                                </span>
                                <span class="flex items-center">
                                    <i class="fas fa-calendar mr-1"></i>
                                    Due: ${this.formatDate(assignment.due_date)}
                                </span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <!-- Action Buttons -->
                            <div class="flex items-center gap-2">
                                <button 
                                    class="view-assignment-btn size-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200" 
                                    title="View Submissions"
                                    data-assignment-id="${assignment.id}">
                                    <i class="fas fa-eye text-xs"></i>
                                </button>
                                <button 
                                    class="edit-assignment-btn size-8 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200" 
                                    title="Edit Assignment"
                                    data-assignment-id="${assignment.id}">
                                    <i class="fas fa-edit text-xs"></i>
                                </button>
                                ${assignment.deleted_at ? `
                                    <button 
                                        class="restore-assignment-btn size-8 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200" 
                                        title="Restore Assignment"
                                        data-assignment-id="${assignment.id}">
                                        <i class="fas fa-undo text-xs"></i>
                                    </button>
                                ` : assignment.status === 'archived' ? `
                                    <button 
                                        class="unarchive-assignment-btn size-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200" 
                                        title="Unarchive Assignment"
                                        data-assignment-id="${assignment.id}">
                                        <i class="fas fa-folder-open text-xs"></i>
                                    </button>
                                    <button 
                                        class="delete-assignment-btn size-8 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200" 
                                        title="Delete Assignment"
                                        data-assignment-id="${assignment.id}">
                                        <i class="fas fa-trash text-xs"></i>
                                    </button>
                                ` : `
                                    <button 
                                        class="archive-assignment-btn size-8 flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors duration-200" 
                                        title="Archive Assignment"
                                        data-assignment-id="${assignment.id}">
                                        <i class="fas fa-archive text-xs"></i>
                                    </button>
                                `}
                            </div>
                            <!-- Badges -->
                            <div class="flex items-center gap-2">
                                <ui-badge color="${this.getStatusColor(assignment.status)}">
                                    <i class="fas fa-circle mr-1"></i>${assignment.status?.toUpperCase() || 'UNKNOWN'}
                                </ui-badge>
                                <ui-badge color="${this.getTypeColor(assignment.assignment_type)}">
                                    <i class="fas fa-tag mr-1"></i>${assignment.assignment_type?.toUpperCase() || 'GENERAL'}
                                </ui-badge>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Assignment Content -->
                <div class="p-5">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Description -->
                        <div class="lg:col-span-2">
                            <h4 class="font-semibold text-gray-900 mb-2">Description</h4>
                            <div class="text-gray-600 prose prose-sm max-w-none">
                                ${assignment.description || 'No description provided.'}
                            </div>
                            
                            ${assignment.attachment_file ? `
                                <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div class="flex items-center">
                                        <i class="fas fa-paperclip text-blue-600 mr-2"></i>
                                        <span class="text-sm font-medium text-blue-800">Attachment Available</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Details -->
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-900 mb-2">Assignment Details</h4>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Total Points:</span>
                                        <span class="font-medium">${assignment.total_points || 'Not set'}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Submissions:</span>
                                        <span class="font-medium">${assignment.submission_count || 0}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Created:</span>
                                        <span class="font-medium">${this.formatDate(assignment.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Students Section with Accordion -->
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <ui-accordion>
                            <ui-accordion-item title="Class Students (${assignment.students ? assignment.students.length : 0} Student${assignment.students && assignment.students.length > 1 ? 's' : ''})">
                                ${assignment.students && assignment.students.length > 0 ? `
                                    <ui-table 
                                        data='${JSON.stringify(this.prepareStudentTableData(assignment.students))}'
                                        columns='${JSON.stringify(this.getStudentTableColumns())}'
                                        title="Students in ${assignment.class_name}-${assignment.class_section}"
                                        searchable
                                        search-placeholder="Search students..."
                                        striped
                                        print
                                        sortable
                                        clickable
                                        refresh
                                        data-assignment-id="${assignment.id}">
                                    </ui-table>
                                ` : `
                                    <div class="bg-gray-50 rounded-xl p-6 sm:p-8 text-center">
                                        <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                            <i class="fas fa-user-graduate text-gray-400 text-xl sm:text-2xl"></i>
                                        </div>
                                        <h4 class="text-base sm:text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h4>
                                        <p class="text-gray-500 text-sm sm:text-base">This class currently has no enrolled students.</p>
                                    </div>
                                `}
                            </ui-accordion-item>
                        </ui-accordion>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate HTML for no assignments found
    generateNoAssignmentsHTML() {
        return `
            <div class="bg-white shadow-sm rounded-xl p-8 text-center border border-gray-100">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-filter text-2xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Assignments Found</h3>
                <p class="text-gray-500 max-w-md mx-auto">
                    No assignments match your current filters. Try adjusting your search criteria or clearing the filters.
                </p>
            </div>
        `;
    }

    generateEmptyTabHTML(status) {
        const statusLabels = {
            'published': 'Published',
            'draft': 'Draft',
            'archived': 'Archived',
            'deleted': 'Deleted'
        };
        
        const statusDescriptions = {
            'published': 'You haven\'t published any assignments yet. Create and publish assignments to see them here.',
            'draft': 'You don\'t have any draft assignments. Start creating assignments and save them as drafts.',
            'archived': 'No archived assignments found. Assignments will appear here when you archive them.',
            'deleted': 'No deleted assignments found. Deleted assignments will appear here.'
        };
        
        const statusIcons = {
            'published': 'fas fa-check-circle',
            'draft': 'fas fa-edit',
            'archived': 'fas fa-archive',
            'deleted': 'fas fa-trash'
        };
        
        return `
            <div class="bg-white shadow-sm rounded-xl p-8 text-center border border-gray-100">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="${statusIcons[status]} text-2xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No ${statusLabels[status]} Assignments</h3>
                <p class="text-gray-500 max-w-md mx-auto">
                    ${statusDescriptions[status]}
                </p>
            </div>
        `;
    }

    // Clear all filters
    clearFilters() {
        this.searchTerm = '';
        this.filters = {
            class_id: '',
            subject_id: '',
            assignment_type: ''
        };
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        
        // Reset form elements
        const searchInput = this.querySelector('[data-filter="search"]');
        if (searchInput) searchInput.value = '';
        
        const filterElements = this.querySelectorAll('[data-filter]:not([data-filter="search"])');
        filterElements.forEach(el => el.value = '');
        
        this.applyFiltersAndSearch();
    }

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const assignmentsData = this.get('assignmentsData');
        const filteredAssignments = this.get('filteredAssignments') || this.getAssignmentsByStatus(this.activeTab);
        const tabCounts = this.getTabCounts();

        if (loading) {
            return `
                <div class="space-y-6">
                    <div class="bg-white shadow rounded-lg p-4">
                        <div class="animate-pulse">
                            <div class="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 gap-6">
                        ${Array(3).fill(0).map(() => `
                            <div class="bg-white shadow rounded-lg p-6">
                                <div class="animate-pulse">
                                    <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div class="space-y-3">
                                        <div class="h-4 bg-gray-200 rounded"></div>
                                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (error) {
            return `
                <div class="space-y-6">
                    <ui-alert variant="error" title="Error" message="${error}">
                        <button slot="action" onclick="window.location.reload()" class="text-sm font-medium text-red-800 hover:text-red-900">
                            Try Again
                        </button>
                    </ui-alert>
                </div>
            `;
        }

        if (!assignmentsData || !assignmentsData.length) {
            return `
                <div class="space-y-6">
                    <div class="bg-white shadow rounded-lg p-8 text-center">
                        <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-tasks text-3xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No Assignments Created</h3>
                        <p class="text-gray-500 max-w-md mx-auto">
                            You haven't created any assignments yet. Start by creating an assignment for one of your classes.
                        </p>
                        <div class="mt-6">
                            <ui-button onclick="window.location.href='/dashboard/teacher/class-subjects'" variant="primary">
                                <i class="fas fa-plus mr-2"></i>
                                Create Assignment
                            </ui-button>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-8">
                <!-- Enhanced Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">My Class Assignments</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-teacher-assignments-info" title="About My Class Assignments">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage and review your created assignments</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <ui-button onclick="window.location.href='/dashboard/teacher/class-subjects'" variant="secondary" size="sm">
                                <i class="fas fa-plus mr-2"></i>
                                Create New Assignment
                            </ui-button>
                        </div>
                    </div>
                    
                    <!-- Enhanced Summary Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-tasks text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${filteredAssignments?.length || 0} / ${this.getAssignmentsByStatus(this.activeTab).length}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Showing Assignment${(filteredAssignments?.length || 0) > 1 ? 's' : ''}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-check-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${tabCounts.published}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Published</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-amber-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-edit text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${tabCounts.draft}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Draft${tabCounts.draft > 1 ? 's' : ''}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-file-alt text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${assignmentsData.reduce((total, a) => total + (a.submission_count || 0), 0)}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total Submission${assignmentsData.reduce((total, a) => total + (a.submission_count || 0), 0) > 1 ? 's' : ''}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabs Interface -->
                <div class="rounded-xl overflow-hidden">                    
                    <div class="pt-4">
                        <ui-tabs>
                            <ui-tab-list class="flex items-center justify-center">
                                <ui-tab value="published">
                                    <i class="fas fa-check-circle text-green-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Published (${tabCounts.published})</span>
                                </ui-tab>
                                <ui-tab value="draft">
                                    <i class="fas fa-edit text-amber-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Draft (${tabCounts.draft})</span>
                                </ui-tab>
                                <ui-tab value="archived">
                                    <i class="fas fa-archive text-blue-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Archived (${tabCounts.archived})</span>
                                </ui-tab>
                                <ui-tab value="deleted">
                                    <i class="fas fa-trash text-red-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Deleted (${tabCounts.deleted})</span>
                                </ui-tab>
                            </ui-tab-list>
                            
                            <!-- Published Tab -->
                            <ui-tab-panel value="published">
                                ${this.renderTabContent('published', filteredAssignments)}
                            </ui-tab-panel>
                            
                            <!-- Draft Tab -->
                            <ui-tab-panel value="draft">
                                ${this.renderTabContent('draft', filteredAssignments)}
                            </ui-tab-panel>
                            
                            <!-- Archived Tab -->
                            <ui-tab-panel value="archived">
                                ${this.renderTabContent('archived', filteredAssignments)}
                            </ui-tab-panel>
                            
                            <!-- Deleted Tab -->
                            <ui-tab-panel value="deleted">
                                ${this.renderTabContent('deleted', filteredAssignments)}
                            </ui-tab-panel>
                        </ui-tabs>
                    </div>
                </div>
            </div>
            

            
            <!-- Assignment View Dialog -->
            <teacher-assignment-view-dialog></teacher-assignment-view-dialog>
            
            <!-- Assignment Edit Modal -->
            <teacher-edit-assignment-modal ${this.get('showEditModal') ? 'open' : ''}></teacher-edit-assignment-modal>
            
            <!-- Student Assignment Dialog -->
            <teacher-student-assignment-dialog></teacher-student-assignment-dialog>
        `;
    }

    // Render content for each tab
    renderTabContent(status, filteredAssignments) {
        const assignmentsInTab = this.getAssignmentsByStatus(status);
        const isActiveTab = this.activeTab === status;
        
        // Only show filtered assignments if this is the active tab
        const assignmentsToShow = isActiveTab ? (filteredAssignments || assignmentsInTab) : assignmentsInTab;
        
        return `
            <div class="space-y-6">
                <!-- Filters and Search Section (only for active tab) -->
                ${isActiveTab ? `
                    <div class="overflow-hidden">
                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-filter text-white text-sm"></i>
                                </div>
                                    <h3 class="text-lg font-semibold text-gray-900">Filter & Search ${status.charAt(0).toUpperCase() + status.slice(1)} Assignments</h3>
                            </div>
                            <button 
                                onclick="this.closest('app-teacher-assignments-page').clearFilters()"
                                class="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                                <i class="fas fa-times mr-1"></i>
                                Clear All
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-4 space-y-4">
                        <!-- Search Bar -->
                        <div class="w-full">
                            <ui-input 
                                type="search"
                                data-filter="search"
                                placeholder="Search assignments by title, description, class, or subject..."
                                value="${this.searchTerm}">
                            </ui-input>
                        </div>
                        
                        <!-- Filter Options -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <!-- Assignment Type Filter -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select data-filter="assignment_type" class="w-full px-[0.75rem] h-9 border-[1px] border-gray-300/50 rounded-md font-[0.875rem] focus:outline-gray-300 focus:ring-[0.1px] focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900">
                                    <option value="">All Types</option>
                                    ${this.getUniqueAssignmentTypes().map(type => 
                                        `<option value="${type.value}" ${this.filters.assignment_type === type.value ? 'selected' : ''}>${type.label}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <!-- Class Filter -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <select data-filter="class" class="w-full px-[0.75rem] h-9 border-[1px] border-gray-300/50 rounded-md font-[0.875rem] focus:outline-gray-300 focus:ring-[0.1px] focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900">
                                    <option value="">All Classes</option>
                                    ${this.getUniqueClasses().map(cls => 
                                        `<option value="${cls.id}" ${this.filters.class_id == cls.id ? 'selected' : ''}>${cls.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <!-- Subject Filter -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select data-filter="subject" class="w-full px-[0.75rem] h-9 border-[1px] border-gray-300/50 rounded-md font-[0.875rem] focus:outline-gray-300 focus:ring-[0.1px] focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900">
                                    <option value="">All Subjects</option>
                                    ${this.getUniqueSubjects().map(subject => 
                                        `<option value="${subject.id}" ${this.filters.subject_id == subject.id ? 'selected' : ''}>${subject.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <!-- Sort Filter -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                                <select data-filter="sort" class="w-full px-[0.75rem] h-9 border-[1px] border-gray-300/50 rounded-md font-[0.875rem] focus:outline-gray-300 focus:ring-[0.1px] focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900">
                                    <option value="created_at:desc" ${this.sortBy === 'created_at' && this.sortOrder === 'desc' ? 'selected' : ''}>Newest First</option>
                                    <option value="created_at:asc" ${this.sortBy === 'created_at' && this.sortOrder === 'asc' ? 'selected' : ''}>Oldest First</option>
                                    <option value="title:asc" ${this.sortBy === 'title' && this.sortOrder === 'asc' ? 'selected' : ''}>Title A-Z</option>
                                    <option value="title:desc" ${this.sortBy === 'title' && this.sortOrder === 'desc' ? 'selected' : ''}>Title Z-A</option>
                                    <option value="due_date:asc" ${this.sortBy === 'due_date' && this.sortOrder === 'asc' ? 'selected' : ''}>Due Date (Earliest)</option>
                                    <option value="due_date:desc" ${this.sortBy === 'due_date' && this.sortOrder === 'desc' ? 'selected' : ''}>Due Date (Latest)</option>
                                    <option value="total_points:desc" ${this.sortBy === 'total_points' && this.sortOrder === 'desc' ? 'selected' : ''}>Points (High to Low)</option>
                                    <option value="total_points:asc" ${this.sortBy === 'total_points' && this.sortOrder === 'asc' ? 'selected' : ''}>Points (Low to High)</option>
                                    <option value="submission_count:desc" ${this.sortBy === 'submission_count' && this.sortOrder === 'desc' ? 'selected' : ''}>Most Submissions</option>
                                    <option value="submission_count:asc" ${this.sortBy === 'submission_count' && this.sortOrder === 'asc' ? 'selected' : ''}>Least Submissions</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Results Count -->
                        <div class="flex items-center justify-between pt-2 border-t border-gray-200 text-sm text-gray-600">
                            <span class="results-count">
                                    Showing <span class="font-medium text-gray-900">${assignmentsToShow?.length || 0}</span> 
                                    of <span class="font-medium text-gray-900">${assignmentsInTab.length}</span> assignments
                            </span>
                            <span class="filters-indicator">
                                    ${(assignmentsToShow?.length || 0) !== assignmentsInTab.length ? 
                                    `<span class="text-blue-600 font-medium">
                                        <i class="fas fa-filter mr-1"></i>
                                        Filters Applied
                                    </span>` : 
                                    ''
                                }
                            </span>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Assignments List -->
                <div class="assignments-list-container space-y-6">
                    ${(assignmentsToShow && assignmentsToShow.length > 0) ? 
                        assignmentsToShow.map(assignment => this.generateAssignmentHTML(assignment)).join('') :
                        (assignmentsInTab.length === 0 ? this.generateEmptyTabHTML(status) : this.generateNoAssignmentsHTML())
                    }
                </div>
            </div>
        `;
    }
}

customElements.define('app-teacher-assignments-page', TeacherAssignmentsPage);
export default TeacherAssignmentsPage;