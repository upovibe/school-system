import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Table.js';
import '@/components/ui/Alert.js';

/**
 * Teacher Student Assignment View Component
 * 
 * Displays a specific student's assignments and submissions
 */
class TeacherStudentAssignmentView extends App {
    constructor() {
        super();
        console.log('🔍 TeacherStudentAssignmentView constructor called');
        this.studentId = null;
        this.studentData = null;
        this.assignments = [];
        this.loading = false;
        this.error = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        console.log('🔍 TeacherStudentAssignmentView connected!');
        this.addEventListener('modal-close', this.close.bind(this));
    }

    async openStudentAssignments(studentId, studentData) {
        console.log('🔍 TeacherStudentAssignmentView.openStudentAssignments called');
        console.log('🔍 Student ID:', studentId);
        console.log('🔍 Student Data:', studentData);
        
        this.studentId = studentId;
        this.studentData = studentData;
        this.set('loading', true);
        this.set('error', null);

        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                this.set('error', 'Authentication required. Please log in again.');
                return;
            }

            console.log('🔍 Fetching student assignments...');
            // Fetch student's assignment history
            const response = await api.withToken(token).get(`/teachers/students/${studentId}/assignments`);
            
            console.log('🔍 API Response:', response);
            
            if (response.data && response.data.success) {
                this.set('assignments', response.data.data);
            } else {
                this.set('error', 'Failed to load student assignments');
            }
        } catch (error) {
            console.error('Error loading student assignments:', error);
            this.set('error', 'Failed to load student assignments. Please try again.');
        } finally {
            this.set('loading', false);
        }

        // Open the modal
        console.log('🔍 Setting open attribute...');
        this.setAttribute('open', '');
        console.log('🔍 Modal should now be open');
    }

    close() {
        this.removeAttribute('open');
        this.studentId = null;
        this.studentData = null;
        this.set('assignments', []);
        this.set('error', null);
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
            case 'submitted': return 'info';
            case 'graded': return 'success';
            case 'late': return 'warning';
            case 'not_submitted': return 'secondary';
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

    // Prepare assignment data for table
    prepareAssignmentTableData(assignments) {
        return assignments.map(assignment => ({
            id: assignment.id,
            title: assignment.title,
            type: assignment.assignment_type,
            due_date: this.formatDate(assignment.due_date),
            submitted_at: assignment.submitted_at ? this.formatDate(assignment.submitted_at) : 'Not submitted',
            grade: assignment.grade || 'Not graded',
            status: assignment.submission_status || 'not_submitted',
            total_points: assignment.total_points || 'Not set',
            class_name: `${assignment.class_name}-${assignment.class_section}`,
            subject_name: assignment.subject_name
        }));
    }

    // Get assignment table columns
    getAssignmentTableColumns() {
        return [
            { key: 'title', label: 'Assignment Title' },
            { key: 'type', label: 'Type' },
            { key: 'class_name', label: 'Class' },
            { key: 'subject_name', label: 'Subject' },
            { key: 'due_date', label: 'Due Date' },
            { key: 'submitted_at', label: 'Submitted' },
            { key: 'grade', label: 'Grade' },
            { key: 'status', label: 'Status', render: this.renderStatus.bind(this) }
        ];
    }

    // Render status with visual indicator
    renderStatus(value, row) {
        const statusColors = {
            'submitted': 'info',
            'graded': 'success',
            'late': 'warning',
            'not_submitted': 'secondary'
        };

        const color = statusColors[value] || 'primary';
        const label = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');

        return `<ui-badge color="${color}" size="sm">${label}</ui-badge>`;
    }

    render() {
        const loading = this.get('loading');
        const error = this.get('error');
        const assignments = this.get('assignments');
        const studentData = this.studentData;

        if (!studentData) {
            return '';
        }

        return `
            <ui-modal title="Student Assignment History" size="lg">
                <div slot="content" class="space-y-6">
                    ${loading ? `
                        <div class="flex items-center justify-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span class="ml-3 text-gray-600">Loading student assignments...</span>
                        </div>
                    ` : error ? `
                        <ui-alert variant="error" title="Error" message="${error}">
                            <button slot="action" onclick="this.closest('teacher-student-assignment-view').openStudentAssignments('${this.studentId}', ${JSON.stringify(this.studentData)})" class="text-sm font-medium text-red-800 hover:text-red-900">
                                Try Again
                            </button>
                        </ui-alert>
                    ` : `
                        <!-- Student Information Header -->
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                            <div class="flex items-center space-x-4">
                                <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-user-graduate text-white text-2xl"></i>
                                </div>
                                <div class="flex-1">
                                    <h2 class="text-2xl font-bold text-gray-900">
                                        ${studentData.first_name} ${studentData.last_name}
                                    </h2>
                                    <p class="text-gray-600">
                                        Student ID: ${studentData.student_id} | 
                                        Email: ${studentData.email || 'No email'} | 
                                        Status: <span class="font-medium ${studentData.status === 'active' ? 'text-green-600' : 'text-red-600'}">${studentData.status}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Assignment Statistics -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="bg-white rounded-lg p-4 border border-gray-200">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                                        <i class="fas fa-tasks text-white"></i>
                                    </div>
                                    <div>
                                        <div class="text-2xl font-bold text-gray-900">${assignments.length}</div>
                                        <div class="text-sm text-gray-600">Total Assignments</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 border border-gray-200">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                                        <i class="fas fa-check-circle text-white"></i>
                                    </div>
                                    <div>
                                        <div class="text-2xl font-bold text-gray-900">${assignments.filter(a => a.submission_status === 'submitted' || a.submission_status === 'graded').length}</div>
                                        <div class="text-sm text-gray-600">Submitted</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 border border-gray-200">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
                                        <i class="fas fa-star text-white"></i>
                                    </div>
                                    <div>
                                        <div class="text-2xl font-bold text-gray-900">${assignments.filter(a => a.grade && a.grade !== 'Not graded').length}</div>
                                        <div class="text-sm text-gray-600">Graded</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-lg p-4 border border-gray-200">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                        <i class="fas fa-chart-line text-white"></i>
                                    </div>
                                    <div>
                                        <div class="text-2xl font-bold text-gray-900">
                                            ${assignments.filter(a => a.grade && a.grade !== 'Not graded').length > 0 
                                                ? Math.round(assignments.filter(a => a.grade && a.grade !== 'Not graded').reduce((sum, a) => sum + parseFloat(a.grade), 0) / assignments.filter(a => a.grade && a.grade !== 'Not graded').length) 
                                                : 0}%
                                        </div>
                                        <div class="text-sm text-gray-600">Average Grade</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Assignments Table -->
                        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-list-alt text-white text-sm"></i>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900">Assignment History</h3>
                                </div>
                            </div>
                            
                            ${assignments.length > 0 ? `
                                <ui-table 
                                    data='${JSON.stringify(this.prepareAssignmentTableData(assignments))}'
                                    columns='${JSON.stringify(this.getAssignmentTableColumns())}'
                                    title="Student Assignments"
                                    searchable
                                    search-placeholder="Search assignments..."
                                    striped
                                    print
                                    sortable
                                    refresh>
                                </ui-table>
                            ` : `
                                <div class="p-8 text-center">
                                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-inbox text-2xl text-gray-400"></i>
                                    </div>
                                    <h3 class="text-lg font-medium text-gray-900 mb-2">No Assignments Found</h3>
                                    <p class="text-gray-500">
                                        This student doesn't have any assignments yet.
                                    </p>
                                </div>
                            `}
                        </div>
                    `}
                </div>
                
                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button onclick="this.closest('teacher-student-assignment-view').close()" variant="secondary">
                        Close
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('teacher-student-assignment-view', TeacherStudentAssignmentView);
export default TeacherStudentAssignmentView; 