import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * House Add Dialog Component
 * 
 * Dialog for adding new houses with teacher assignments
 */
class HouseAddDialog extends HTMLElement {
    constructor() {
        super();
        this.teachers = [];
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

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('confirm', this.saveHouse.bind(this));
        
        // Add form validation listeners after render
        setTimeout(() => {
            this.addFormEventListeners();
        }, 0);
    }

    // Validate form and toggle Confirm button
    validateForm() {
        try {
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_ids"]');
            
            // Get values with multiple fallbacks
            let name = '';
            let teacherIds = [];
            
            if (nameInput) {
                // Try different ways to get the value
                name = nameInput.value || 
                       nameInput.getAttribute('value') || 
                       nameInput.shadowRoot?.querySelector('input')?.value || 
                       '';
            }
            
            if (teacherDropdown) {
                // Try different ways to get the value
                const value = teacherDropdown.value || 
                             teacherDropdown.getAttribute('value') || 
                             teacherDropdown.selectedValues || 
                             [];
                teacherIds = Array.isArray(value) ? value : [];
            }
            
            console.log('Validation check:', { 
                name, 
                teacherIds, 
                nameLength: name.trim().length,
                nameInputExists: !!nameInput,
                teacherDropdownExists: !!teacherDropdown
            });
            
            const isValid = !!name && name.trim().length >= 2 && 
                           Array.isArray(teacherIds) && teacherIds.length > 0;
            
            console.log('Form is valid:', isValid);
            
            // Get the confirm button by dialog-action attribute
            const confirmBtn = this.querySelector('ui-button[dialog-action="confirm"]');
            if (confirmBtn) {
                // Use setAttribute instead of direct property assignment
                if (isValid) {
                    confirmBtn.removeAttribute('disabled');
                } else {
                    confirmBtn.setAttribute('disabled', '');
                }
                console.log('Button disabled state:', !isValid);
            } else {
                console.log('Confirm button not found');
            }
        } catch (error) {
            console.error('Error validating form:', error);
        }
    }

    addFormEventListeners() {
        // Add event listeners for form validation
        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_ids"]');
        
        console.log('Setting up event listeners:', { nameInput, teacherDropdown });
        
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                console.log('Name input changed');
                this.validateForm();
            });
            nameInput.addEventListener('change', () => {
                console.log('Name input changed (change event)');
                this.validateForm();
            });
        }
        
        if (teacherDropdown) {
            teacherDropdown.addEventListener('change', () => {
                console.log('Teacher dropdown changed');
                this.validateForm();
            });
            teacherDropdown.addEventListener('input', () => {
                console.log('Teacher dropdown input changed');
                this.validateForm();
            });
        }
        
        // Also add a general change listener to the form
        const form = this.querySelector('div.flex.flex-col.space-y-4');
        if (form) {
            form.addEventListener('change', () => {
                console.log('Form change detected');
                this.validateForm();
            });
        }
        
        // Add periodic validation as a fallback
        this.validationInterval = setInterval(() => {
            this.validateForm();
        }, 500);
    }

    // Save house with teacher assignments
    async saveHouse() {
        try {
            this.setLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to create houses',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get form data
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const descriptionInput = this.querySelector('ui-textarea[data-field="description"]');
            const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_ids"]');
            
            const name = nameInput ? nameInput.value.trim() : '';
            const description = descriptionInput ? descriptionInput.value.trim() : '';
            const teacherIds = teacherDropdown ? teacherDropdown.value : [];
            
            // Validation
            if (!name || name.length < 2) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'House name must be at least 2 characters',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }
            
            if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select at least one teacher',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }
            
            // Filter out any invalid teacher IDs
            const validTeacherIds = teacherIds.filter(id => id && id !== '' && !isNaN(id));
            
            if (validTeacherIds.length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'No valid teachers selected',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }
            
            // First create the house
            const houseData = {
                name: name,
                description: description || null
            };
            
            console.log('Creating house:', houseData);
            const houseResponse = await api.withToken(token).post('/houses', houseData);
            
            if (!houseResponse.data.success) {
                throw new Error(houseResponse.data.message || 'Failed to create house');
            }
            
            const houseId = houseResponse.data.data.id;
            console.log('House created with ID:', houseId);
            
            // Then assign teachers to the house
            const teacherPromises = validTeacherIds.map(teacherId => {
                const assignmentData = {
                    teacher_id: parseInt(teacherId)
                };
                console.log('Assigning teacher:', assignmentData);
                return api.withToken(token).post(`/houses/${houseId}/assign-teacher`, assignmentData);
            });

            const teacherResponses = await Promise.all(teacherPromises);
            console.log('Teacher assignment responses:', teacherResponses);
            
            // Check if all teacher assignments were successful
            const allTeacherAssignmentsSuccessful = teacherResponses.every(response => response.data.success);
            
            if (allTeacherAssignmentsSuccessful) {
                Toast.show({
                    title: 'Success',
                    message: `House "${name}" created successfully with ${validTeacherIds.length} teacher(s) assigned`,
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('house-saved', {
                    detail: {
                        house: houseResponse.data.data
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                // House was created but some teacher assignments failed
                Toast.show({
                    title: 'Partial Success',
                    message: `House "${name}" created but some teacher assignments failed`,
                    variant: 'warning',
                    duration: 3000
                });
                
                // Still dispatch success event since house was created
                this.close();
                this.dispatchEvent(new CustomEvent('house-saved', {
                    detail: {
                        house: houseResponse.data.data
                    },
                    bubbles: true,
                    composed: true
                }));
            }
        } catch (error) {
            console.error('Error creating house:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create house',
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
        // Clear validation interval
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Add House with Teacher Assignment">
                <div slot="content">
                    <div class="flex flex-col space-y-4">
                        <!-- House Name -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">House Name *</label>
                            <ui-input 
                                data-field="name" 
                                placeholder="Enter house name (e.g., Lion House)"
                                class="w-full">
                            </ui-input>
                        </div>

                        <!-- House Description -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <ui-textarea 
                                data-field="description" 
                                placeholder="Enter house description (optional)"
                                rows="3"
                                class="w-full">
                            </ui-textarea>
                        </div>

                        <!-- Teacher Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teachers *</label>
                            ${this.teachers.length > 0 ? `
                                <ui-search-dropdown 
                                    data-field="teacher_ids" 
                                    placeholder="Search and select multiple teachers..."
                                    multiple
                                    class="w-full">
                                    ${this.teachers.map(teacher => `
                                        <ui-option value="${teacher.id}">${teacher.first_name} ${teacher.last_name} (${teacher.email})</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>

                        <!-- Notes -->
                        <div class="p-3 rounded-md bg-gray-50 border border-gray-100 text-gray-700 text-xs">
                            <ul class="list-disc pl-5 space-y-1">
                                <li>You can reopen this dialog any time to add more teachers to the same house.</li>
                                <li>To remove a teacher from a house, use the view dialog or edit functionality.</li>
                            </ul>
                        </div>

                        <!-- How this works -->
                        <div class="p-3 rounded-md bg-green-50 border border-green-100 text-green-800 text-sm">
                            <div class="flex items-start space-x-2">
                                <i class="fas fa-info-circle mt-0.5"></i>
                                <div>
                                    <p class="font-medium">How this works</p>
                                    <ul class="list-disc pl-5 mt-1 space-y-1">
                                        <li>Enter a unique house name and optional description.</li>
                                        <li>Select one or more teachers from the full list.</li>
                                        <li>It creates the house and assigns all selected teachers to it.</li>
                                        <li>Teachers can be assigned to multiple houses.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Cancel</ui-button>
                    <ui-button color="primary" dialog-action="confirm" disabled>Add House</ui-button>
                </div>
            </ui-dialog>
        `;
        
        // Re-setup event listeners and validate form after render
        setTimeout(() => {
            this.addFormEventListeners();
        }, 0);
    }
}

customElements.define('house-add-dialog', HouseAddDialog);
export default HouseAddDialog;
