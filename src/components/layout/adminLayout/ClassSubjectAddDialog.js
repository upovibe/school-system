import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Class Subject Add Dialog Component
 * 
 * Dialog for adding new class subject assignments
 */
class ClassSubjectAddDialog extends HTMLElement {
    constructor() {
        super();
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
        this.loadClasses();
        this.loadSubjects();
        this.setupEventListeners();
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
        this.addEventListener('confirm', this.saveClassSubject.bind(this));
    }

    resetForm() {
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
        const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
        const academicYearDropdown = this.querySelector('ui-search-dropdown[data-field="academic_year"]');
        const termDropdown = this.querySelector('ui-search-dropdown[data-field="term"]');
        const teachingHoursInput = this.querySelector('ui-input[data-field="teaching_hours"]');

        if (classDropdown) classDropdown.value = '';
        if (subjectDropdown) subjectDropdown.value = [];
        if (academicYearDropdown) academicYearDropdown.value = '';
        if (termDropdown) termDropdown.value = 'full_year';
        if (teachingHoursInput) teachingHoursInput.value = '0';
    }

    async saveClassSubject() {
        if (this.loading) return;
        
        try {
            this.setLoading(true);
            
            // Get form data using the data-field attributes for reliable selection
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
            const academicYearDropdown = this.querySelector('ui-search-dropdown[data-field="academic_year"]');
            const termDropdown = this.querySelector('ui-search-dropdown[data-field="term"]');
            const teachingHoursInput = this.querySelector('ui-input[data-field="teaching_hours"]');

                               const classId = classDropdown ? classDropdown.value : '';
                   const subjectIds = subjectDropdown ? subjectDropdown.value : [];

                   // Debug logging
                   console.log('Form Data:', {
                       classId,
                       subjectIds
                   });

                   // Validation
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

            // Create multiple class-subject assignments
            console.log('Creating assignments for subject IDs:', subjectIds);
            
            // Filter out any invalid subject IDs
            const validSubjectIds = subjectIds.filter(id => id && id !== '' && !isNaN(id));
            console.log('Valid subject IDs:', validSubjectIds);
            
            if (validSubjectIds.length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'No valid subjects selected',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }
            
                               const promises = validSubjectIds.map(subjectId => {
                       const classSubjectData = {
                           class_id: parseInt(classId),
                           subject_id: parseInt(subjectId)
                       };
                       console.log('Creating assignment:', classSubjectData);
                       return api.withToken(token).post('/class-subjects', classSubjectData);
                   });

            const responses = await Promise.all(promises);
            console.log('API Responses:', responses);
            
            // Check if all responses were successful
            const allSuccessful = responses.every(response => response.data.success);
            
            if (allSuccessful) {
                Toast.show({
                    title: 'Success',
                    message: `${validSubjectIds.length} class subject assignment(s) created successfully`,
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                const createdAssignments = responses.map(response => response.data.data);
                this.close();
                this.dispatchEvent(new CustomEvent('class-subject-saved', {
                    detail: {
                        classSubjects: createdAssignments
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: 'Some class subject assignments failed to create',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error creating class subjects:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create class subject assignments',
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
                title="Add Class Subject Assignment">
                <div slot="content">
                    <div class="flex flex-col space-y-4">
                        <!-- Class Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                            ${this.classes.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="class_id" 
                                    placeholder="Search classes..."
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

customElements.define('class-subject-add-dialog', ClassSubjectAddDialog);
export default ClassSubjectAddDialog; 