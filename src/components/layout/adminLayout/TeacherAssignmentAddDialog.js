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
            // Ensure validation is called after render when dialog opens
            setTimeout(() => {
                this.validateForm();
            }, 100);
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
                this.teachers = response.data.data;
                this.render();
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
        }
    }

    async loadClasses() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/classes');
            
            if (response.status === 200 && response.data.success) {
                this.classes = response.data.data;
                this.render();
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    }

    async loadSubjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/subjects');
            
            if (response.status === 200 && response.data.success) {
                this.subjects = response.data.data;
                this.render();
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }

    // Load subjects for a specific class from Class Subjects
    async loadClassSubjects(classId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return [];

            console.log('🔍 Loading subjects for class ID:', classId);
            
            // Use the class-subjects endpoint to get subjects for a specific class
            const response = await api.withToken(token).get('/class-subjects');
            
            console.log('🔍 Raw response from /class-subjects:', response.data);
            
            if (response.status === 200 && response.data.success) {
                // Filter class-subjects by the specific class ID
                const classSubjects = response.data.data.filter(cs => cs.class_id == classId);
                
                console.log('🔍 Filtered class subjects for class', classId, ':', classSubjects);
                
                // Extract the subject information from class-subjects
                const subjects = classSubjects.map(cs => ({
                    id: cs.subject_id,
                    name: cs.subject_name,
                    code: cs.subject_code
                }));
                
                console.log('🔍 Processed subjects:', subjects);
                
                return subjects;
            }
        } catch (error) {
            console.error('❌ Error loading class subjects:', error);
        }
        return [];
    }

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('confirm', this.saveTeacherAssignment.bind(this));
        
        // Add form validation listeners after render
        setTimeout(() => {
            this.addFormEventListeners();
        }, 0);
    }

    // Validate form and toggle Confirm button
    validateForm() {
        try {
            const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
            
            const teacherId = teacherDropdown ? teacherDropdown.value : '';
            const classIds = classDropdown ? classDropdown.value : [];
            const subjectIds = subjectDropdown ? subjectDropdown.value : [];
            
            const isValid = !!teacherId && 
                           Array.isArray(classIds) && classIds.length > 0 && 
                           Array.isArray(subjectIds) && subjectIds.length > 0;
            
            // Get the confirm button by dialog-action attribute
            const confirmBtn = this.querySelector('ui-button[dialog-action="confirm"]');
            if (confirmBtn) {
                if (isValid) {
                    confirmBtn.removeAttribute('disabled');
                } else {
                    confirmBtn.setAttribute('disabled', '');
                }
            }
        } catch (_) { /* noop */ }
    }

    // Wire events for live validation
    addFormEventListeners() {
        console.log('🔍 Setting up form event listeners...');
        
        const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
        const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');

        console.log('🔍 Found dropdowns:', {
            teacher: !!teacherDropdown,
            class: !!classDropdown,
            subject: !!subjectDropdown
        });

        if (teacherDropdown) {
            teacherDropdown.addEventListener('change', () => this.validateForm());
        }
        if (classDropdown) {
            console.log('🔍 Adding change listener to class dropdown');
            classDropdown.addEventListener('change', async (event) => {
                console.log('🔍 Class dropdown change event triggered!');
                await this.onClassSelectionChange(event);
                this.validateForm();
            });
        }
        if (subjectDropdown) {
            subjectDropdown.addEventListener('change', () => this.validateForm());
        }

        // Initial validation state
        this.validateForm();
    }

    // Handle class selection change to update subjects dropdown
    async onClassSelectionChange(event) {
        const classDropdown = event.target;
        const selectedClassIds = classDropdown.value || [];
        
        console.log('Class selection changed:', selectedClassIds);
        
        if (selectedClassIds.length === 0) {
            // If no classes selected, show all subjects
            this.updateSubjectsDropdown(this.subjects);
            return;
        }

        // Get all subjects for all selected classes
        const allClassSubjects = [];
        for (const classId of selectedClassIds) {
            console.log('Loading subjects for class ID:', classId);
            const classSubjects = await this.loadClassSubjects(classId);
            console.log('Subjects for class', classId, ':', classSubjects);
            allClassSubjects.push(...classSubjects);
        }

        // Remove duplicates based on subject ID
        const uniqueSubjects = allClassSubjects.filter((subject, index, self) => 
            index === self.findIndex(s => s.id === subject.id)
        );

        console.log('All unique subjects for selected classes:', uniqueSubjects);

        // If no subjects found for selected classes, show a message and disable subjects dropdown
        if (uniqueSubjects.length === 0) {
            this.showNoSubjectsMessage();
            return;
        }

        // Update subjects dropdown with only the subjects available in selected classes
        this.updateSubjectsDropdown(uniqueSubjects);
    }

    // Update subjects dropdown with filtered subjects
    updateSubjectsDropdown(subjects) {
        console.log('🔍 updateSubjectsDropdown called with subjects:', subjects);
        
        const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
        if (!subjectDropdown) {
            console.error('❌ Subject dropdown not found!');
            return;
        }

        console.log('🔍 Found subject dropdown, clearing options...');
        
        // Clear current options by removing all ui-option elements
        const existingOptions = subjectDropdown.querySelectorAll('ui-option');
        existingOptions.forEach(option => option.remove());
        
        console.log('🔍 Adding', subjects.length, 'new options...');
        
        // Add new options
        subjects.forEach(subject => {
            const option = document.createElement('ui-option');
            option.setAttribute('value', subject.id);
            option.textContent = `${subject.name} (${subject.code})`;
            subjectDropdown.appendChild(option);
            console.log('🔍 Added option:', subject.name, '(', subject.code, ')');
        });

        // Reset selection
        subjectDropdown.value = [];
        
        console.log('🔍 Final dropdown HTML:', subjectDropdown.innerHTML);
        
        // Re-validate form
        this.validateForm();
    }

    // Show message when no subjects are available for selected classes
    showNoSubjectsMessage() {
        const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
        if (!subjectDropdown) return;

        // Clear current options by removing all ui-option elements
        const existingOptions = subjectDropdown.querySelectorAll('ui-option');
        existingOptions.forEach(option => option.remove());
        
        // Add a message option
        const messageOption = document.createElement('ui-option');
        messageOption.setAttribute('value', '');
        messageOption.textContent = 'No subjects available for selected classes';
        messageOption.setAttribute('disabled', '');
        subjectDropdown.appendChild(messageOption);
        
        // Reset selection
        subjectDropdown.value = [];
        
        // Re-validate form
        this.validateForm();
    }

    resetForm() {
        const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_id"]');
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_ids"]');
        const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');

        if (teacherDropdown) teacherDropdown.value = '';
        if (classDropdown) classDropdown.value = [];
        if (subjectDropdown) subjectDropdown.value = [];
        
        // Reset subjects dropdown to show all subjects
        this.updateSubjectsDropdown(this.subjects);
        
        // Re-validate after reset
        this.validateForm();
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
        // Ensure validation is called after opening
        setTimeout(() => {
            this.validateForm();
        }, 100);
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
                                    placeholder="Select classes first, then choose subjects..."
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

                        <!-- How it works -->
                        <div class="p-3 my-5 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                            <div class="flex items-start space-x-2">
                                <i class="fas fa-info-circle mt-0.5"></i>
                                <div>
                                    <p class="font-medium">How this works</p>
                                    <ul class="list-disc pl-5 mt-1 space-y-1">
                                        <li>Select a single teacher.</li>
                                        <li>Select one or more classes.</li>
                                        <li>Subjects dropdown automatically filters to show only subjects assigned to selected classes.</li>
                                        <li>Select one or more subjects from the filtered list.</li>
                                        <li>Creates one assignment for every class × subject combination for that teacher.</li>
                                        <li>Existing assignments are skipped by the server; only new combinations succeed.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Cancel</ui-button>
                    <ui-button color="primary" dialog-action="confirm" disabled>Add Assignment</ui-button>
                </div>
            </ui-dialog>
        `;
        
        // Re-setup event listeners and validate form after render
        setTimeout(() => {
            this.addFormEventListeners();
        }, 0);
    }
}

customElements.define('teacher-assignment-add-dialog', TeacherAssignmentAddDialog);
export default TeacherAssignmentAddDialog;
