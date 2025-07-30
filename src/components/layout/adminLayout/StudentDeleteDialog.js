import App from '@/core/App.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Student Delete Dialog Component
 * 
 * Confirmation dialog for deleting students
 */
class StudentDeleteDialog extends App {
    constructor() {
        super();
        this.student = null;
        this.deleting = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('close', this.handleClose.bind(this));
    }

    setStudentData(student) {
        this.student = student;
        this.set('student', student);
    }

    async handleDelete() {
        if (!this.student) return;

        try {
            this.set('deleting', true);

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

            const response = await api.withToken(token).delete(`/students/${this.student.id}`);
            
            if (response.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Student deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event to notify parent component
                this.dispatchEvent(new CustomEvent('student-deleted', {
                    detail: {
                        studentId: this.student.id,
                        studentName: `${this.student.first_name} ${this.student.last_name}`
                    }
                }));

                this.handleClose();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.message || 'Failed to delete student',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to delete student',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('deleting', false);
        }
    }

    handleClose() {
        this.set('student', null);
        this.student = null;
        this.set('deleting', false);
        
        // Close the dialog
        const dialog = this.querySelector('ui-dialog');
        if (dialog) {
            dialog.close();
        }
    }

    render() {
        const student = this.get('student');
        const deleting = this.get('deleting');

        if (!student) {
            return `
                <ui-dialog>
                    <div class="p-6">
                        <h2 class="text-lg font-medium text-gray-900 mb-4">Delete Student</h2>
                        <p class="text-sm text-gray-600">No student selected for deletion.</p>
                    </div>
                </ui-dialog>
            `;
        }

        return `
            <ui-dialog>
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <div class="flex-shrink-0">
                            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <h2 class="text-lg font-medium text-gray-900">Delete Student</h2>
                            <p class="text-sm text-gray-600">This action cannot be undone.</p>
                        </div>
                    </div>

                    <div class="mb-6">
                        <p class="text-sm text-gray-600 mb-4">
                            Are you sure you want to delete the student 
                            <span class="font-medium text-gray-900">${student.first_name} ${student.last_name}</span> 
                            (ID: ${student.student_id})?
                        </p>
                        
                        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-yellow-800">Warning</h3>
                                    <div class="mt-2 text-sm text-yellow-700">
                                        <p>This will permanently delete the student record and all associated data including:</p>
                                        <ul class="list-disc list-inside mt-1 space-y-1">
                                            <li>Student profile and personal information</li>
                                            <li>Associated user account</li>
                                            <li>All student records and history</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3">
                        <ui-button 
                            color="secondary" 
                            onclick="this.closest('student-delete-dialog').handleClose()"
                            disabled="${deleting}">
                            Cancel
                        </ui-button>
                        <ui-button 
                            color="danger"
                            loading="${deleting}"
                            disabled="${deleting}"
                            onclick="this.closest('student-delete-dialog').handleDelete()">
                            <i class="fas fa-trash mr-2"></i>
                            Delete Student
                        </ui-button>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('student-delete-dialog', StudentDeleteDialog);
export default StudentDeleteDialog; 