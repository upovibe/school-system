import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Delete Dialog Component
 * 
 * A dialog component for confirming teacher deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - teacher-deleted: Fired when a teacher is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class TeacherDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.teacherData = null;
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
        // Listen for confirm button click (Delete Teacher)
        this.addEventListener('confirm', () => {
            this.deleteTeacher();
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

    // Set teacher data for deletion
    setTeacherData(teacher) {
        this.teacherData = teacher;
        this.render();
    }

    // Delete the teacher
    async deleteTeacher() {
        try {
            if (!this.teacherData) {
                Toast.show({
                    title: 'Error',
                    message: 'No teacher data available for deletion',
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
                    message: 'Please log in to delete teachers',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete teacher
            const response = await api.withToken(token).delete(`/teachers/${this.teacherData.id}`);
            
            // Check if teacher was deleted successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Teacher deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-deleted', {
                    detail: { teacherId: this.teacherData.id },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to delete teacher');
            }

        } catch (error) {
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete teacher',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const teacherName = this.teacherData ? this.teacherData.name : 'this teacher';
        const employeeId = this.teacherData ? this.teacherData.employee_id : '';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="danger">
                <div slot="title">Delete Teacher</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete <strong>${teacherName}</strong>${employeeId ? ` (${employeeId})` : ''}?
                    </p>
                    <p class="text-sm text-gray-500 mb-3">
                        This action cannot be undone. If this teacher has any assignments, the deletion will be prevented.
                    </p>
                    <p class="text-sm text-red-600 font-medium">
                        ⚠️ This will also delete the associated user account and all login access.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-delete-dialog', TeacherDeleteDialog);
export default TeacherDeleteDialog; 