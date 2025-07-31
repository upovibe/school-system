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

    setTeacherAssignmentData(teacherAssignment, allAssignments = null) {
        this.teacherAssignmentData = teacherAssignment;
        this.allAssignments = allAssignments;
        this.render();
        
        // If we have all assignments data, use it directly instead of making an API call
        if (allAssignments && allAssignments.length > 0) {
            this.setupDropdownsWithData(allAssignments);
        } else {
            // Fallback to API call
            this.loadTeacherAssignments(teacherAssignment.teacher_id, teacherAssignment.class_id);
        }
        
        // Setup change listeners after render
        setTimeout(() => {
            this.setupTeacherChangeListener();
            this.setupClassChangeListener();
        }, 100);
    }

    setupDropdownsWithData(assignments) {
        // Set up dropdowns immediately with fallback data, then update when API data loads
        this.setupDropdownsImmediately(assignments);
        
        // Also set up a watcher for when API data becomes available
        const waitForData = () => {
            if (this.teachers.length === 0 || this.classes.length === 0 || this.subjects.length === 0) {
                setTimeout(waitForData, 100);
                return;
            }
            
            // Update dropdowns with full API data
            this.updateDropdownsWithApiData(assignments);
        };
        
        waitForData();
    }

    setupDropdownsImmediately(assignments) {
        // Filter assignments for the specific class being edited
        const classAssignments = assignments.filter(assignment => assignment.class_id == this.teacherAssignmentData.class_id);
        
        // Extract subject IDs for this specific class
        const subjectIds = classAssignments.map(assignment => assignment.subject_id);
        
        // Set up dropdowns immediately with available data
        setTimeout(() => {
            const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
            
            // Set teacher dropdown with fallback data
            if (teacherDropdown && this.teacherAssignmentData?.teacher_id) {
                // Use fallback teacher data from assignments
                const teacherAssignment = assignments.find(a => a.teacher_id == this.teacherAssignmentData.teacher_id);
                if (teacherAssignment) {
                    teacherDropdown.setAttribute('value', this.teacherAssignmentData.teacher_id);
                    teacherDropdown.setAttribute('display-value', `${teacherAssignment.teacher_name || 'Teacher'} (${teacherAssignment.employee_id || 'N/A'})`);
                }
            }
            
            // Set class dropdown with fallback data
            if (classDropdown && this.teacherAssignmentData?.class_id) {
                const classAssignment = assignments.find(a => a.class_id == this.teacherAssignmentData.class_id);
                if (classAssignment) {
                    classDropdown.setAttribute('value', this.teacherAssignmentData.class_id);
                    classDropdown.setAttribute('display-value', `${classAssignment.class_name || 'Class'} - ${classAssignment.class_section || 'N/A'}`);
                }
            }
            
            // Set subject dropdown with fallback data
            if (subjectDropdown && subjectIds.length > 0) {
                // Create fallback subjects from assignments
                const fallbackSubjects = classAssignments.map(assignment => ({
                    id: assignment.subject_id,
                    name: assignment.subject_name || `Subject ${assignment.subject_id}`,
                    code: assignment.subject_code || `SUB${assignment.subject_id}`
                }));
                
                subjectDropdown.setAttribute('value', JSON.stringify(subjectIds));
                const displayValue = fallbackSubjects.map(subject => `${subject.name} (${subject.code})`).join(', ');
                subjectDropdown.setAttribute('display-value', displayValue);
            }
        }, 100);
    }

    updateDropdownsWithApiData(assignments) {
        // Filter assignments for the specific class being edited
        const classAssignments = assignments.filter(assignment => assignment.class_id == this.teacherAssignmentData.class_id);
        
        // Extract subject IDs for this specific class
        const subjectIds = classAssignments.map(assignment => assignment.subject_id);
        
        // Update dropdowns with full API data
        setTimeout(() => {
            const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
            
            if (teacherDropdown && this.teacherAssignmentData?.teacher_id) {
                const selectedTeacher = this.teachers.find(teacher => teacher.id == this.teacherAssignmentData.teacher_id);
                if (selectedTeacher) {
                    teacherDropdown.setAttribute('value', this.teacherAssignmentData.teacher_id);
                    teacherDropdown.setAttribute('display-value', `${selectedTeacher.first_name} ${selectedTeacher.last_name} (${selectedTeacher.employee_id})`);
                }
            }
            
            if (classDropdown && this.teacherAssignmentData?.class_id) {
                const selectedClass = this.classes.find(cls => cls.id == this.teacherAssignmentData.class_id);
                if (selectedClass) {
                    classDropdown.setAttribute('value', this.teacherAssignmentData.class_id);
                    classDropdown.setAttribute('display-value', `${selectedClass.name}-${selectedClass.section}`);
                }
            }
            
            if (subjectDropdown && subjectIds.length > 0) {
                const selectedSubjects = this.subjects.filter(subject => subjectIds.includes(subject.id));
                subjectDropdown.setAttribute('value', JSON.stringify(subjectIds));
                const displayValue = selectedSubjects.map(subject => `${subject.name} (${subject.code})`).join(', ');
                subjectDropdown.setAttribute('display-value', displayValue);
            }
        }, 100);
    }

    // Add method to handle teacher change
    setupTeacherChangeListener() {
        const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
        if (teacherDropdown) {
            teacherDropdown.addEventListener('change', (event) => {
                const teacherId = event.detail.value;
                if (teacherId) {
                    // Load assignments for the new teacher
                    this.loadTeacherAssignments(teacherId);
                }
            });
        }
    }

    // Add method to handle class change
    setupClassChangeListener() {
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
        if (classDropdown) {
            classDropdown.addEventListener('change', (event) => {
                const classId = event.detail.value;
                if (classId) {
                    // Update subjects based on the selected class
                    this.updateSubjectsForClass(classId);
                }
            });
        }
    }

    async updateSubjectsForClass(classId) {
        if (!this.allAssignments) return;
        
        // Filter assignments for the selected class
        const classAssignments = this.allAssignments.filter(assignment => assignment.class_id == classId);
        
        // Extract subject IDs for this class
        const subjectIds = classAssignments.map(assignment => assignment.subject_id);
        
        // Update the subject dropdown
        setTimeout(() => {
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
            if (subjectDropdown && subjectIds.length > 0) {
                subjectDropdown.setAttribute('value', JSON.stringify(subjectIds));
                // Set display value for multiple subjects
                const selectedSubjects = this.subjects.filter(subject => subjectIds.includes(subject.id));
                const displayValue = selectedSubjects.map(subject => `${subject.name} (${subject.code})`).join(', ');
                subjectDropdown.setAttribute('display-value', displayValue);
            }
        }, 100);
    }

    async loadTeacherAssignments(teacherId, classId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Use the correct endpoint to get assignments for this specific teacher and class
            const response = await api.withToken(token).get(`/teacher-assignments/by-teacher?teacher_id=${teacherId}`);
            
            if (response.status === 200 && response.data.success) {
                const teacherAssignments = response.data.data;
                
                // Filter assignments for the specific class being edited
                const classAssignments = teacherAssignments.filter(assignment => assignment.class_id == classId);
                
                // Extract subject IDs for this specific class
                const subjectIds = classAssignments.map(assignment => assignment.subject_id);
                
                // Force update dropdowns after render to ensure values are displayed
                setTimeout(() => {
                    const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
                    const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
                    const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
                    
                    if (teacherDropdown && this.teacherAssignmentData?.teacher_id) {
                        // Find the teacher option and set its text as the display value
                        const selectedTeacher = this.teachers.find(teacher => teacher.id == this.teacherAssignmentData.teacher_id);
                        if (selectedTeacher) {
                            teacherDropdown.setAttribute('value', this.teacherAssignmentData.teacher_id);
                            teacherDropdown.setAttribute('display-value', `${selectedTeacher.first_name} ${selectedTeacher.last_name} (${selectedTeacher.employee_id})`);
                        }
                    }
                    
                    if (classDropdown && this.teacherAssignmentData?.class_id) {
                        classDropdown.setAttribute('value', JSON.stringify([this.teacherAssignmentData.class_id]));
                        // Set display value for the specific class
                        const selectedClass = this.classes.find(cls => cls.id == this.teacherAssignmentData.class_id);
                        if (selectedClass) {
                            classDropdown.setAttribute('display-value', `${selectedClass.name}-${selectedClass.section}`);
                        }
                    }
                    
                    if (subjectDropdown && subjectIds.length > 0) {
                        subjectDropdown.setAttribute('value', JSON.stringify(subjectIds));
                        // Set display value for multiple subjects
                        const selectedSubjects = this.subjects.filter(subject => subjectIds.includes(subject.id));
                        const displayValue = selectedSubjects.map(subject => `${subject.name} (${subject.code})`).join(', ');
                        subjectDropdown.setAttribute('display-value', displayValue);
                    }
                }, 200);
            }
        } catch (error) {
            console.error('Error loading teacher assignments:', error);
        }
    }

    async updateTeacherAssignment() {
        if (this.loading || !this.teacherAssignmentData) return;
        
        try {
            this.setLoading(true);
            
            // Get form data using the data-field attributes for reliable selection
            const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');

            const teacherId = teacherDropdown ? teacherDropdown.value : '';
            const classId = classDropdown ? classDropdown.value : '';
            const subjectIds = subjectDropdown ? subjectDropdown.value : [];

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

            if (!classId) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a class',
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

            // Filter out any invalid subject IDs
            const validSubjectIds = subjectIds.filter(id => id && id !== '' && !isNaN(id));
            
            if (!classId || isNaN(classId)) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'No valid class selected',
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

            // Update the specific class using the existing endpoint
            // This is similar to how the EditClassDialog works
            const teacherAssignmentData = {
                subject_ids: validSubjectIds
            };

            const response = await api.withToken(token).put(`/teacher-assignments/teacher/${teacherId}/class/${classId}`, teacherAssignmentData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: `Teacher assignments updated successfully`,
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('teacher-assignment-updated', {
                    detail: {
                        teacherAssignments: response.data.data.assignments
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to update teacher assignments',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error updating teacher assignments:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update teacher assignments',
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
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                            ${this.classes.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="class_ids" 
                                    placeholder="Search and select class..."
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
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-assignment-update-dialog', TeacherAssignmentUpdateDialog);
export default TeacherAssignmentUpdateDialog; 