import api from '@/services/api.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/SearchDropdown.js';

/**
 * Promote Student Dialog Component
 * Shows student information and allows class selection for promotion
 */
class PromoteStudentDialog extends HTMLElement {
    constructor() {
        super();
        this.studentData = null;
        this.classes = [];
        this.selectedClassId = '';
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
            if (e.target.tagName === 'UI-SEARCH-DROPDOWN' && e.target.name === 'class_id') {
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
            // Get auth token and use authenticated API
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to access this feature',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }
            
            // Use the authenticated API service
            const response = await api.withToken(token).get('/classes');
            
            if (response.data && response.data.success) {
                this.classes = response.data.data || [];
                this.render();
            } else {
                Toast.show({
                    title: 'Error',
                    message: 'Failed to load classes: ' + (response.data?.message || 'Unknown error'),
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: 'Failed to load classes: ' + error.message,
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Set student data for promotion
    setStudentData(student) {
        this.studentData = student;
        this.render();
    }

    // Validate form before enabling promote button
    validateForm() {
        // No need to validate button since we're using default dialog buttons
        // The dialog will handle the confirm button state automatically
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

            // Get the selected class name for display
            const selectedClass = this.classes.find(cls => cls.id == this.selectedClassId);
            const className = selectedClass ? `${selectedClass.name}-${selectedClass.section}` : 'Unknown Class';

            // Get auth token for API call
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to access this feature',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Call the promotion API
            const response = await api.withToken(token).post('/students/promote', {
                student_id: this.studentData.id,
                new_class_id: this.selectedClassId,
                notes: `Student promoted from ${this.studentData.class_name || 'No Class'} to ${className}`
            });

            if (response.data && response.data.success) {
                // Show success message
                Toast.show({
                    title: 'Success',
                    message: `Student successfully promoted to ${className}`,
                    variant: 'success',
                    duration: 5000
                });

                // Close dialog
                this.close();
                
                // Dispatch event to refresh the page
                this.dispatchEvent(new CustomEvent('student-promoted', {
                    detail: { 
                        studentId: this.studentData.id,
                        message: `Student promoted to ${className}`,
                        data: response.data.data
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data?.message || 'Failed to promote student');
            }
            
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: 'Failed to promote student: ' + error.message,
                variant: 'error',
                duration: 3000
            });
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
                            <span class="text-blue-700 text-sm">You are about to promote this student to a new class level.</span>
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

                    <!-- Class Selection -->
                    <div class="bg-white border border-gray-300 rounded-lg p-4 mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Select New Class for Promotion
                        </label>
                        <ui-search-dropdown 
                            name="class_id"
                            placeholder="Choose a class..."
                            value="${this.selectedClassId}">
                            ${this.classes.map(cls => `
                                <ui-option value="${cls.id}">${cls.name}-${cls.section}</ui-option>
                            `).join('')}
                        </ui-search-dropdown>
                        <p class="text-xs text-gray-500 mt-1">Select the class you want to promote this student to</p>
                    </div>

                    <!-- Warning Section -->
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div class="flex items-start">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
                            <div class="text-yellow-800 text-sm">
                                <p class="font-medium mb-1">Important Notes:</p>
                                <ul class="space-y-1">
                                    <li>• This action will move the student to the selected class</li>
                                    <li>• All current grades and records will be archived</li>
                                    <li>• The student will be enrolled in the new class automatically</li>
                                    <li>• This action cannot be undone</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </ui-dialog>
        `;

        // Validate form after rendering
        this.validateForm();
        
        // Force the dropdown to re-initialize after render
        setTimeout(() => {
            const dropdown = this.querySelector('ui-search-dropdown');
            if (dropdown) {
                // Try to trigger a slotchange event
                const slot = dropdown.shadowRoot?.querySelector('slot');
                if (slot) {
                    slot.dispatchEvent(new Event('slotchange'));
                }
            }
        }, 100);
    }
}

customElements.define('promote-student-dialog', PromoteStudentDialog);
export default PromoteStudentDialog;
