import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Button.js';
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
        this.academicYears = [];
        this.terms = ['full_year', 'first_term', 'second_term', 'third_term'];
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
        this.loadAcademicYears();
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

    async loadAcademicYears() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/classes/academic-years');
            
            if (response.status === 200 && response.data.success) {
                this.academicYears = response.data.data; // Academic years array is in response.data.data
                // Re-render to update the dropdown with academic years
                this.render();
            }
        } catch (error) {
            // Silent error handling
        }
    }

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('dialog-save', this.saveClassSubject.bind(this));
    }

    resetForm() {
        const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
        const subjectDropdown = this.querySelector('ui-search-dropdown[name="subject_ids"]');
        const academicYearDropdown = this.querySelector('ui-search-dropdown[name="academic_year"]');
        const termDropdown = this.querySelector('ui-search-dropdown[name="term"]');
        const teachingHoursInput = this.querySelector('ui-input[name="teaching_hours"]');

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
            
            // Get form data using direct element selection
            const classDropdown = this.querySelector('ui-search-dropdown[name="class_id"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[name="subject_ids"]');
            const academicYearDropdown = this.querySelector('ui-search-dropdown[name="academic_year"]');
            const termDropdown = this.querySelector('ui-search-dropdown[name="term"]');
            const teachingHoursInput = this.querySelector('ui-input[name="teaching_hours"]');

            const classId = classDropdown ? classDropdown.value : '';
            const subjectIds = subjectDropdown ? subjectDropdown.value : [];
            const academicYear = academicYearDropdown ? academicYearDropdown.value : '';
            const term = termDropdown ? termDropdown.value : 'full_year';
            const teachingHours = teachingHoursInput ? parseInt(teachingHoursInput.value) || 0 : 0;

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

            if (!subjectIds || subjectIds.length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select at least one subject',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!academicYear) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter academic year',
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
            const promises = subjectIds.map(subjectId => {
                const classSubjectData = {
                    class_id: classId,
                    subject_id: subjectId,
                    academic_year: academicYear,
                    term: term,
                    teaching_hours: teachingHours
                };
                return api.withToken(token).post('/class-subjects', classSubjectData);
            });

            const responses = await Promise.all(promises);
            
            // Check if all responses were successful
            const allSuccessful = responses.every(response => response.data.success);
            
            if (allSuccessful) {
                Toast.show({
                    title: 'Success',
                    message: `${subjectIds.length} class subject assignment(s) created successfully`,
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with all the new class subject data
                const createdAssignments = responses.map(response => response.data.data);
                this.dispatchEvent(new CustomEvent('class-subject-saved', {
                    detail: {
                        classSubjects: createdAssignments
                    }
                }));

                this.close();
                this.resetForm();
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
                                    name="class_id" 
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
                                    name="subject_ids" 
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

                        <!-- Academic Year -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                            ${this.academicYears.length > 0 ? `
                                <ui-search-dropdown 
                                    name="academic_year" 
                                    placeholder="Select academic year..."
                                    class="w-full">
                                    ${this.academicYears.map(year => `
                                        <ui-option value="${year}">${year}</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>

                        <!-- Term -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Term</label>
                            <ui-search-dropdown 
                                name="term" 
                                placeholder="Select term..."
                                class="w-full">
                                ${this.terms.map(term => `
                                    <ui-option value="${term}">${term.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</ui-option>
                                `).join('')}
                            </ui-search-dropdown>
                        </div>

                        <!-- Teaching Hours -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teaching Hours</label>
                            <ui-input 
                                type="number" 
                                name="teaching_hours" 
                                placeholder="Enter teaching hours"
                                min="0"
                                value="0"
                                class="w-full">
                            </ui-input>
                        </div>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('class-subject-add-dialog', ClassSubjectAddDialog);
export default ClassSubjectAddDialog; 