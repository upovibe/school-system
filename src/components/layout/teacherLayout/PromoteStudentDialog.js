import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';

/**
 * Promote Student Dialog Component (Teacher Version)
 * Shows student information and confirmation for promotion
 */
class PromoteStudentDialog extends HTMLElement {
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
        // Listen for confirm button click (Promote Student)
        this.addEventListener('confirm', () => {
            this.handlePromote();
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

    // Set student data for promotion
    setStudentData(student) {
        this.studentData = student;
        this.render();
    }

    // Handle promotion
    handlePromote() {
        // TODO: Implement promotion logic
        Toast.show({
            title: 'Info',
            message: 'Promotion feature coming soon!',
            variant: 'info',
            duration: 3000
        });
        
        // Close dialog after promotion
        this.close();
    }

    render() {
        if (!this.studentData) {
            this.innerHTML = '';
            return;
        }

        const { first_name, last_name, student_id, class_name } = this.studentData;
        const studentName = `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown Student';
        const currentClass = class_name || 'No Class Assigned';
        const studentId = student_id || 'N/A';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="success">
                <div slot="title">
                    <div class="flex items-center">
                        <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                        <span>Promote Student</span>
                    </div>
                </div>
                <div slot="content">
                    <!-- Info Section -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div class="flex items-center">
                            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                            <span class="text-blue-700 text-sm">You are about to promote this student to the next class level.</span>
                        </div>
                    </div>

                    <!-- Student Details -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Student Name:</span>
                            <span class="text-sm text-gray-900 font-semibold">${studentName}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Student ID:</span>
                            <span class="text-sm text-gray-900">${studentId}</span>
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
            </ui-dialog>
        `;
    }
}

customElements.define('promote-student-dialog', PromoteStudentDialog);
export default PromoteStudentDialog;
