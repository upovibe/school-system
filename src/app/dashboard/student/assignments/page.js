import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Tabs.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/studentLayout/StudentAssignmentViewDialog.js';
import '@/components/layout/studentLayout/StudentAssignmentSubmissionModal.js';

/**
 * Student Assignments Page Component (/dashboard/student/assignments)
 * 
 * Displays student assignments with status, due dates, and submission details.
 */
class StudentAssignmentsPage extends App {
    constructor() {
        super();
        this.assignments = [];
        this.loading = true;
        this.error = null;
        this.showSubmitModal = false;
        this.searchTerm = '';
        this.sortBy = 'due_date';
        this.sortOrder = 'asc';
        this.activeTab = 'not_submitted'; // Default active tab
        this.filters = {
            status: '',
            assignment_type: '',
            subject_id: ''
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
        const assignments = this.get('assignments');
        const assignmentsContainer = this.querySelector('.assignments-list-container');
        
        if (!assignmentsContainer || !assignments) return;
        
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
                of <span class="font-medium text-gray-900">${assignments.length}</span> assignments
            `;
        }
        
        // Update filters applied indicator
        const filtersIndicator = this.querySelector('.filters-indicator');
        if (filtersIndicator) {
            if ((filteredAssignments?.length || 0) !== assignments.length) {
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
        
        // Add event listeners for button clicks
        this.addEventListener('click', this.onButtonClick.bind(this));
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for modal events
        this.addEventListener('assignment-submitted', this.onAssignmentSubmitted.bind(this));
        this.addEventListener('modal-closed', (event) => {
            if (event.detail.type === 'submit-assignment') {
                this.set('showSubmitModal', false);
            }
        });
        
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
        if (action === 'show-student-assignments-info') {
            this.showStudentAssignmentsInfo();
        }
    }

    showStudentAssignmentsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-tasks text-blue-500 mr-2"></i>
                <span class="font-semibold">About My Assignments</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">Track and submit your assignments. Use tabs and filters to organize work.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between"><span class="text-sm font-medium">Tabs</span><span class="text-sm text-gray-600">Pending, Submitted, Graded, Overdue, Archived</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Filters</span><span class="text-sm text-gray-600">Type, Subject, Sort</span></div>
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

    // Get assignments by submission status (only published assignments)
    getAssignmentsByStatus(status) {
        const assignments = this.get('assignments') || [];
        
        // Filter to only show published assignments
        const publishedAssignments = assignments.filter(a => a.status === 'published' && !a.deleted_at);
        
        switch (status) {
            case 'submitted':
                return publishedAssignments.filter(a => a.submission_status === 'submitted');
            case 'graded':
                return publishedAssignments.filter(a => a.submission_status === 'graded');
            case 'not_submitted':
                return publishedAssignments.filter(a => (a.submission_status === 'not_submitted' || a.submission_status === 'late'));
            case 'overdue':
                return publishedAssignments.filter(a => {
                    if (a.submission_status === 'not_submitted' || a.submission_status === 'late') {
                        return a.due_date && new Date(a.due_date) < new Date();
                    }
                    return false;
                });
            case 'archived':
                return publishedAssignments.filter(a => a.archived_at);
            default:
                return publishedAssignments.filter(a => !a.archived_at);
        }
    }

    // Get tab counts
    getTabCounts() {
        const assignments = this.get('assignments') || [];
        
        // Filter to only show published assignments
        const publishedAssignments = assignments.filter(a => a.status === 'published' && !a.deleted_at);
        
        // Count overdue assignments
        const overdueCount = publishedAssignments.filter(a => {
            if (a.submission_status === 'not_submitted' || a.submission_status === 'late') {
                return a.due_date && new Date(a.due_date) < new Date();
            }
            return false;
        }).length;
        
        return {
            submitted: publishedAssignments.filter(a => a.submission_status === 'submitted').length,
            graded: publishedAssignments.filter(a => a.submission_status === 'graded').length,
            not_submitted: publishedAssignments.filter(a => (a.submission_status === 'not_submitted' || a.submission_status === 'late')).length,
            archived: publishedAssignments.filter(a => a.archived_at).length,
            overdue: overdueCount
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

            const response = await api.withToken(token).get('/students/my-assignments');
            
            if (response.data && response.data.success) {
                this.set('assignments', response.data.data);
                this.applyFiltersAndSearch();
            } else {
                this.set('error', 'Failed to load assignments');
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
        } else if (target.matches('[data-filter="status"]')) {
            this.filters.status = target.value;
        } else if (target.matches('[data-filter="assignment_type"]')) {
            this.filters.assignment_type = target.value;
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
        // Get assignments for the current tab (only published assignments)
        const assignments = this.getAssignmentsByStatus(this.activeTab);
        let filtered = [...assignments];

        // Apply search filter
        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            filtered = filtered.filter(assignment => 
                assignment.title?.toLowerCase().includes(search) ||
                assignment.description?.toLowerCase().includes(search) ||
                assignment.subject?.name?.toLowerCase().includes(search) ||
                assignment.teacher?.full_name?.toLowerCase().includes(search) ||
                assignment.assignment_type?.toLowerCase().includes(search)
            );
        }

        // Apply assignment type filter
        if (this.filters.assignment_type) {
            filtered = filtered.filter(assignment => assignment.assignment_type === this.filters.assignment_type);
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
            if (this.sortBy === 'total_points' || this.sortBy === 'submission_grade') {
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
    getUniqueSubjects() {
        const assignments = this.getAssignmentsByStatus(this.activeTab);
        const subjects = assignments.map(a => ({ 
            id: a.subject_id, 
            name: a.subject?.name || 'Unknown Subject' 
        }));
        return [...new Map(subjects.map(s => [s.id, s])).values()];
    }

    getUniqueAssignmentTypes() {
        const assignments = this.getAssignmentsByStatus(this.activeTab);
        const types = [...new Set(assignments.map(a => a.assignment_type).filter(Boolean))];
        return types.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }));
    }

    // Clear all filters
    clearFilters() {
        this.searchTerm = '';
        this.filters = {
            assignment_type: '',
            subject_id: ''
        };
        this.sortBy = 'due_date';
        this.sortOrder = 'asc';
        
        // Reset form elements
        const searchInput = this.querySelector('[data-filter="search"]');
        if (searchInput) searchInput.value = '';
        
        const filterElements = this.querySelectorAll('[data-filter]:not([data-filter="search"])');
        filterElements.forEach(el => el.value = '');
        
        this.applyFiltersAndSearch();
    }

    getStatusBadge(status) {
        const statusConfig = {
            'not_submitted': { color: 'warning', text: 'Not Submitted', icon: 'fas fa-clock' },
            'submitted': { color: 'info', text: 'Submitted', icon: 'fas fa-check-circle' },
            'graded': { color: 'success', text: 'Graded', icon: 'fas fa-check-double' },
            'late': { color: 'error', text: 'Late', icon: 'fas fa-exclamation-triangle' }
        };
        
        const config = statusConfig[status] || statusConfig['not_submitted'];
        return `<ui-badge color="${config.color}"><i class="${config.icon} mr-1"></i>${config.text}</ui-badge>`;
    }

    getGradeBadge(grade, totalPoints) {
        if (!grade) return '<span class="text-gray-500">Not graded</span>';
        
        const percentage = (grade / totalPoints) * 100;
        let gradeLetter = '';
        let color = '';
        
        if (percentage >= 90) {
            gradeLetter = 'A';
            color = 'text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-semibold';
        } else if (percentage >= 80) {
            gradeLetter = 'B';
            color = 'text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-semibold';
        } else if (percentage >= 70) {
            gradeLetter = 'C';
            color = 'text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-semibold';
        } else if (percentage >= 60) {
            gradeLetter = 'D';
            color = 'text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-semibold';
        } else {
            gradeLetter = 'F';
            color = 'text-red-600 bg-red-100 px-2 py-1 rounded-full font-semibold';
        }
        
        return `<span class="${color}">${gradeLetter}</span>`;
    }

    getDaysUntilDue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `Due in ${diffDays} days`;
    }

    isAssignmentPastDue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        return today > due;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getAssignmentTypeBadge(type) {
        const typeConfig = {
            'homework': { color: 'info', text: 'Homework', icon: 'fas fa-book' },
            'quiz': { color: 'warning', text: 'Quiz', icon: 'fas fa-question-circle' },
            'exam': { color: 'error', text: 'Exam', icon: 'fas fa-file-alt' },
            'project': { color: 'success', text: 'Project', icon: 'fas fa-project-diagram' },
            'other': { color: 'secondary', text: 'Other', icon: 'fas fa-tasks' }
        };
        
        const config = typeConfig[type] || typeConfig['other'];
        return `<ui-badge color="${config.color}"><i class="${config.icon} mr-1"></i>${config.text}</ui-badge>`;
    }

    // Generate HTML for a single assignment
    generateAssignmentHTML(assignment) {
        return `
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <!-- Assignment Header -->
                <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="size-10 min-w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <i class="fas fa-file-alt text-white text-sm"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-900">${assignment.title}</h3>
                                <div class="flex items-center space-x-2">
                                    ${this.getStatusBadge(assignment.submission_status)}
                                    ${this.getAssignmentTypeBadge(assignment.assignment_type)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Assignment Content -->
                <div class="p-6">
                    <!-- Description -->
                    <div class="mb-6">
                        <p class="text-gray-700 leading-relaxed">${assignment.description}</p>
                    </div>
                    
                    <!-- Assignment Details Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div class="bg-blue-50 rounded-lg p-3">
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-book text-blue-600 text-sm"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-blue-600 font-medium">Subject</p>
                                    <p class="text-sm font-semibold text-gray-900">${assignment.subject.name}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-green-50 rounded-lg p-3">
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-user-tie text-green-600 text-sm"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-green-600 font-medium">Teacher</p>
                                    <p class="text-sm font-semibold text-gray-900">${assignment.teacher.gender === 'female' ? 'Madam' : 'Sir'} ${assignment.teacher.full_name}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-purple-50 rounded-lg p-3">
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calendar-alt text-purple-600 text-sm"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-purple-600 font-medium">Due Date</p>
                                    <p class="text-sm font-semibold text-gray-900">${this.formatDate(assignment.due_date)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-orange-50 rounded-lg p-3">
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-star text-orange-600 text-sm"></i>
                                </div>
                                <div>
                                    <p class="text-xs text-orange-600 font-medium">Points</p>
                                    <p class="text-sm font-semibold text-gray-900">${assignment.total_points} pts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Grade Display Section -->
                    ${assignment.submission_grade ? `
                        <div class="mb-6">
                            <div class="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-trophy text-white text-sm"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm font-medium text-emerald-700">Grade</p>
                                            <p class="text-lg font-bold text-gray-900">${assignment.submission_grade}/${assignment.total_points} points</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        ${this.getGradeBadge(assignment.submission_grade, assignment.total_points)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Submission Info -->
                    ${assignment.submission ? `
                        <div class="bg-gray-50 rounded-lg p-4 mb-6">
                            <div class="flex flex-col lg:flex-row lg:items-center md:justify-between space-y-3 md:space-y-0">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-check-circle text-green-600"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">Submitted</p>
                                        <p class="text-xs text-gray-500 text-nowrap">${this.formatDate(assignment.submitted_at)}</p>
                                    </div>
                                </div>
                                ${assignment.submission.feedback ? `
                                    <div class="md:text-right">
                                        <p class="text-xs text-gray-500 mb-1">Feedback</p>
                                        <p class="text-sm font-medium text-blue-600">${assignment.submission.feedback}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="bg-yellow-50 rounded-lg p-4 mb-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-clock text-yellow-600"></i>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-900">Not Submitted</p>
                                    <p class="text-xs text-gray-500">${this.getDaysUntilDue(assignment.due_date)}</p>
                                </div>
                            </div>
                        </div>
                    `}
                    
                    <!-- Action Buttons -->
                    <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            <span class="flex items-center space-x-1">
                                <i class="fas fa-clock"></i>
                                <span>${this.getDaysUntilDue(assignment.due_date)}</span>
                            </span>
                            ${assignment.submission_status === 'graded' ? `
                                <span class="flex items-center space-x-1 text-green-600">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Graded</span>
                                </span>
                            ` : ''}
                        </div>
                        
                        <div class="flex space-x-3">
                            <button 
                                class="view-assignment-btn size-8 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200" 
                                title="View Details"
                                data-assignment-id="${assignment.id}">
                                <i class="fas fa-eye text-xs"></i>
                            </button>
                            ${assignment.submission_status === 'not_submitted' ? `
                                <div class="flex space-x-3">
                                <button 
                                    class="submit-assignment-btn size-8 flex items-center justify-center ${this.isAssignmentPastDue(assignment.due_date) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors duration-200" 
                                    title="${this.isAssignmentPastDue(assignment.due_date) ? 'Assignment is past due' : 'Submit Assignment'}"
                                    data-assignment-id="${assignment.id}"
                                    ${this.isAssignmentPastDue(assignment.due_date) ? 'disabled' : ''}>
                                    <i class="fas fa-upload text-xs"></i>
                                    </button>
                                    ${this.isAssignmentPastDue(assignment.due_date) && !assignment.archived_at ? `
                                        <button 
                                            class="archive-assignment-btn size-8 flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors duration-200" 
                                            title="Archive Assignment"
                                            data-assignment-id="${assignment.id}">
                                            <i class="fas fa-archive text-xs"></i>
                                        </button>
                                    ` : this.isAssignmentPastDue(assignment.due_date) && assignment.archived_at ? `
                                        <button 
                                            class="unarchive-assignment-btn size-8 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200" 
                                            title="Unarchive Assignment"
                                            data-assignment-id="${assignment.id}">
                                            <i class="fas fa-folder-open text-xs"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            ` : (assignment.submission_status === 'submitted' || assignment.submission_status === 'graded' || assignment.submission_status === 'late') && !assignment.archived_at ? `
                                <button 
                                    class="archive-assignment-btn size-8 flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors duration-200" 
                                    title="Archive Assignment"
                                    data-assignment-id="${assignment.id}">
                                    <i class="fas fa-archive text-xs"></i>
                                </button>
                            ` : (assignment.submission_status === 'submitted' || assignment.submission_status === 'graded' || assignment.submission_status === 'late') && assignment.archived_at ? `
                                <button 
                                    class="unarchive-assignment-btn size-8 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200" 
                                    title="Unarchive Assignment"
                                    data-assignment-id="${assignment.id}">
                                    <i class="fas fa-folder-open text-xs"></i>
                                </button>
                            ` : ''}
                        </div>
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

    // Generate HTML for empty tab state
    generateEmptyTabHTML(status) {
        const statusLabels = {
            'submitted': 'Submitted',
            'graded': 'Graded',
            'not_submitted': 'Pending',
            'overdue': 'Overdue',
            'archived': 'Archived'
        };
        
        const statusDescriptions = {
            'submitted': 'You haven\'t submitted any assignments yet. Complete your assignments to see them here.',
            'graded': 'You don\'t have any graded assignments yet. Teachers will grade your submissions here.',
            'not_submitted': 'You don\'t have any pending assignments. All your assignments have been completed.',
            'overdue': 'You don\'t have any overdue assignments. Keep up with your deadlines!',
            'archived': 'You haven\'t archived any assignments yet. Archive completed assignments to organize your view.'
        };
        
        const statusIcons = {
            'submitted': 'fas fa-check-circle',
            'graded': 'fas fa-check-double',
            'not_submitted': 'fas fa-clock',
            'overdue': 'fas fa-exclamation-triangle',
            'archived': 'fas fa-archive'
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

    // Handle button clicks for view assignment
    onButtonClick(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const assignmentId = button.getAttribute('data-assignment-id');
        
        if (!assignmentId) return;

        if (button.classList.contains('view-assignment-btn')) {
            this.openAssignmentDialog(assignmentId);
        } else if (button.classList.contains('submit-assignment-btn')) {
            // Check if button is disabled (past due)
            if (button.disabled) {
                Toast.show({
                    title: 'Submission Closed',
                    message: 'This assignment is past due and submissions are no longer accepted.',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }
            this.openSubmitModal(assignmentId);
        } else if (button.classList.contains('archive-assignment-btn')) {
            this.archiveAssignment(assignmentId);
        } else if (button.classList.contains('unarchive-assignment-btn')) {
            this.unarchiveAssignment(assignmentId);
        }
    }

    // Open assignment view dialog
    openAssignmentDialog(assignmentId) {
        const dialog = this.querySelector('student-assignment-view-dialog');
        if (dialog) {
            dialog.openAssignment(assignmentId);
        }
    }

    // Open submit modal
    openSubmitModal(assignmentId) {
        this.set('showSubmitModal', true);
        
        // Open the modal
        const modal = this.querySelector('student-assignment-submission-modal');
        if (modal) {
            modal.open(assignmentId);
        }
    }

    // Handle assignment submitted
    onAssignmentSubmitted(event) {
        // Reload assignments to get updated status
        this.loadAssignments();
    }

    // Archive assignment
    async archiveAssignment(assignmentId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication required');
                return;
            }

            if (!confirm('Are you sure you want to archive this assignment? It will be hidden from your main view but can be unarchived later.')) {
                return;
            }

            const response = await api.withToken(token).patch(`/students/assignments/${assignmentId}/archive`);
            
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

            if (!confirm('Are you sure you want to unarchive this assignment? It will be visible in your main view again.')) {
                return;
            }

            const response = await api.withToken(token).patch(`/students/assignments/${assignmentId}/unarchive`);
            
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

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const assignments = this.get('assignments');
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
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white shadow rounded-lg p-4">
                            <div class="animate-pulse">
                                <div class="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div class="h-4 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (error) {
            return `
                <div class="space-y-6">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                            <div>
                                <h3 class="text-lg font-medium text-red-800">Error</h3>
                                <p class="text-red-700">${error}</p>
                                <button onclick="window.location.reload()" class="mt-2 text-sm font-medium text-red-800 hover:text-red-900">
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Filter to only show published assignments
        const publishedAssignments = assignments?.filter(a => a.status === 'published' && !a.deleted_at) || [];

        if (!assignments || publishedAssignments.length === 0) {
            return `
                <div class="space-y-6">
                    <div class="bg-white shadow rounded-lg p-8 text-center">
                        <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-tasks text-3xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No Assignments</h3>
                        <p class="text-gray-500 max-w-md mx-auto">
                            You don't have any assignments at the moment. Check back later for new assignments.
                        </p>
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
                                <h1 class="text-2xl sm:text-3xl font-bold">My Assignments</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-student-assignments-info" title="About My Assignments">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Track your academic tasks and submissions</p>
                            </div>
                        <div class="mt-4 sm:mt-0">
                        <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${publishedAssignments.length}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Assignments</div>
                        </div>
                    </div>
                </div>

                    <!-- Enhanced Summary Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                                <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-amber-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-clock text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${tabCounts.not_submitted}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Pending</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-check-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${tabCounts.submitted}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Submitted</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-check-double text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${tabCounts.graded}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Graded</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-red-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${tabCounts.overdue}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Overdue</div>
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
                                <ui-tab value="not_submitted">
                                    <i class="fas fa-clock text-amber-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Pending (${tabCounts.not_submitted})</span>
                                </ui-tab>
                                <ui-tab value="submitted">
                                    <i class="fas fa-check-circle text-green-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Submitted (${tabCounts.submitted})</span>
                                </ui-tab>
                                <ui-tab value="graded">
                                    <i class="fas fa-check-double text-purple-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Graded (${tabCounts.graded})</span>
                                </ui-tab>
                                <ui-tab value="overdue">
                                    <i class="fas fa-exclamation-triangle text-red-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Overdue (${tabCounts.overdue})</span>
                                </ui-tab>
                                <ui-tab value="archived">
                                    <i class="fas fa-archive text-blue-600 text-lg lg:text-base"></i>
                                    <span class="hidden lg:inline ml-1 font-medium">Archived (${tabCounts.archived})</span>
                                </ui-tab>
                            </ui-tab-list>
                            
                            <!-- Not Submitted Tab -->
                            <ui-tab-panel value="not_submitted">
                                ${this.renderTabContent('not_submitted', filteredAssignments)}
                            </ui-tab-panel>
                            
                            <!-- Submitted Tab -->
                            <ui-tab-panel value="submitted">
                                ${this.renderTabContent('submitted', filteredAssignments)}
                            </ui-tab-panel>
                            
                            <!-- Graded Tab -->
                            <ui-tab-panel value="graded">
                                ${this.renderTabContent('graded', filteredAssignments)}
                            </ui-tab-panel>

                            <!-- Overdue Tab -->
                            <ui-tab-panel value="overdue">
                                ${this.renderTabContent('overdue', filteredAssignments)}
                            </ui-tab-panel>

                            <!-- Archived Tab -->
                            <ui-tab-panel value="archived">
                                ${this.renderTabContent('archived', filteredAssignments)}
                            </ui-tab-panel>
                        </ui-tabs>
                    </div>
                </div>
            </div>
            
            <!-- Student Assignment View Dialog -->
            <student-assignment-view-dialog></student-assignment-view-dialog>
            
            <!-- Student Assignment Submission Modal -->
            <student-assignment-submission-modal ${this.get('showSubmitModal') ? 'open' : ''}></student-assignment-submission-modal>
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
                                    <h3 class="text-lg font-semibold text-gray-900">Filter & Search ${status === 'submitted' ? 'Submitted' : 'Not Submitted'} Assignments</h3>
                            </div>
                            <button 
                                onclick="this.closest('app-student-assignments-page').clearFilters()"
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
                                placeholder="Search assignments by title, description, subject, or teacher..."
                                value="${this.searchTerm}">
                            </ui-input>
                        </div>
                        
                        <!-- Filter Options -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                    <option value="due_date:asc" ${this.sortBy === 'due_date' && this.sortOrder === 'asc' ? 'selected' : ''}>Due Date (Earliest)</option>
                                    <option value="due_date:desc" ${this.sortBy === 'due_date' && this.sortOrder === 'desc' ? 'selected' : ''}>Due Date (Latest)</option>
                                    <option value="title:asc" ${this.sortBy === 'title' && this.sortOrder === 'asc' ? 'selected' : ''}>Title A-Z</option>
                                    <option value="title:desc" ${this.sortBy === 'title' && this.sortOrder === 'desc' ? 'selected' : ''}>Title Z-A</option>
                                    <option value="created_at:desc" ${this.sortBy === 'created_at' && this.sortOrder === 'desc' ? 'selected' : ''}>Newest First</option>
                                    <option value="created_at:asc" ${this.sortBy === 'created_at' && this.sortOrder === 'asc' ? 'selected' : ''}>Oldest First</option>
                                    <option value="total_points:desc" ${this.sortBy === 'total_points' && this.sortOrder === 'desc' ? 'selected' : ''}>Points (High to Low)</option>
                                    <option value="total_points:asc" ${this.sortBy === 'total_points' && this.sortOrder === 'asc' ? 'selected' : ''}>Points (Low to High)</option>
                                    <option value="submission_grade:desc" ${this.sortBy === 'submission_grade' && this.sortOrder === 'desc' ? 'selected' : ''}>Grade (High to Low)</option>
                                    <option value="submission_grade:asc" ${this.sortBy === 'submission_grade' && this.sortOrder === 'asc' ? 'selected' : ''}>Grade (Low to High)</option>
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
                        (this.getAssignmentsByStatus(status).length === 0 ? this.generateEmptyTabHTML(status) : this.generateNoAssignmentsHTML())
                        }
                    </div>
                </div>
        `;
    }
}

customElements.define('app-student-assignments-page', StudentAssignmentsPage);
export default StudentAssignmentsPage; 