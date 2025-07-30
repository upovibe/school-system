import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Student Delete Dialog Component
 * 
 * A dialog component for confirming student deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - student-deleted: Fired when a student is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class StudentDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.studentData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && oldValue !== newValue) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Student)
        this.addEventListener('confirm', () => {
            this.deleteStudent();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set student data for deletion
    setStudentData(student) {
        this.studentData = student;
        this.render();
    }

    // Delete the student
    async deleteStudent() {
        try {
            if (!this.studentData) {
                Toast.show({
                    title: 'Error',
                    message: 'No student data available for deletion',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete students',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete student
            const response = await api.withToken(token).delete(`/students/${this.studentData.id}`);
            
            // Check if student was deleted successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Student deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('student-deleted', {
                    detail: { studentId: this.studentData.id },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to delete student');
            }

        } catch (error) {
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete student',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const studentName = this.studentData ? `${this.studentData.first_name} ${this.studentData.last_name}` : 'this student';
        const studentId = this.studentData ? this.studentData.student_id : '';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="danger">
                <div slot="title">Delete Student</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete <strong>${studentName}</strong>${studentId ? ` (${studentId})` : ''}?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. If this student has any enrollments or records, the deletion will be prevented.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('student-delete-dialog', StudentDeleteDialog);
export default StudentDeleteDialog; 