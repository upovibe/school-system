import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Button.js';
import '@/components/ui/ContentDisplay.js';
import api from '@/services/api.js';

/**
 * Teacher Assignment View Dialog Component
 * 
 * A simple dialog for viewing assignment details
 */
class TeacherAssignmentViewDialog extends HTMLElement {
    constructor() {
        super();
        this.assignmentData = null;
        this.loading = false;
    }

    connectedCallback() {
        this.render();
    }

    async openAssignment(assignmentId) {


        // Show loading dialog first
        this.loading = true;
        this.render();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
    
                return;
            }


            const response = await api.withToken(token).get(`/teachers/assignments/${assignmentId}`);

            if (response.data && response.data.success) {
                this.assignmentData = response.data.data;

                this.loading = false;
                this.render();

                // Open the dialog
                const dialog = this.querySelector('ui-dialog');
                if (dialog) {
                    dialog.open();
                }
            }
        } catch (error) {

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
            day: 'numeric'
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
                                                <p class="text-sm font-semibold text-gray-800">${assignment.class_name}-${assignment.class_section}</p>
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
                                                <p class="text-sm font-semibold text-gray-800">${assignment.subject_name}</p>
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
                                        <i class="fas fa-tag text-purple-600 text-sm"></i>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500 font-medium">Type</p>
                                        <p class="text-sm font-semibold text-gray-800">${assignment.assignment_type?.toUpperCase() || 'GENERAL'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-gray-300 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-check-circle text-green-600 text-sm"></i>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500 font-medium">Status</p>
                                        <p class="text-sm font-semibold text-gray-800">${assignment.status?.toUpperCase() || 'UNKNOWN'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-gray-300 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-plus text-blue-600 text-sm"></i>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500 font-medium">Created</p>
                                        <p class="text-sm font-semibold text-gray-800">${this.formatDate(assignment.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-gray-300 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-edit text-indigo-600 text-sm"></i>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500 font-medium">Last Updated</p>
                                        <p class="text-sm font-semibold text-gray-800">${this.formatDate(assignment.updated_at)}</p>
                                    </div>
                                </div>
                            </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Assignment Description -->
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-file-text text-green-500"></i>
                            <h3 class="text-lg font-semibold text-gray-900">Description</h3>
                        </div>
                        <div class="bg-gray-50 rounded-lg">
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

                    <!-- Assignment Information -->
                    <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-info-circle text-blue-500"></i>
                            <h3 class="text-lg font-semibold text-gray-900">Assignment Information</h3>
                        </div>

                </div>
                

            </ui-dialog>
        `;
    }
}

customElements.define('teacher-assignment-view-dialog', TeacherAssignmentViewDialog);
export default TeacherAssignmentViewDialog;