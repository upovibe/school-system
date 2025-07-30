import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Assignment Update Dialog Component
 * 
 * Dialog for updating existing teacher assignments
 */
class TeacherAssignmentUpdateDialog extends HTMLElement {
    constructor() {
        super();
        this.teacherAssignmentData = null;
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
        this.addEventListener('confirm', this.updateTeacherAssignment.bind(this));
    }

    setTeacherAssignmentData(teacherAssignment) {
        this.teacherAssignmentData = teacherAssignment;
        this.render();
        
        // Force update dropdowns after render to ensure values are displayed
        setTimeout(() => {
            const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_id"]');
            
            if (teacherDropdown && teacherAssignment?.teacher_id) {
                // Find the teacher option and set its text as the display value
                const selectedTeacher = this.teachers.find(teacher => teacher.id == teacherAssignment.teacher_id);
                if (selectedTeacher) {
                    teacherDropdown.setAttribute('value', teacherAssignment.teacher_id);
                    teacherDropdown.setAttribute('display-value', `${selectedTeacher.first_name} ${selectedTeacher.last_name} (${selectedTeacher.employee_id})`);
                }
            }
            
            if (classDropdown && teacherAssignment?.class_id) {
                // Find the class option and set its text as the display value
                const selectedClass = this.classes.find(cls => cls.id == teacherAssignment.class_id);
                if (selectedClass) {
                    classDropdown.setAttribute('value', teacherAssignment.class_id);
                    classDropdown.setAttribute('display-value', `${selectedClass.name}-${selectedClass.section}`);
                }
            }
            
            if (subjectDropdown && teacherAssignment?.subject_id) {
                // Find the subject option and set its text as the display value
                const selectedSubject = this.subjects.find(subject => subject.id == teacherAssignment.subject_id);
                if (selectedSubject) {
                    subjectDropdown.setAttribute('value', teacherAssignment.subject_id);
                    subjectDropdown.setAttribute('display-value', `${selectedSubject.name} (${selectedSubject.code})`);
                }
            }
        }, 200);
    }

    async updateTeacherAssignment() {
        if (this.loading || !this.teacherAssignmentData) return;
        
        try {
            this.setLoading(true);
            
            // Get form data using the data-field attributes for reliable selection
            const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_id"]');

            const teacherAssignmentData = {
                teacher_id: teacherDropdown ? teacherDropdown.value : '',
                class_id: classDropdown ? classDropdown.value : '',
                subject_id: subjectDropdown ? subjectDropdown.value : ''
            };

            // Validation
            if (!teacherAssignmentData.teacher_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a teacher',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherAssignmentData.class_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a class',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!teacherAssignmentData.subject_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a subject',
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

            const response = await api.withToken(token).put(`/teacher-assignments/${this.teacherAssignmentData.id}`, teacherAssignmentData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Teacher assignment updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-assignment-updated', {
                    detail: {
                        teacherAssignment: response.data.data
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to update teacher assignment',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error updating teacher assignment:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update teacher assignment',
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
        const teacherAssignment = this.teacherAssignmentData;
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Update Teacher Assignment">
                <div slot="content">
                    <div class="flex flex-col space-y-4">
                        <!-- Teacher Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                            ${this.teachers.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="teacher_id" 
                                    placeholder="Search teachers..."
                                    value="${teacherAssignment?.teacher_id || ''}"
                                    display-value="${teacherAssignment && teacherAssignment.teacher_id ? 
                                        (this.teachers.find(teacher => teacher.id == teacherAssignment.teacher_id)?.first_name + ' ' + 
                                        this.teachers.find(teacher => teacher.id == teacherAssignment.teacher_id)?.last_name + ' (' +
                                        this.teachers.find(teacher => teacher.id == teacherAssignment.teacher_id)?.employee_id + ')') || '' : ''}"
                                    class="w-full">
                                    ${this.teachers.map(teacher => `
                                        <ui-option value="${teacher.id}" ${teacherAssignment && teacherAssignment.teacher_id == teacher.id ? 'selected' : ''}>${teacher.first_name} ${teacher.last_name} (${teacher.employee_id})</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>

                        <!-- Class Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                            ${this.classes.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="class_id" 
                                    placeholder="Search classes..."
                                    value="${teacherAssignment?.class_id || ''}"
                                    display-value="${teacherAssignment && teacherAssignment.class_id ? 
                                        (this.classes.find(cls => cls.id == teacherAssignment.class_id)?.name + '-' + 
                                        this.classes.find(cls => cls.id == teacherAssignment.class_id)?.section) || '' : ''}"
                                    class="w-full">
                                    ${this.classes.map(cls => `
                                        <ui-option value="${cls.id}" ${teacherAssignment && teacherAssignment.class_id == cls.id ? 'selected' : ''}>${cls.name}-${cls.section}</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>

                        <!-- Subject Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                            ${this.subjects.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="subject_id" 
                                    placeholder="Search subjects..."
                                    value="${teacherAssignment?.subject_id || ''}"
                                    display-value="${teacherAssignment && teacherAssignment.subject_id ? 
                                        (this.subjects.find(subject => subject.id == teacherAssignment.subject_id)?.name + ' (' + 
                                        this.subjects.find(subject => subject.id == teacherAssignment.subject_id)?.code + ')') || '' : ''}"
                                    class="w-full">
                                    ${this.subjects.map(subject => `
                                        <ui-option value="${subject.id}" ${teacherAssignment && teacherAssignment.subject_id == subject.id ? 'selected' : ''}>${subject.name} (${subject.code})</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-assignment-update-dialog', TeacherAssignmentUpdateDialog);
export default TeacherAssignmentUpdateDialog; 