import '@/components/ui/Dialog.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Assignment Edit Class Dialog Component
 * 
 * Dialog for editing subjects assigned to a teacher for a specific class
 */
class TeacherAssignmentEditClassDialog extends HTMLElement {
    constructor() {
        super();
        this.editClassData = null;
        this.subjects = [];
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
        this.loadSubjects();
        this.setupEventListeners();
    }

    async loadSubjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('No authentication token found for loading subjects');
                this.useFallbackSubjects();
                return;
            }

            const response = await api.withToken(token).get('/subjects');
            
            if (response.status === 200 && response.data.success) {
                this.subjects = response.data.data;
                this.render();
                
                // If we have edit data, set the selected subjects after loading
                if (this.editClassData) {
                    setTimeout(() => {
                        const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
                        if (subjectDropdown && this.editClassData?.assignments) {
                            // Extract subject IDs from current assignments
                            const currentSubjectIds = this.editClassData.assignments.map(assignment => assignment.subject_id);
                            
                            // Set the value as JSON string for multi-select
                            subjectDropdown.setAttribute('value', JSON.stringify(currentSubjectIds));
                            
                            // Set display value for selected subjects
                            const selectedSubjects = this.subjects.filter(subject => currentSubjectIds.includes(subject.id));
                            const displayValue = selectedSubjects.map(subject => `${subject.name} (${subject.code})`).join(', ');
                            subjectDropdown.setAttribute('display-value', displayValue);
                        }
                    }, 100);
                }
            } else {
                console.warn('Failed to load subjects:', response.data?.message || 'Unknown error');
                this.useFallbackSubjects();
            }
        } catch (error) {
            console.warn('Error loading subjects (using fallback):', error.message);
            this.useFallbackSubjects();
        }
    }

    useFallbackSubjects() {
        // Use subjects from current assignments as fallback
        if (this.editClassData?.assignments && this.editClassData.assignments.length > 0) {
            this.subjects = this.editClassData.assignments.map(assignment => ({
                id: assignment.subject_id,
                name: assignment.subject_name || `Subject ${assignment.subject_id}`,
                code: assignment.subject_code || `SUB${assignment.subject_id}`
            }));
            
            // Set selected subjects immediately since we have the data
            setTimeout(() => {
                const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
                if (subjectDropdown && this.editClassData?.assignments) {
                    const currentSubjectIds = this.editClassData.assignments.map(assignment => assignment.subject_id);
                    subjectDropdown.setAttribute('value', JSON.stringify(currentSubjectIds));
                    
                    const selectedSubjects = this.subjects.filter(subject => currentSubjectIds.includes(subject.id));
                    const displayValue = selectedSubjects.map(subject => `${subject.name} (${subject.code})`).join(', ');
                    subjectDropdown.setAttribute('display-value', displayValue);
                }
            }, 100);
        } else {
            this.subjects = [];
        }
        this.render();
    }

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('confirm', this.updateClassAssignments.bind(this));
    }

    setEditClassData(data) {
        this.editClassData = data;
        this.render();
        
        // Create subjects from current assignments as fallback
        if (this.subjects.length === 0 && data?.assignments) {
            this.subjects = data.assignments.map(assignment => ({
                id: assignment.subject_id,
                name: assignment.subject_name,
                code: assignment.subject_code
            }));
            this.render();
        }
        
        // Set the selected subjects after render and after subjects are loaded
        const setSelectedSubjects = () => {
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
            if (subjectDropdown && this.editClassData?.assignments && this.subjects.length > 0) {
                // Extract subject IDs from current assignments
                const currentSubjectIds = this.editClassData.assignments.map(assignment => assignment.subject_id);
                
                // Set the value as JSON string for multi-select
                subjectDropdown.setAttribute('value', JSON.stringify(currentSubjectIds));
                
                // Set display value for selected subjects
                const selectedSubjects = this.subjects.filter(subject => currentSubjectIds.includes(subject.id));
                const displayValue = selectedSubjects.map(subject => `${subject.name} (${subject.code})`).join(', ');
                subjectDropdown.setAttribute('display-value', displayValue);
            }
        };
        
        // Try to set immediately, then retry after a delay
        setSelectedSubjects();
        setTimeout(setSelectedSubjects, 100);
        setTimeout(setSelectedSubjects, 300);
    }

    async updateClassAssignments() {
        if (this.loading || !this.editClassData) return;
        
        try {
            this.setLoading(true);
            
            // Get form data
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
            const subjectIds = subjectDropdown ? subjectDropdown.value : [];

            // Validation
            if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select at least one subject',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

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
            const classAssignment = this.editClassData.assignments[0];
            const classId = classAssignment.class_id;

            const response = await api.withToken(token).put(`/teacher-assignments/teacher/${this.editClassData.teacherId}/class/${classId}`, {
                subject_ids: subjectIds
            });
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: `Successfully updated subjects for ${this.editClassData.className} - ${this.editClassData.classSection}`,
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-class-assignments-updated', {
                    detail: {
                        updatedAssignments: response.data.data.assignments,
                        teacherId: this.editClassData.teacherId,
                        employeeId: this.editClassData.employeeId,
                        className: this.editClassData.className,
                        classSection: this.editClassData.classSection
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to update class assignments',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error updating class assignments:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update class assignments',
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
        const data = this.editClassData;
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Edit Class Assignments">
                <div slot="content">
                    <div class="space-y-4">
                        <!-- Teacher Information (Read-only) -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                            <div class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">
                                ${data?.teacherName || 'N/A'} (${data?.teacherEmployeeId || 'N/A'})
                            </div>
                        </div>

                        <!-- Class Information (Read-only) -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <div class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">
                                ${data?.className || 'N/A'} - ${data?.classSection || 'N/A'}
                            </div>
                        </div>

                        <!-- Subject Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Subjects *</label>
                            ${this.subjects.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="subject_ids" 
                                    placeholder="Search and select multiple subjects..."
                                    multiple
                                    class="w-full">
                                    ${this.subjects.map(subject => `
                                        <ui-option value="${subject.id}">${subject.name} (${subject.code})</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>

                        <!-- Current Assignments Info -->
                        ${data?.assignments && data.assignments.length > 0 ? `
                            <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p class="text-xs font-medium text-blue-700 mb-2">Current subjects for this class:</p>
                                <div class="space-y-1">
                                    ${data.assignments.map(assignment => `
                                        <div class="text-xs text-blue-600">
                                            • ${assignment.subject_name} (${assignment.subject_code})
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-assignment-edit-class-dialog', TeacherAssignmentEditClassDialog);
export default TeacherAssignmentEditClassDialog; 