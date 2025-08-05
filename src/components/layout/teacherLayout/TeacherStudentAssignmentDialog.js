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
                <div slot="title" class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <i class="fas fa-user-graduate text-white text-sm"></i>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900">
                            ${submission?.first_name ? `${submission.first_name} ${submission.last_name}` : 'Student'} Submission
                        </h2>
                    </div>
                    ${submission?.grade ? `
                        <div class="flex items-center space-x-2">
                            <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                                <span class="text-white font-bold text-sm">${submission.grade}%</span>
                            </div>
                            <div class="text-right">
                                <div class="text-xs text-gray-500 uppercase tracking-wide">Grade</div>
                                <div class="text-sm font-medium text-gray-900">${submission.submission_status?.toUpperCase() || 'GRADED'}</div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div slot="content" class="space-y-6">
                    ${submission?.submission_id ? `
                        <!-- Student has submitted -->
                        <div class="">
                            <!-- Submission Content Section -->
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Submission Content</h3>
                                
                                ${submission.submission_text ? `
                                    <div class="mb-6">
                                        <label class="text-sm font-medium text-gray-600 mb-2 block">Submission Text</label>
                                        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div class="prose prose-sm max-w-none text-gray-900 leading-relaxed">
                                                ${submission.submission_text}
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${submission.submission_file ? `
                                    <div class="mb-6">
                                        <label class="text-sm font-medium text-gray-600 mb-2 block">Attached File</label>
                                        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center space-x-3">
                                                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <i class="fas fa-file-alt text-blue-600"></i>
                                                    </div>
                                                    <div>
                                                        <div class="text-sm font-medium text-gray-900">${submission.submission_file}</div>
                                                        <div class="text-xs text-gray-500">Document</div>
                                                    </div>
                                                </div>
                                                <button class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200">
                                                    <i class="fas fa-download mr-1"></i>
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            
                            <!-- Submission Details Section -->
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Submission Details</h3>
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
                                    ${submission.feedback ? `
                                        <div class="md:col-span-2">
                                            <label class="text-sm font-medium text-gray-600">Teacher Feedback</label>
                                            <div class="mt-2 p-3 bg-white rounded border border-gray-200">
                                                <p class="text-gray-900 text-sm leading-relaxed">${submission.feedback}</p>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                        </div>
                    ` : `
                        <!-- Student has not submitted -->
                        <div class="text-center py-12">
                            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i class="fas fa-file-alt text-gray-400 text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-medium text-gray-900 mb-3">No Submission Yet</h4>
                            <p class="text-gray-500 max-w-md mx-auto">This student has not submitted this assignment yet. The submission will appear here once they complete the assignment.</p>
                        </div>
                    `}
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-student-assignment-dialog', TeacherStudentAssignmentDialog);
export default TeacherStudentAssignmentDialog; 