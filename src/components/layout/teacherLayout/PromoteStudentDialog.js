import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';

/**
 * Promote Student Dialog Component
 * Shows student information and confirmation for promotion
 */
class PromoteStudentDialog extends HTMLElement {
    constructor() {
        super();
        this.studentData = null;
    }

    connectedCallback() {
        this.render();
        this.addEventListeners();
    }

    setStudentData(student) {
        this.studentData = student;
        this.render();
    }

    addEventListeners() {
        this.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.getAttribute('data-action');
            if (action === 'promote') {
                this.handlePromote();
            } else if (action === 'cancel') {
                this.close();
            }
        });
    }

    handlePromote() {
        // TODO: Implement promotion logic
        console.log('Promoting student:', this.studentData);
        // Close dialog after promotion
        this.close();
    }

    close() {
        this.remove();
    }

    render() {
        if (!this.studentData) return '';

        const { first_name, last_name, student_id } = this.studentData;
        const studentName = `${first_name} ${last_name}`;
        const currentClass = this.studentData.class_name || 'Unknown Class';

        this.innerHTML = `
            <ui-dialog open>
                <div slot="header" class="flex items-center">
                    <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                    <span class="font-semibold">Promote Student</span>
                </div>
                
                <div slot="content" class="space-y-4">
                    <!-- Info Section -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                            <span class="text-blue-700 text-sm">You are about to promote this student to the next class level.</span>
                        </div>
                    </div>

                    <!-- Student Details -->
                    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Student Name:</span>
                            <span class="text-sm text-gray-900 font-semibold">${studentName}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Student ID:</span>
                            <span class="text-sm text-gray-900">${student_id}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Current Class:</span>
                            <span class="text-sm text-gray-900 font-semibold">${currentClass}</span>
                        </div>
                    </div>

                    <!-- Warning Section -->
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="flex items-start">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
                            <div class="text-yellow-800 text-sm">
                                <p class="font-medium mb-1">Important Notes:</p>
                                <ul class="space-y-1">
                                    <li>• This action will move the student to the next class level</li>
                                    <li>• All current grades and records will be archived</li>
                                    <li>• The student will be enrolled in the next class automatically</li>
                                    <li>• This action cannot be undone</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button variant="secondary" data-action="cancel">
                        Cancel
                    </ui-button>
                    <ui-button variant="primary" data-action="promote">
                        <i class="fas fa-arrow-up mr-2"></i>
                        Promote Student
                    </ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('promote-student-dialog', PromoteStudentDialog);
export default PromoteStudentDialog;
