import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Assignment Add Dialog Component
 * 
 * Dialog for adding new teacher assignments
 */
class TeacherAssignmentAddDialog extends HTMLElement {
    constructor() {
        super();
        this.teachers = [];
        this.classes = [];
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
        this.loadTeachers();
        this.loadClasses();
        this.loadSubjects();
        this.setupEventListeners();
    }

    async loadTeachers() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/teachers');
            
            if (response.status === 200 && response.data.success) {
                this.teachers = response.data.data; // Teachers array is in response.data.data
                // Re-render to update the dropdown with teachers
                this.render();
            }
        } catch (error) {
            // Silent error handling
        }
    }

    async loadClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/classes');
            
            if (response.status === 200 && response.data.success) {
                this.classes = response.data.data; // Classes array is in response.data.data
                // Re-render to update the dropdown with classes
                this.render();
            }
        } catch (error) {
            // Silent error handling
        }
    }

    async loadSubjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/subjects');
            
            if (response.status === 200 && response.data.success) {
                this.subjects = response.data.data; // Subjects array is in response.data.data
                // Re-render to update the dropdown with subjects
                this.render();
            }
        } catch (error) {
            // Silent error handling
        }
    }

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('confirm', this.saveTeacherAssignment.bind(this));
    }

    resetForm() {
        const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
        const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');

        if (teacherDropdown) teacherDropdown.value = '';
        if (classDropdown) classDropdown.value = [];
        if (subjectDropdown) subjectDropdown.value = [];
    }

    async saveTeacherAssignment() {
        if (this.loading) return;
        
        try {
            this.setLoading(true);
            
            // Get form data using the data-field attributes for reliable selection
            const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');

            const teacherId = teacherDropdown ? teacherDropdown.value : '';
            const classIds = classDropdown ? classDropdown.value : [];
            const subjectIds = subjectDropdown ? subjectDropdown.value : [];

            // Debug logging
            console.log('Form Data:', {
                teacherId,
                classIds,
                subjectIds
            });

            // Validation
            if (!teacherId) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a teacher',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select at least one class',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

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

            // Create multiple teacher assignments
            console.log('Creating assignments for class IDs:', classIds, 'and subject IDs:', subjectIds);
            
            // Filter out any invalid class and subject IDs
            const validClassIds = classIds.filter(id => id && id !== '' && !isNaN(id));
            const validSubjectIds = subjectIds.filter(id => id && id !== '' && !isNaN(id));
            
            console.log('Valid class IDs:', validClassIds);
            console.log('Valid subject IDs:', validSubjectIds);
            
            if (validClassIds.length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'No valid classes selected',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }
            
            if (validSubjectIds.length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'No valid subjects selected',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }
            
            // Create all combinations of class and subject assignments
            const promises = [];
            validClassIds.forEach(classId => {
                validSubjectIds.forEach(subjectId => {
                    const teacherAssignmentData = {
                        teacher_id: parseInt(teacherId),
                        class_id: parseInt(classId),
                        subject_id: parseInt(subjectId)
                    };
                    console.log('Creating assignment:', teacherAssignmentData);
                    promises.push(api.withToken(token).post('/teacher-assignments', teacherAssignmentData));
                });
            });

            const responses = await Promise.all(promises);
            console.log('API Responses:', responses);
            
            // Check if all responses were successful
            const allSuccessful = responses.every(response => response.data.success);
            
            if (allSuccessful) {
                Toast.show({
                    title: 'Success',
                    message: `${responses.length} teacher assignment(s) created successfully`,
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                const createdAssignments = responses.map(response => response.data.data);
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-assignment-saved', {
                    detail: {
                        teacherAssignments: createdAssignments
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: 'Some teacher assignments failed to create',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error creating teacher assignments:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create teacher assignments',
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
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Add Teacher Assignment">
                <div slot="content">
                    <div class="flex flex-col space-y-4">
                        <!-- Teacher Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                            ${this.teachers.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="teacher_id" 
                                    placeholder="Search teachers..."
                                    class="w-full">
                                    ${this.teachers.map(teacher => `
                                        <ui-option value="${teacher.id}">${teacher.first_name} ${teacher.last_name} (${teacher.employee_id})</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>

                        <!-- Class Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Classes *</label>
                            ${this.classes.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="class_ids" 
                                    placeholder="Search and select multiple classes..."
                                    multiple
                                    class="w-full">
                                    ${this.classes.map(cls => `
                                        <ui-option value="${cls.id}">${cls.name}-${cls.section}</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
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

                        
                        </div>

                        <!-- How it works -->
                        <div class="p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                            <div class="flex items-start space-x-2">
                                <i class="fas fa-info-circle mt-0.5"></i>
                                <div>
                                    <p class="font-medium">How this works</p>
                                    <ul class="list-disc pl-5 mt-1 space-y-1">
                                        <li>Select a single teacher.</li>
                                        <li>Select one or more classes.</li>
                                        <li>Select one or more subjects.</li>
                                        <li>Creates one assignment for every class × subject combination for that teacher.</li>
                                        <li>Existing assignments are skipped by the server; only new combinations succeed.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-assignment-add-dialog', TeacherAssignmentAddDialog);
export default TeacherAssignmentAddDialog; 