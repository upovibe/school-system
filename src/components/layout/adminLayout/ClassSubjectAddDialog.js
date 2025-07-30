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

            const response = await api.withToken(token).get('/classes/active');
            this.classes = response.data.data || [];
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    }

    async loadSubjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/subjects/active');
            this.subjects = response.data.data || [];
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }

    async loadAcademicYears() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/classes/academic-years');
            this.academicYears = response.data.data || [];
        } catch (error) {
            console.error('Error loading academic years:', error);
        }
    }

    setupEventListeners() {
        const form = this.querySelector('#class-subject-form');
        if (form) {
            form.addEventListener('submit', this.saveClassSubject.bind(this));
        }
    }

    async saveClassSubject(e) {
        e.preventDefault();
        
        if (this.loading) return;
        
        try {
            this.setLoading(true);
            
            const formData = new FormData(e.target);
            const classSubjectData = {
                class_id: formData.get('class_id'),
                subject_id: formData.get('subject_id'),
                academic_year: formData.get('academic_year'),
                term: formData.get('term'),
                teaching_hours: parseInt(formData.get('teaching_hours')) || 0
            };

            // Validation
            if (!classSubjectData.class_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a class',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!classSubjectData.subject_id) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a subject',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!classSubjectData.academic_year) {
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

            const response = await api.withToken(token).post('/class-subjects', classSubjectData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Class subject assignment created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the new class subject data
                this.dispatchEvent(new CustomEvent('class-subject-saved', {
                    detail: {
                        classSubject: response.data.data
                    }
                }));

                this.close();
                e.target.reset();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to create class subject assignment',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error creating class subject:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create class subject assignment',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.loading = loading;
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? 'Creating...' : 'Create Class Subject';
        }
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
                    <form id="class-subject-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Class Selection -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                                <ui-search-dropdown name="class_id" placeholder="Select a class" required>
                                    ${this.classes.map(cls => `
                                        <ui-option value="${cls.id}">${cls.name} - ${cls.section}</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            </div>

                            <!-- Subject Selection -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                                <ui-search-dropdown name="subject_id" placeholder="Select a subject" required>
                                    ${this.subjects.map(subject => `
                                        <ui-option value="${subject.id}">${subject.name} (${subject.code})</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Academic Year -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                                <ui-search-dropdown name="academic_year" placeholder="Select academic year" required>
                                    ${this.academicYears.map(year => `
                                        <ui-option value="${year}">${year}</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            </div>

                            <!-- Term -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Term</label>
                                <ui-search-dropdown name="term" placeholder="Select term">
                                    ${this.terms.map(term => `
                                        <ui-option value="${term}">${term.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            </div>
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
                    </form>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('class-subject-add-dialog', ClassSubjectAddDialog);
export default ClassSubjectAddDialog; 