import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Assignment Delete Class Dialog Component
 * 
 * Dialog for deleting all assignments for a teacher and specific class
 */
class TeacherAssignmentDeleteClassDialog extends HTMLElement {
    constructor() {
        super();
        this.deleteClassData = null;
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
        this.addEventListener('confirm', this.deleteClassAssignments.bind(this));
    }

    setDeleteClassData(data) {
        this.deleteClassData = data;
        this.render();
    }

    async deleteClassAssignments() {
        if (this.loading || !this.deleteClassData) return;
        
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

            // Find the class ID from the assignments
            const classAssignment = this.deleteClassData.assignments[0];
            const classId = classAssignment.class_id;

            const response = await api.withToken(token).delete(`/teacher-assignments/teacher/${this.deleteClassData.teacherId}/class/${classId}`);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: `Successfully deleted ${this.deleteClassData.assignments.length} subject assignment(s) for ${this.deleteClassData.className} - ${this.deleteClassData.classSection}`,
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-class-assignments-deleted', {
                    detail: {
                        deletedAssignments: this.deleteClassData.assignments,
                        teacherId: this.deleteClassData.teacherId,
                        employeeId: this.deleteClassData.employeeId,
                        className: this.deleteClassData.className,
                        classSection: this.deleteClassData.classSection
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to delete class assignments',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error deleting class assignments:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete class assignments',
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
        const data = this.deleteClassData;
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Class Assignments">
                <div slot="content">
                    <div class="space-y-4">
                        <div class="text-center">
                            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Class Assignments</h3>
                            <p class="text-sm text-gray-500">
                                Are you sure you want to delete all subject assignments for 
                                <span class="font-semibold">${data?.className || 'N/A'} - ${data?.classSection || 'N/A'}</span>?
                            </p>
                            <p class="text-xs text-gray-400 mt-2">
                                This will remove ${data?.assignments?.length || 0} subject assignment(s) for this class.
                            </p>
                            ${data?.assignments && data.assignments.length > 0 ? `
                                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p class="text-xs font-medium text-gray-700 mb-2">Subjects that will be deleted:</p>
                                    <div class="space-y-1">
                                        ${data.assignments.map(assignment => `
                                            <div class="text-xs text-gray-600">
                                                • ${assignment.subject_name} (${assignment.subject_code})
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-assignment-delete-class-dialog', TeacherAssignmentDeleteClassDialog);
export default TeacherAssignmentDeleteClassDialog; 