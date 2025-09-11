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
        this.currentAcademicYear = null;
        this.currentGradingPeriod = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && oldValue !== newValue) {
            this.render();
            if (this.hasAttribute('open')) {
                this.loadClasses();
                this.loadCurrentAcademicYear();
                this.loadCurrentGradingPeriod();
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
            if (e.target.tagName === 'UI-SEARCH-DROPDOWN') {
                this.selectedClassId = e.detail.value;
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
        this.currentAcademicYear = null;
        this.currentGradingPeriod = null;
    }

    // Load available classes for promotion (teacher route)
    async loadClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/teacher/classes/available-for-promotion', {
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

    // Load current academic year (teacher route)
    async loadCurrentAcademicYear() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/academic-years/current', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.currentAcademicYear = result.data;
                    this.render();
                }
            }
        } catch (error) {
            console.error('Error loading current academic year:', error);
        }
    }

    // Load current grading period (teacher route)
    async loadCurrentGradingPeriod() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/teachers/grading-periods', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Find the active grading period
                    const periods = result.data || [];
                    this.currentGradingPeriod = periods.find(period => period.is_active) || periods[0];
                    this.render();
                }
            }
        } catch (error) {
            console.error('Error loading current grading period:', error);
        }
    }

    // Set student data for promotion
    setStudentData(student) {
        this.studentData = student;
        this.render();
    }

    // Get class data from parent component
    getParentClassData() {
        // Try to find the parent teacher class page component
        const parentPage = this.closest('app-teacher-class-page');
        if (parentPage && parentPage.get) {
            return parentPage.get('classData');
        }
        
        // Fallback: try to get from global state or localStorage
        try {
            const stored = localStorage.getItem('teacherClassData');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
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

            // Store student data before making the API call
            const studentId = this.studentData.id;
            const newClassId = this.selectedClassId;

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

            // Make API call to promote student (teacher route)
            const response = await fetch('/api/teacher/students/promote', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: parseInt(studentId),
                    new_class_id: parseInt(newClassId),
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
                
                // Dispatch event to refresh the page BEFORE closing dialog
                this.dispatchEvent(new CustomEvent('student-promoted', {
                    detail: { 
                        studentId: studentId,
                        message: result.message || 'Student promoted successfully',
                        data: result.data
                    },
                    bubbles: true,
                    composed: true
                }));
                
                // Close dialog after dispatching event
                this.close();
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

        const { first_name, last_name, student_id } = this.studentData;
        const studentName = `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown Student';
        const studentId = student_id || 'N/A';
        
        // Get class information from the parent component (teacher's class data)
        const classData = this.getParentClassData();
        const currentClass = classData?.class_name || 'No Class Assigned';
        const currentClassSection = classData?.class_section || '';
        const currentClassDisplay = currentClassSection ? `${currentClass} (${currentClassSection})` : currentClass;
        
        const academicYearName = this.currentAcademicYear ? (this.currentAcademicYear.display_name || this.currentAcademicYear.year_code) : 'Loading...';
        const gradingPeriodName = this.currentGradingPeriod ? this.currentGradingPeriod.name : 'Loading...';
        
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
                            <span class="text-sm text-gray-900 font-semibold">${currentClassDisplay}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Academic Year:</span>
                            <span class="text-sm text-gray-900 font-semibold">${academicYearName}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Current Grading Period:</span>
                            <span class="text-sm text-gray-900 font-semibold">${gradingPeriodName}</span>
                        </div>
                    </div>

                    <!-- Class Selection -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Select New Class</label>
                        <ui-search-dropdown 
                            name="class_id" 
                            placeholder="Choose a class..." 
                            value="${this.selectedClassId}" 
                            data-field="class_id">
                            ${this.classes.map(cls => `
                                <ui-option value="${cls.id}">${cls.name}-${cls.section}</ui-option>
                            `).join('')}
                        </ui-search-dropdown>
                        <p class="text-sm text-gray-500 mt-1">Select the class to promote the student to</p>
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
