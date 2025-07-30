import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Class Subject Update Dialog Component
 * 
 * Dialog for updating existing class subject assignments
 */
class ClassSubjectUpdateDialog extends HTMLElement {
    constructor() {
        super();
        this.classSubjectData = null;
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
        this.addEventListener('confirm', this.updateClassSubject.bind(this));
    }

    setClassSubjectData(classSubject) {
        this.classSubjectData = classSubject;
        this.render();
        
        // Force update dropdowns after render to ensure values are displayed
        setTimeout(() => {
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_id"]');
            
            if (classDropdown && classSubject?.class_id) {
                // Find the class option and set its text as the display value
                const selectedClass = this.classes.find(cls => cls.id == classSubject.class_id);
                if (selectedClass) {
                    classDropdown.setAttribute('value', classSubject.class_id);
                    classDropdown.setAttribute('display-value', `${selectedClass.name}-${selectedClass.section}`);
                }
            }
            
            if (subjectDropdown && classSubject?.subject_id) {
                // Find the subject option and set its text as the display value
                const selectedSubject = this.subjects.find(subject => subject.id == classSubject.subject_id);
                if (selectedSubject) {
                    subjectDropdown.setAttribute('value', classSubject.subject_id);
                    subjectDropdown.setAttribute('display-value', `${selectedSubject.name} (${selectedSubject.code})`);
                }
            }
        }, 200);
    }

    async updateClassSubject() {
        if (this.loading || !this.classSubjectData) return;
        
        try {
            this.setLoading(true);
            
            // Get form data using the data-field attributes for reliable selection
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_id"]');

            const classSubjectData = {
                class_id: classDropdown ? classDropdown.value : '',
                subject_id: subjectDropdown ? subjectDropdown.value : ''
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

            const response = await api.withToken(token).put(`/class-subjects/${this.classSubjectData.id}`, classSubjectData);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Class subject assignment updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('class-subject-updated', {
                    detail: {
                        classSubject: response.data.data
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to update class subject assignment',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error updating class subject:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update class subject assignment',
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
        const classSubject = this.classSubjectData;
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Update Class Subject Assignment">
                <div slot="content">
                    <div class="flex flex-col space-y-4">
                        <!-- Class Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                            ${this.classes.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="class_id" 
                                    placeholder="Search classes..."
                                    value="${classSubject?.class_id || ''}"
                                    display-value="${classSubject && classSubject.class_id ? 
                                        (this.classes.find(cls => cls.id == classSubject.class_id)?.name + '-' + 
                                        this.classes.find(cls => cls.id == classSubject.class_id)?.section) || '' : ''}"
                                    class="w-full">
                                    ${this.classes.map(cls => `
                                        <ui-option value="${cls.id}" ${classSubject && classSubject.class_id == cls.id ? 'selected' : ''}>${cls.name}-${cls.section}</ui-option>
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
                                    value="${classSubject?.subject_id || ''}"
                                                                         display-value="${classSubject && classSubject.subject_id ? 
                                         (this.subjects.find(subject => subject.id == classSubject.subject_id)?.name + ' (' + 
                                         this.subjects.find(subject => subject.id == classSubject.subject_id)?.code + ')') || '' : ''}"
                                     class="w-full">
                                     ${this.subjects.map(subject => `
                                         <ui-option value="${subject.id}" ${classSubject && classSubject.subject_id == subject.id ? 'selected' : ''}>${subject.name} (${subject.code})</ui-option>
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

customElements.define('class-subject-update-dialog', ClassSubjectUpdateDialog);
export default ClassSubjectUpdateDialog; 