import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/SearchDropdown.js';

/**
 * Promote Student Dialog Component (Teacher Version)
 * Shows student information and allows class selection for promotion
 */
class PromoteStudentDialog extends HTMLElement {
    constructor() {
        super();
        this.studentData = null;
        this.classes = [];
        this.selectedClassId = '';
        this.loading = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && oldValue !== newValue) {
            this.render();
            if (this.hasAttribute('open')) {
                this.loadClasses();
            }
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

        // Listen for class selection change
        this.addEventListener('change', (e) => {
            if (e.target.tagName === 'UI-SEARCH-DROPDOWN' && e.target.dataset.field === 'class_id') {
                this.selectedClassId = e.target.value;
                this.validateForm();
            }
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.selectedClassId = '';
        this.studentData = null;
    }

    // Load available classes for promotion
    async loadClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/classes', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.classes = result.data || [];
                this.render();
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    }

    // Set student data for promotion
    setStudentData(student) {
        this.studentData = student;
        this.render();
    }

    // Validate form before enabling promote button
    validateForm() {
        const promoteBtn = this.querySelector('#promote-btn');
        if (promoteBtn) {
            const isValid = !!this.selectedClassId && this.selectedClassId !== '';
            if (isValid) {
                promoteBtn.removeAttribute('disabled');
            } else {
                promoteBtn.setAttribute('disabled', '');
            }
        }
    }

    // Handle promotion
    async handlePromote() {
        try {
            if (!this.studentData || !this.selectedClassId) {
                Toast.show({
                    title: 'Error',
                    message: 'Please select a class for promotion',
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
                    message: 'Please log in to promote students',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            this.loading = true;
            this.render();

            // Make API call to promote student
            const response = await fetch('/api/students/promote', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.studentData.id,
                    new_class_id: this.selectedClassId,
                    notes: 'Student promoted via teacher interface'
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Toast.show({
                    title: 'Success',
                    message: result.message || 'Student promoted successfully',
                    variant: 'success',
                    duration: 3000
                });
                
                // Close dialog after successful promotion
                this.close();
                
                // Dispatch event to refresh the page
                this.dispatchEvent(new CustomEvent('student-promoted', {
                    detail: { 
                        studentId: this.studentData.id,
                        message: result.message || 'Student promoted successfully',
                        data: result.data
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(result.message || 'Failed to promote student');
            }
            
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: 'Failed to promote student: ' + error.message,
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.loading = false;
            this.render();
        }
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
