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
        this.allClassSubjects = null;
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
            // Re-render after a short delay to ensure data is loaded
            setTimeout(() => {
                this.render();
            }, 100);
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
                // Only update if we don't have fallback data yet
                if (this.classes.length === 0) {
                    this.classes = response.data.data;
                } else {
                    // Merge with existing fallback data, keeping fallback for assigned classes
                    const apiClasses = response.data.data;
                    const fallbackClasses = this.classes;
                    
                    // Create a map of existing classes by ID
                    const existingClassesMap = new Map(fallbackClasses.map(cls => [cls.id, cls]));
                    
                    // Add new classes from API that aren't in fallback
                    apiClasses.forEach(apiClass => {
                        if (!existingClassesMap.has(apiClass.id)) {
                            existingClassesMap.set(apiClass.id, apiClass);
                        }
                    });
                    
                    this.classes = Array.from(existingClassesMap.values());
                }
                
                // Re-render to update dropdown options
                this.render();
                // Re-setup dropdowns if we have class subject data
                if (this.classSubjectData && this.allClassSubjects) {
                    setTimeout(() => {
                        this.setupDropdownsImmediately(this.allClassSubjects);
                    }, 50);
                }
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
                // Only update if we don't have fallback data yet
                if (this.subjects.length === 0) {
                    this.subjects = response.data.data;
                } else {
                    // Merge with existing fallback data, keeping fallback for assigned subjects
                    const apiSubjects = response.data.data;
                    const fallbackSubjects = this.subjects;
                    
                    // Create a map of existing subjects by ID
                    const existingSubjectsMap = new Map(fallbackSubjects.map(subj => [subj.id, subj]));
                    
                    // Add new subjects from API that aren't in fallback
                    apiSubjects.forEach(apiSubject => {
                        if (!existingSubjectsMap.has(apiSubject.id)) {
                            existingSubjectsMap.set(apiSubject.id, apiSubject);
                        }
                    });
                    
                    this.subjects = Array.from(existingSubjectsMap.values());
                }
                
                // Re-render to update dropdown options
                this.render();
                // Re-setup dropdowns if we have class subject data
                if (this.classSubjectData && this.allClassSubjects) {
                    setTimeout(() => {
                        this.setupDropdownsImmediately(this.allClassSubjects);
                    }, 50);
                }
            }
        } catch (error) {
            // Silent error handling
        }
    }

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('confirm', this.updateClassSubject.bind(this));
    }

    setClassSubjectData(classSubject, allClassSubjects = null) {
        this.classSubjectData = classSubject;
        this.allClassSubjects = allClassSubjects;
        
        // Create fallback data immediately from class subjects
        if (allClassSubjects && allClassSubjects.length > 0) {
            this.createFallbackData(allClassSubjects);
        }
        
        this.render();
        
        // If we have all class subjects data, use it directly instead of making an API call
        if (allClassSubjects && allClassSubjects.length > 0) {
            this.setupDropdownsWithData(allClassSubjects);
        } else {
            // Fallback to API call
            this.loadClassSubjects(classSubject.class_id);
        }
        
        // Setup change listeners after render
        setTimeout(() => {
            this.setupClassChangeListener();
        }, 100);
    }

    createFallbackData(classSubjects) {
        // Create fallback classes from class subjects
        const uniqueClasses = classSubjects.reduce((acc, classSubject) => {
            if (!acc.find(c => c.id === classSubject.class_id)) {
                acc.push({
                    id: classSubject.class_id,
                    name: classSubject.class_name || 'Class',
                    section: classSubject.class_section || 'N/A'
                });
            }
            return acc;
        }, []);

        // Create fallback subjects from class subjects
        const uniqueSubjects = classSubjects.reduce((acc, classSubject) => {
            if (!acc.find(s => s.id === classSubject.subject_id)) {
                acc.push({
                    id: classSubject.subject_id,
                    name: classSubject.subject_name || `Subject ${classSubject.subject_id}`,
                    code: classSubject.subject_code || `SUB${classSubject.subject_id}`
                });
            }
            return acc;
        }, []);

        // Set fallback data immediately
        this.classes = uniqueClasses;
        this.subjects = uniqueSubjects;
    }

    setupDropdownsWithData(classSubjects) {
        // Set up dropdowns immediately with fallback data
        this.setupDropdownsImmediately(classSubjects);
        
        // Don't update with API data at all - fallback data is sufficient
        // This prevents any flickering or empty fields
    }

    setupDropdownsImmediately(classSubjects) {
        // Filter class subjects for the specific class being edited
        const classClassSubjects = classSubjects.filter(classSubject => classSubject.class_id == this.classSubjectData.class_id);
        
        // Extract subject IDs for this specific class
        const subjectIds = classClassSubjects.map(classSubject => classSubject.subject_id);
        
        // Set up dropdowns immediately with available data
        setTimeout(() => {
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
            
            // Set class dropdown with fallback data
            if (classDropdown && this.classSubjectData?.class_id) {
                const selectedClass = this.classes.find(cls => cls.id == this.classSubjectData.class_id);
                if (selectedClass) {
                    classDropdown.setAttribute('value', this.classSubjectData.class_id);
                    classDropdown.setAttribute('display-value', `${selectedClass.name}-${selectedClass.section}`);
                }
            }
            
            // Set subject dropdown with fallback data
            if (subjectDropdown && subjectIds.length > 0) {
                const selectedSubjects = this.subjects.filter(subject => subjectIds.includes(subject.id));
                subjectDropdown.setAttribute('value', JSON.stringify(subjectIds));
                const displayValue = selectedSubjects.map(subject => `${subject.name} (${subject.code})`).join(', ');
                subjectDropdown.setAttribute('display-value', displayValue);
            }
        }, 100);
    }

    // Add method to handle class change
    setupClassChangeListener() {
        const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
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
        if (!this.allClassSubjects) return;
        
        // Filter class subjects for the selected class
        const classClassSubjects = this.allClassSubjects.filter(classSubject => classSubject.class_id == classId);
        
        // Extract subject IDs for this class
        const subjectIds = classClassSubjects.map(classSubject => classSubject.subject_id);
        
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

    async loadClassSubjects(classId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Use the correct endpoint to get class subjects for this specific class
            const response = await api.withToken(token).get(`/class-subjects?class_id=${classId}`);
            
            if (response.status === 200 && response.data.success) {
                const classSubjects = response.data.data;
                
                // Extract subject IDs for this specific class
                const subjectIds = classSubjects.map(classSubject => classSubject.subject_id);
                
                // Force update dropdowns after render to ensure values are displayed
                setTimeout(() => {
                    const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
                    const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');
                    
                    if (classDropdown && this.classSubjectData?.class_id) {
                        // Find the class option and set its text as the display value
                        const selectedClass = this.classes.find(cls => cls.id == this.classSubjectData.class_id);
                        if (selectedClass) {
                            classDropdown.setAttribute('value', this.classSubjectData.class_id);
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
            console.error('Error loading class subjects:', error);
        }
    }

    async updateClassSubject() {
        if (this.loading || !this.classSubjectData) return;
        
        try {
            this.setLoading(true);
            
            // Get form data using the data-field attributes for reliable selection
            const classDropdown = this.querySelector('ui-search-dropdown[data-field="class_id"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[data-field="subject_ids"]');

            const classId = classDropdown ? classDropdown.value : '';
            const subjectIds = subjectDropdown ? subjectDropdown.value : [];

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

            // For now, we'll update each subject individually
            // In the future, you might want to create a bulk update endpoint
            const updatePromises = validSubjectIds.map(subjectId => {
                const classSubjectData = {
                    class_id: classId,
                    subject_id: subjectId
                };
                
                // Check if this class-subject combination already exists
                const existingClassSubject = this.allClassSubjects?.find(cs => 
                    cs.class_id == classId && cs.subject_id == subjectId
                );
                
                if (existingClassSubject) {
                    // Update existing
                    return api.withToken(token).put(`/class-subjects/${existingClassSubject.id}`, classSubjectData);
                } else {
                    // Create new
                    return api.withToken(token).post('/class-subjects', classSubjectData);
                }
            });

            const responses = await Promise.all(updatePromises);
            
            // Check if all updates were successful
            const allSuccessful = responses.every(response => response.data.success);
            
            if (allSuccessful) {
                Toast.show({
                    title: 'Success',
                    message: `Class subject assignments updated successfully`,
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('class-subject-updated', {
                    detail: {
                        classSubjects: responses.map(response => response.data.data)
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: 'Some class subject assignments failed to update',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error updating class subjects:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update class subject assignments',
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

customElements.define('class-subject-update-dialog', ClassSubjectUpdateDialog);
export default ClassSubjectUpdateDialog; 