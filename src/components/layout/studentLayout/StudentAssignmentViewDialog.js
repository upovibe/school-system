import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Button.js';
import '@/components/ui/ContentDisplay.js';
import api from '@/services/api.js';

/**
 * Student Assignment View Dialog Component
 * 
 * A dialog for viewing assignment details from student perspective
 */
class StudentAssignmentViewDialog extends HTMLElement {
    constructor() {
        super();
        this.assignmentData = null;
        this.loading = false;
    }

    connectedCallback() {
        this.render();
    }

    async openAssignment(assignmentId) {
        console.log('Opening student assignment dialog for ID:', assignmentId);

        // Show loading dialog first
        this.loading = true;
        this.render();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            console.log('Loading assignment data...');
            const response = await api.withToken(token).get(`/students/assignments/${assignmentId}`);

            if (response.data && response.data.success) {
                this.assignmentData = response.data.data;
                console.log('Assignment loaded:', this.assignmentData);
                this.loading = false;
                this.render();

                // Open the dialog
                const dialog = this.querySelector('ui-dialog');
                if (dialog) {
                    dialog.open();
                }
            }
        } catch (error) {
            console.error('Error loading assignment:', error);
            this.loading = false;
            this.render();
        }
    }

    close() {
        const dialog = this.querySelector('ui-dialog');
        if (dialog) {
            dialog.close();
        }
        this.assignmentData = null;
        this.render();
    }

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

    getStatusColor(status) {
        switch (status?.toLowerCase()) {
            case 'published': return 'success';
            case 'draft': return 'warning';
            case 'archived': return 'secondary';
            default: return 'primary';
        }
    }

    getTypeColor(type) {
        switch (type?.toLowerCase()) {
            case 'homework': return 'info';
            case 'quiz': return 'warning';
            case 'exam': return 'error';
            case 'project': return 'success';
            default: return 'primary';
        }
    }

    getSubmissionStatusColor(submission) {
        if (!submission) return 'warning';
        if (submission.grade) return 'success';
        return 'info';
    }

    getSubmissionStatusText(submission) {
        if (!submission) return 'Not Submitted';
        if (submission.grade) return 'Graded';
        return 'Submitted';
    }

    render() {
        if (this.loading) {
            this.innerHTML = `
                <ui-dialog size="lg">
                    <div slot="title">Loading Assignment...</div>
                    <div slot="content" class="flex items-center justify-center p-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span class="ml-2 text-gray-600">Loading assignment details...</span>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        if (!this.assignmentData) {
            this.innerHTML = `
                <ui-dialog size="lg">
                    <div slot="title">Assignment Details</div>
                    <div slot="content" class="p-4">
                        <p>No assignment data available.</p>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        const assignment = this.assignmentData;
        const submission = assignment.submission;

        this.innerHTML = `
            <ui-dialog size="lg">
                <div slot="title">Assignment Details</div>
                
                <div slot="content">
                    <!-- Assignment Header with Gradient Background -->
                    <div class="border-b border-indigo-100">
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-1">
                            <div class="flex-1 mb-5">
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <i class="fas fa-tasks text-white text-lg"></i>
                                    </div>
                                    <div>
                                        <h2 class="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                            ${assignment.title}
                                        </h2>
                                        <div class="flex items-center gap-2">
                                            <ui-badge color="${this.getStatusColor(assignment.status)}" size="sm">
                                                ${assignment.status?.toUpperCase() || 'UNKNOWN'}
                                            </ui-badge>
                                            <ui-badge color="${this.getTypeColor(assignment.assignment_type)}" size="sm">
                                                ${assignment.assignment_type?.toUpperCase() || 'GENERAL'}
                                            </ui-badge>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Info Cards -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div class="bg-gray-300 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-graduation-cap text-emerald-600 text-sm"></i>
                                            </div>
                                            <div>
                                                <p class="text-xs text-gray-500 font-medium">Class</p>
                                                <p class="text-sm font-semibold text-gray-800">${assignment.class.name}-${assignment.class.section}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="bg-gray-300 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-book text-blue-600 text-sm"></i>
                                            </div>
                                            <div>
                                                <p class="text-xs text-gray-500 font-medium">Subject</p>
                                                <p class="text-sm font-semibold text-gray-800">${assignment.subject.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="bg-gray-300 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-calendar text-orange-600 text-sm"></i>
                                            </div>
                                            <div>
                                                <p class="text-xs text-gray-500 font-medium">Due Date</p>
                                                <p class="text-sm font-semibold text-gray-800">${this.formatDate(assignment.due_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="bg-gray-300 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-star text-yellow-600 text-sm"></i>
                                            </div>
                                            <div>
                                                <p class="text-xs text-gray-500 font-medium">Points</p>
                                                <p class="text-sm font-semibold text-gray-800">${assignment.total_points}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="bg-gray-300 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-user text-purple-600 text-sm"></i>
                                            </div>
                                            <div>
                                                <p class="text-xs text-gray-500 font-medium">Teacher</p>
                                                <p class="text-sm font-semibold text-gray-800">${assignment.teacher.full_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="bg-gray-300 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-check-circle text-green-600 text-sm"></i>
                                            </div>
                                            <div>
                                                <p class="text-xs text-gray-500 font-medium">Submission Status</p>
                                                <p class="text-sm font-semibold text-gray-800">${this.getSubmissionStatusText(submission)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Assignment Description -->
                    <div class="mb-6">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-file-text text-green-500"></i>
                            <h3 class="text-lg font-semibold text-gray-900">Description</h3>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4">
                            ${assignment.description ? `
                                <content-display 
                                    content="${assignment.description.replace(/"/g, '&quot;')}"
                                    max-height="300px"
                                    no-styles>
                                </content-display>
                            ` : `
                                <p class="text-gray-500 italic">No description provided for this assignment.</p>
                            `}
                        </div>
                        
                        ${assignment.attachment_file ? `
                            <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center">
                                        <i class="fas fa-paperclip text-blue-600 mr-2"></i>
                                        <span class="text-sm font-medium text-blue-800">
                                            ${assignment.attachment_file.split('/').pop()}
                                        </span>
                                    </div>
                                    <ui-button variant="secondary" size="sm" onclick="window.open('${assignment.attachment_file}', '_blank')">
                                        <i class="fas fa-download mr-1"></i>
                                        Download
                                    </ui-button>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Submission Details -->
                    ${submission ? `
                        <div class="mb-6">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-upload text-blue-500"></i>
                                <h3 class="text-lg font-semibold text-gray-900">Your Submission</h3>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-4 space-y-4">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium text-gray-700">Submitted:</span>
                                    <span class="text-sm text-gray-600">${this.formatDate(submission.submitted_at)}</span>
                                </div>
                                
                                ${submission.submission_text ? `
                                    <div>
                                        <h4 class="text-sm font-medium text-gray-700 mb-2">Submission Text:</h4>
                                        <div class="bg-white rounded-lg p-3 border border-gray-200">
                                            <p class="text-sm text-gray-800">${submission.submission_text}</p>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${submission.submission_file ? `
                                    <div>
                                        <h4 class="text-sm font-medium text-gray-700 mb-2">Submitted File:</h4>
                                        <div class="bg-white rounded-lg p-3 border border-gray-200">
                                            <div class="flex items-center justify-between">
                                                <span class="text-sm text-gray-800">${submission.submission_file.split('/').pop()}</span>
                                                <ui-button variant="secondary" size="sm" onclick="window.open('${submission.submission_file}', '_blank')">
                                                    <i class="fas fa-download mr-1"></i>
                                                    Download
                                                </ui-button>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${submission.grade ? `
                                    <div class="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-3">
                                                <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                                    <i class="fas fa-trophy text-white text-sm"></i>
                                                </div>
                                                <div>
                                                    <p class="text-sm font-medium text-emerald-700">Grade</p>
                                                    <p class="text-lg font-bold text-gray-900">${submission.grade}/${assignment.total_points} points</p>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <div class="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <span class="text-white font-bold text-sm">${Math.round((submission.grade / assignment.total_points) * 100)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${submission.feedback ? `
                                    <div>
                                        <h4 class="text-sm font-medium text-gray-700 mb-2">Teacher Feedback:</h4>
                                        <div class="bg-white rounded-lg p-3 border border-gray-200">
                                            <p class="text-sm text-gray-800">${submission.feedback}</p>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="mb-6">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-exclamation-triangle text-amber-500"></i>
                                <h3 class="text-lg font-semibold text-gray-900">Submission Status</h3>
                            </div>
                            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div class="flex items-center">
                                    <i class="fas fa-clock text-amber-600 mr-2"></i>
                                    <span class="text-amber-800 font-medium">Not submitted yet</span>
                                </div>
                                <p class="text-amber-700 text-sm mt-2">
                                    You haven't submitted this assignment yet. Make sure to submit before the due date.
                                </p>
                            </div>
                        </div>
                    `}
                </div>
                
                <div slot="footer" class="flex justify-end gap-3">
                    ${!submission ? `
                        <ui-button variant="primary" onclick="window.location.href='/dashboard/student/assignments'">
                            <i class="fas fa-upload mr-1"></i>
                            Submit Assignment
                        </ui-button>
                    ` : ''}
                    <ui-button variant="secondary" onclick="this.closest('ui-dialog').close()">
                        Close
                    </ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('student-assignment-view-dialog', StudentAssignmentViewDialog);
export default StudentAssignmentViewDialog; 