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
        console.log('Opening student assignment dialog for assignment:', assignmentId, 'student:', studentId);

        // Show loading dialog first
        this.loading = true;
        this.render();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            console.log('Loading student assignment data...');
            const response = await api.withToken(token).get(`/teachers/assignments/${assignmentId}/students/${studentId}/submission`);

            if (response.data && response.data.success) {
                this.submissionData = response.data.data;
                console.log('Student assignment loaded:', this.submissionData);
                console.log('Assignment data:', this.submissionData.assignment);
                console.log('Submission data:', this.submissionData.submission);
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
        
        console.log('Rendering dialog with assignment:', assignment);
        console.log('Rendering dialog with submission:', submission);

        this.innerHTML = `
            <ui-dialog size="lg">
                <div slot="title" class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <i class="fas fa-file-alt text-white text-sm"></i>
                    </div>
                    <h2 class="text-xl font-bold text-gray-900">Assignment Details</h2>
                </div>
                
                <div slot="content" class="space-y-4">
                    <!-- Assignment Information -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium text-gray-600">Title</label>
                                <p class="text-gray-900 font-semibold">${assignment?.title || 'N/A'}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-600">Type</label>
                                <div class="flex items-center space-x-2">
                                    <ui-badge color="${this.getTypeColor(assignment?.assignment_type)}" size="sm">
                                        ${assignment?.assignment_type?.toUpperCase() || 'N/A'}
                                    </ui-badge>
                                </div>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-600">Due Date</label>
                                <p class="text-gray-900">${this.formatDate(assignment?.due_date)}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-600">Total Points</label>
                                <p class="text-gray-900">${assignment?.total_points || 'N/A'}</p>
                            </div>
                        </div>
                        ${assignment?.description ? `
                            <div class="mt-4">
                                <label class="text-sm font-medium text-gray-600">Description</label>
                                <div class="mt-2 p-3 bg-white rounded border border-gray-200">
                                    <div class="prose prose-sm max-w-none text-gray-900">
                                        ${assignment.description}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-student-assignment-dialog', TeacherStudentAssignmentDialog);
export default TeacherStudentAssignmentDialog; 