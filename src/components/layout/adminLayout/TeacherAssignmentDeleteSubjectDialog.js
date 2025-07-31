import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Assignment Delete Subject Dialog Component
 * 
 * Dialog for deleting specific assignment for a teacher, class, and subject
 */
class TeacherAssignmentDeleteSubjectDialog extends HTMLElement {
    constructor() {
        super();
        this.deleteSubjectData = null;
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
        this.addEventListener('confirm', this.deleteSubjectAssignment.bind(this));
    }

    setDeleteSubjectData(data) {
        this.deleteSubjectData = data;
        this.render();
    }

    async deleteSubjectAssignment() {
        if (this.loading || !this.deleteSubjectData) return;
        
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

            // Find the class and subject IDs from the assignment
            const assignment = this.deleteSubjectData.assignment;
            const classId = assignment.class_id;
            const subjectId = assignment.subject_id;

            const response = await api.withToken(token).delete(`/teacher-assignments/teacher/${this.deleteSubjectData.teacherId}/class/${classId}/subject/${subjectId}`);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: `Successfully deleted assignment for ${this.deleteSubjectData.subjectName} (${this.deleteSubjectData.subjectCode}) in ${this.deleteSubjectData.className} - ${this.deleteSubjectData.classSection}`,
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-subject-assignment-deleted', {
                    detail: {
                        deletedAssignment: this.deleteSubjectData.assignment,
                        teacherId: this.deleteSubjectData.teacherId,
                        employeeId: this.deleteSubjectData.employeeId,
                        className: this.deleteSubjectData.className,
                        classSection: this.deleteSubjectData.classSection,
                        subjectName: this.deleteSubjectData.subjectName,
                        subjectCode: this.deleteSubjectData.subjectCode
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to delete subject assignment',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error deleting subject assignment:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete subject assignment',
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
        const data = this.deleteSubjectData;
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Subject Assignment">
                <div slot="content">
                    <div class="space-y-4">
                        <div class="text-center">
                            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Subject Assignment</h3>
                            <p class="text-sm text-gray-500">
                                Are you sure you want to delete the assignment for 
                                <span class="font-semibold">${data?.subjectName || 'N/A'} (${data?.subjectCode || 'N/A'})</span>
                                in <span class="font-semibold">${data?.className || 'N/A'} - ${data?.classSection || 'N/A'}</span>?
                            </p>
                            <p class="text-xs text-gray-400 mt-2">
                                This will remove only this specific subject assignment.
                            </p>
                            ${data?.assignment ? `
                                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p class="text-xs font-medium text-gray-700 mb-2">Assignment details:</p>
                                    <div class="space-y-1 text-xs text-gray-600">
                                        <div>• Teacher: ${data.assignment.teacher_first_name} ${data.assignment.teacher_last_name} (${data.assignment.employee_id})</div>
                                        <div>• Class: ${data.assignment.class_name} - ${data.assignment.class_section}</div>
                                        <div>• Subject: ${data.assignment.subject_name} (${data.assignment.subject_code})</div>
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

customElements.define('teacher-assignment-delete-subject-dialog', TeacherAssignmentDeleteSubjectDialog);
export default TeacherAssignmentDeleteSubjectDialog; 