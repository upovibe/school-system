import App from '@/core/App.js';
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
        this.assignments = [
            {
                id: 1,
                title: 'Mathematics Problem Set',
                subject: 'Mathematics',
                description: 'Complete problems 1-20 from Chapter 5. Show all work and calculations.',
                dueDate: '2024-01-15',
                status: 'pending',
                grade: null,
                submittedAt: null,
                teacher: 'Mr. Johnson',
                category: 'Homework'
            },
            {
                id: 2,
                title: 'English Essay - Shakespeare',
                subject: 'English Literature',
                description: 'Write a 1000-word essay analyzing the themes in Macbeth. Include proper citations.',
                dueDate: '2024-01-10',
                status: 'submitted',
                grade: 'A-',
                submittedAt: '2024-01-08T14:30:00',
                teacher: 'Mrs. Williams',
                category: 'Essay'
            },
            {
                id: 3,
                title: 'Science Lab Report',
                subject: 'Physics',
                description: 'Complete lab report for the pendulum experiment. Include graphs and analysis.',
                dueDate: '2024-01-20',
                status: 'overdue',
                grade: null,
                submittedAt: null,
                teacher: 'Dr. Smith',
                category: 'Lab Report'
            },
            {
                id: 4,
                title: 'History Research Paper',
                subject: 'World History',
                description: 'Research paper on the Industrial Revolution. Minimum 1500 words with bibliography.',
                dueDate: '2024-01-25',
                status: 'pending',
                grade: null,
                submittedAt: null,
                teacher: 'Mr. Davis',
                category: 'Research Paper'
            },
            {
                id: 5,
                title: 'French Vocabulary Quiz',
                subject: 'French',
                description: 'Study vocabulary from Chapter 3. Quiz will cover 50 words.',
                dueDate: '2024-01-12',
                status: 'completed',
                grade: 'B+',
                submittedAt: '2024-01-12T09:15:00',
                teacher: 'Mme. Dubois',
                category: 'Quiz'
            },
            {
                id: 6,
                title: 'Art Portfolio Review',
                subject: 'Art',
                description: 'Submit portfolio of 5 original artworks with artist statement.',
                dueDate: '2024-01-30',
                status: 'pending',
                grade: null,
                submittedAt: null,
                teacher: 'Ms. Rodriguez',
                category: 'Portfolio'
            }
        ];
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'My Assignments | School System';
    }

    getStatusBadge(status) {
        const statusConfig = {
            pending: { variant: 'warning', text: 'Pending', icon: 'fas fa-clock' },
            submitted: { variant: 'info', text: 'Submitted', icon: 'fas fa-check-circle' },
            completed: { variant: 'success', text: 'Completed', icon: 'fas fa-check-double' },
            overdue: { variant: 'error', text: 'Overdue', icon: 'fas fa-exclamation-triangle' }
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        return `<ui-badge variant="${config.variant}"><i class="${config.icon} mr-1"></i>${config.text}</ui-badge>`;
    }

    getGradeBadge(grade) {
        if (!grade) return '<span class="text-gray-500">Not graded</span>';
        
        const gradeColors = {
            'A+': 'text-green-600',
            'A': 'text-green-600',
            'A-': 'text-green-500',
            'B+': 'text-blue-600',
            'B': 'text-blue-500',
            'B-': 'text-blue-400',
            'C+': 'text-yellow-600',
            'C': 'text-yellow-500',
            'C-': 'text-yellow-400',
            'D+': 'text-orange-600',
            'D': 'text-orange-500',
            'F': 'text-red-600'
        };
        
        const color = gradeColors[grade] || 'text-gray-600';
        return `<span class="font-bold ${color}">${grade}</span>`;
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

    render() {
        const pendingAssignments = this.assignments.filter(a => a.status === 'pending');
        const submittedAssignments = this.assignments.filter(a => a.status === 'submitted');
        const completedAssignments = this.assignments.filter(a => a.status === 'completed');
        const overdueAssignments = this.assignments.filter(a => a.status === 'overdue');

        return `
            <div class="space-y-6">
                <!-- Page Header -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <i class="fas fa-tasks text-xl"></i>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold">My Assignments</h1>
                                <p class="text-blue-100">Track your academic tasks and submissions</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold">${this.assignments.length}</div>
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
                                <p class="text-sm text-gray-600">Completed</p>
                                <p class="text-2xl font-bold text-green-600">${completedAssignments.length}</p>
                            </div>
                            <i class="fas fa-check-double text-green-500 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Overdue</p>
                                <p class="text-2xl font-bold text-red-600">${overdueAssignments.length}</p>
                            </div>
                            <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Assignments List -->
                <div class="space-y-4">
                    <h2 class="text-xl font-semibold text-gray-900">All Assignments</h2>
                    
                    ${this.assignments.map(assignment => `
                        <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                            <div class="p-6">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-2">
                                            <h3 class="text-lg font-semibold text-gray-900">${assignment.title}</h3>
                                            ${this.getStatusBadge(assignment.status)}
                                        </div>
                                        <p class="text-gray-600 mb-3">${assignment.description}</p>
                                        
                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            <div class="flex items-center gap-2">
                                                <i class="fas fa-book text-blue-500"></i>
                                                <span class="text-gray-700">${assignment.subject}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <i class="fas fa-user-tie text-green-500"></i>
                                                <span class="text-gray-700">${assignment.teacher}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <i class="fas fa-calendar-alt text-purple-500"></i>
                                                <span class="text-gray-700">${this.getDaysUntilDue(assignment.dueDate)}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <i class="fas fa-tag text-orange-500"></i>
                                                <span class="text-gray-700">${assignment.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="text-right ml-4">
                                        <div class="mb-2">
                                            <p class="text-xs text-gray-500">Grade</p>
                                            ${this.getGradeBadge(assignment.grade)}
                                        </div>
                                        ${assignment.submittedAt ? `
                                            <div class="text-xs text-gray-500">
                                                Submitted: ${new Date(assignment.submittedAt).toLocaleDateString()}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div class="text-sm text-gray-500">
                                        Due: ${new Date(assignment.dueDate).toLocaleDateString()}
                                    </div>
                                    <div class="flex gap-2">
                                        ${assignment.status === 'pending' || assignment.status === 'overdue' ? `
                                            <ui-button variant="primary" size="sm">
                                                <i class="fas fa-upload mr-2"></i>Submit
                                            </ui-button>
                                        ` : ''}
                                        <ui-button variant="secondary" size="sm">
                                            <i class="fas fa-eye mr-2"></i>View Details
                                        </ui-button>
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