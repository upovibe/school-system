import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Button.js';
import '@/components/ui/ContentDisplay.js';
import api from '@/services/api.js';

/**
 * Teacher Student Assignment Dialog Component
 * 
 * A dialog for viewing student assignment details
 */
class TeacherStudentAssignmentDialog extends HTMLElement {
    constructor() {
        super();
        this.submissionData = null;
        this.loading = false;
    }

    connectedCallback() {
        this.render();
    }

    async openStudentAssignment(assignmentId, studentId) {
        // Show loading dialog first
        this.loading = true;
        this.render();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const apiUrl = `/teachers/assignments/${assignmentId}/students/${studentId}/submission`;
            const response = await api.withToken(token).get(apiUrl);

            if (response.data && response.data.success) {
                this.submissionData = response.data.data;
                this.loading = false;
                this.render();

                // Open the dialog
                const dialog = this.querySelector('ui-dialog');
                if (dialog) {
                    dialog.open();
                }
            }
        } catch (error) {
            console.error('Error loading student assignment:', error);
            this.loading = false;
            this.render();
        }
    }

    close() {
        const dialog = this.querySelector('ui-dialog');
        if (dialog) {
            dialog.close();
        }
        this.submissionData = null;
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
            case 'graded': return 'success';
            case 'submitted': return 'info';
            case 'late': return 'warning';
            default: return 'secondary';
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

    render() {
        if (this.loading) {
            this.innerHTML = `
                <ui-dialog size="lg">
                    <div slot="title" class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <i class="fas fa-user-graduate text-white text-sm"></i>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900">Loading Student Assignment...</h2>
                    </div>
                    <div slot="content" class="flex items-center justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span class="ml-3 text-gray-600">Loading student assignment details...</span>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        if (!this.submissionData) {
            this.innerHTML = `
                <ui-dialog size="lg">
                    <div slot="title" class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <i class="fas fa-user-graduate text-white text-sm"></i>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900">Student Assignment Details</h2>
                    </div>
                    <div slot="content" class="text-center py-8">
                        <div class="text-gray-500">
                            <i class="fas fa-info-circle text-4xl mb-4"></i>
                            <p class="text-lg font-medium">No Data Available</p>
                            <p class="text-sm">Student assignment details will appear here when loaded.</p>
                        </div>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        const { assignment, submission } = this.submissionData;

        this.innerHTML = `
            <ui-dialog size="lg">
                <div slot="title" class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <i class="fas fa-user-graduate text-white text-sm"></i>
                    </div>
                    <h2 class="text-xl font-bold text-gray-900">
                        ${submission?.first_name ? `${submission.first_name} ${submission.last_name}` : 'Student'} Submission
                    </h2>
                </div>
                
                <div slot="content" class="space-y-4">
                    ${submission?.submission_id ? `
                        <!-- Student has submitted -->
                        <div class="bg-green-50 rounded-lg p-4">
                            <h3 class="text-lg font-semibold text-gray-900 mb-3">Submission Details</h3>
                            <div class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-sm font-medium text-gray-600">Submission Status</label>
                                        <div class="flex items-center space-x-2 mt-1">
                                            <ui-badge color="${this.getStatusColor(submission.submission_status)}" size="sm">
                                                ${submission.submission_status?.toUpperCase() || 'SUBMITTED'}
                                            </ui-badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="text-sm font-medium text-gray-600">Submitted At</label>
                                        <p class="text-gray-900">${this.formatDate(submission.submitted_at)}</p>
                                    </div>
                                    ${submission.grade ? `
                                        <div>
                                            <label class="text-sm font-medium text-gray-600">Grade</label>
                                            <p class="text-gray-900 font-semibold text-lg">${submission.grade}%</p>
                                        </div>
                                    ` : ''}
                                    ${submission.feedback ? `
                                        <div>
                                            <label class="text-sm font-medium text-gray-600">Feedback</label>
                                            <p class="text-gray-900">${submission.feedback}</p>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                ${submission.submission_text ? `
                                    <div>
                                        <label class="text-sm font-medium text-gray-600">Submission Text</label>
                                        <div class="mt-2 p-3 bg-white rounded border border-gray-200">
                                            <div class="prose prose-sm max-w-none text-gray-900">
                                                ${submission.submission_text}
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${submission.submission_file ? `
                                    <div>
                                        <label class="text-sm font-medium text-gray-600">Attached File</label>
                                        <div class="mt-2 p-3 bg-white rounded border border-gray-200">
                                            <div class="flex items-center space-x-2">
                                                <i class="fas fa-paperclip text-gray-500"></i>
                                                <span class="text-gray-900">${submission.submission_file}</span>
                                                <button class="text-blue-600 hover:text-blue-800 text-sm">
                                                    <i class="fas fa-download mr-1"></i>
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <!-- Student has not submitted -->
                        <div class="text-center py-8">
                            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-file-alt text-gray-400 text-2xl"></i>
                            </div>
                            <h4 class="text-lg font-medium text-gray-900 mb-2">No Submission Yet</h4>
                            <p class="text-gray-500">This student has not submitted this assignment yet.</p>
                        </div>
                    `}
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-student-assignment-dialog', TeacherStudentAssignmentDialog);
export default TeacherStudentAssignmentDialog; 