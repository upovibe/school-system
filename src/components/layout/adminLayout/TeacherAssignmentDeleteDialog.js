import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Assignment Delete Dialog Component
 * 
 * Dialog for confirming teacher assignment deletion
 */
class TeacherAssignmentDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.teacherAssignmentData = null;
        this.loading = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('confirm', this.deleteTeacherAssignment.bind(this));
    }

    setTeacherAssignmentData(teacherAssignment) {
        this.teacherAssignmentData = teacherAssignment;
        this.render();
    }

    async deleteTeacherAssignment() {
        if (this.loading || !this.teacherAssignmentData) return;
        
        try {
            this.setLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to continue',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const response = await api.withToken(token).delete(`/teacher-assignments/${this.teacherAssignmentData.id}`);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Teacher assignment deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-assignment-deleted', {
                    detail: {
                        teacherAssignmentId: this.teacherAssignmentData.id
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to delete teacher assignment',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error deleting teacher assignment:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete teacher assignment',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.loading = loading;
        // The ui-dialog component handles the loading state automatically
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    render() {
        const teacherAssignment = this.teacherAssignmentData;
        
        if (!teacherAssignment) {
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="Delete Teacher Assignment"
                    variant="danger">
                    <div slot="content">
                        <div class="text-center py-8">
                            <p class="text-gray-500">No data to delete</p>
                        </div>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Teacher Assignment"
                variant="danger">
                <div slot="content">
                    <div class="text-center">
                        <!-- Danger Icon -->
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                        </div>
                        
                        <!-- Warning Message -->
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Are you sure?</h3>
                        <p class="text-sm text-gray-500 mb-6">
                            This action cannot be undone. This will permanently delete the teacher assignment.
                        </p>
                        
                        <!-- Assignment Details -->
                        <div class="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 class="text-sm font-medium text-gray-900 mb-3">Assignment Details</h4>
                            <div class="space-y-3 text-sm">
                                <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                        <i class="fas fa-user-tie text-purple-600 text-xs"></i>
                                    </div>
                                    <span class="text-gray-500">Teacher:</span>
                                    <span class="font-medium text-gray-900">
                                        ${teacherAssignment.teacher_first_name || 'N/A'} ${teacherAssignment.teacher_last_name || 'N/A'} (${teacherAssignment.employee_id || 'N/A'})
                                    </span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                        <i class="fas fa-chalkboard text-blue-600 text-xs"></i>
                                    </div>
                                    <span class="text-gray-500">Class:</span>
                                    <span class="font-medium text-gray-900">
                                        ${teacherAssignment.class_name || 'N/A'} - ${teacherAssignment.class_section || 'N/A'}
                                    </span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <i class="fas fa-book text-green-600 text-xs"></i>
                                    </div>
                                    <span class="text-gray-500">Subject:</span>
                                    <span class="font-medium text-gray-900">
                                        ${teacherAssignment.subject_name || 'N/A'} (${teacherAssignment.subject_code || 'N/A'})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-assignment-delete-dialog', TeacherAssignmentDeleteDialog);
export default TeacherAssignmentDeleteDialog; 