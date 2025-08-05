import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';

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
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'My Assignments | School System';
        await this.loadAssignments();
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

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const assignments = this.get('assignments');

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
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        if (!assignments || assignments.length === 0) {
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

        const pendingAssignments = assignments.filter(a => a.submission_status === 'not_submitted');
        const submittedAssignments = assignments.filter(a => a.submission_status === 'submitted');
        const gradedAssignments = assignments.filter(a => a.submission_status === 'graded');
        const lateAssignments = assignments.filter(a => a.submission_status === 'late');

        return `
            <div class="space-y-6">
                <!-- Page Header -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="size-12 min-w-12 bg-white/20 rounded-full flex items-center justify-center">
                                <i class="fas fa-tasks text-xl"></i>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold">My Assignments</h1>
                                <p class="text-blue-100">Track your academic tasks and submissions</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold">${assignments.length}</div>
                            <div class="text-blue-100 text-sm">Total Assignments</div>
                        </div>
                    </div>
                </div>

                <!-- Assignment Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Pending</p>
                                <p class="text-2xl font-bold text-yellow-600">${pendingAssignments.length}</p>
                            </div>
                            <i class="fas fa-clock text-yellow-500 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Submitted</p>
                                <p class="text-2xl font-bold text-blue-600">${submittedAssignments.length}</p>
                            </div>
                            <i class="fas fa-check-circle text-blue-500 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Graded</p>
                                <p class="text-2xl font-bold text-green-600">${gradedAssignments.length}</p>
                            </div>
                            <i class="fas fa-check-double text-green-500 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Late</p>
                                <p class="text-2xl font-bold text-red-600">${lateAssignments.length}</p>
                            </div>
                            <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Assignments List -->
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-900">All Assignments</h2>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-500">${assignments.length} assignments</span>
                        </div>
                    </div>
                    
                    ${assignments.map(assignment => `
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
                                            class="size-8 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200" 
                                            title="View Details">
                                            <i class="fas fa-eye text-xs"></i>
                                        </button>
                                        ${assignment.submission_status === 'not_submitted' ? `
                                            <button 
                                                class="size-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200" 
                                                title="Submit Assignment">
                                                <i class="fas fa-upload text-xs"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

customElements.define('app-student-assignments-page', StudentAssignmentsPage);
export default StudentAssignmentsPage; 