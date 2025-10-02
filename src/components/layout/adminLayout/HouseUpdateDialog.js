import '@/components/ui/Dialog.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * House Update Dialog Component
 * 
 * Dialog for updating existing houses and their teacher assignments
 */
class HouseUpdateDialog extends HTMLElement {
    constructor() {
        super();
        this.teachers = [];
        this.houseData = null;
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
                this.teachers = response.data.data;
                this.render();
            }
        } catch (error) {
            // Silent error handling
        }
    }

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('confirm', this.updateHouse.bind(this));
        
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
                name = nameInput.value || 
                       nameInput.getAttribute('value') || 
                       nameInput.shadowRoot?.querySelector('input')?.value || 
                       '';
            }
            
            if (teacherDropdown) {
                const value = teacherDropdown.value || 
                             teacherDropdown.getAttribute('value') || 
                             teacherDropdown.selectedValues || 
                             [];
                teacherIds = Array.isArray(value) ? value : [];
            }
            
            const isValid = !!name && name.trim().length >= 2 && 
                           Array.isArray(teacherIds) && teacherIds.length > 0;
            
            // Get the confirm button by dialog-action attribute
            const confirmBtn = this.querySelector('ui-button[dialog-action="confirm"]');
            if (confirmBtn) {
                if (isValid) {
                    confirmBtn.removeAttribute('disabled');
                } else {
                    confirmBtn.setAttribute('disabled', '');
                }
            }
        } catch (error) {
            // Silent error handling for validation
        }
    }

    addFormEventListeners() {
        // Add event listeners for form validation
        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_ids"]');
        
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                this.validateForm();
            });
            nameInput.addEventListener('change', () => {
                this.validateForm();
            });
        }
        
        if (teacherDropdown) {
            teacherDropdown.addEventListener('change', () => {
                this.validateForm();
            });
            teacherDropdown.addEventListener('input', () => {
                this.validateForm();
            });
        }
        
        // Also add a general change listener to the form
        const form = this.querySelector('div.flex.flex-col.space-y-4');
        if (form) {
            form.addEventListener('change', () => {
                this.validateForm();
            });
        }
        
        // Add periodic validation as a fallback
        this.validationInterval = setInterval(() => {
            this.validateForm();
        }, 500);
    }

    // Set house data for editing
    setHouseData(house) {
        this.houseData = house;
        this.open(); // Ensure dialog is open
        this.render();
        // Wait for DOM and teachers to be ready before populating
        setTimeout(() => {
            this.populateForm();
        }, 300);
    }

    // Populate form with existing house data
    populateForm() {
        if (!this.houseData) return;

        // Set house name
        const nameInput = this.querySelector('ui-input[data-field="name"]');
        if (nameInput) {
            nameInput.value = this.houseData.name || '';
            nameInput.setAttribute('value', this.houseData.name || '');
        }

        // Set house description
        const descriptionInput = this.querySelector('ui-textarea[data-field="description"]');
        if (descriptionInput) {
            descriptionInput.value = this.houseData.description || '';
            descriptionInput.setAttribute('value', this.houseData.description || '');
        }

        // Teacher dropdown is now set directly in the HTML template
        // Just trigger validation
        const teacherDropdown = this.querySelector('ui-search-dropdown[data-field="teacher_ids"]');
        if (teacherDropdown) {
            // Trigger change event to ensure validation runs
            setTimeout(() => {
                teacherDropdown.dispatchEvent(new Event('change', { bubbles: true }));
            }, 100);
        }

        // Validate form after populating
        setTimeout(() => {
            this.validateForm();
        }, 100);
    }

    // Update house with teacher assignments
    async updateHouse() {
        try {
            this.setLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update houses',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!this.houseData || !this.houseData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No house data available for update',
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
            
            // First update the house basic information
            const houseData = {
                name: name,
                description: description || null
            };
            
            const houseResponse = await api.withToken(token).put(`/houses/${this.houseData.id}`, houseData);
            
            if (!houseResponse.data.success) {
                throw new Error(houseResponse.data.message || 'Failed to update house');
            }
            
            // Get current teachers assigned to this house
            const currentTeachersResponse = await api.withToken(token).get(`/houses/${this.houseData.id}/teachers`);
            const currentTeacherIds = currentTeachersResponse.data.success ? 
                currentTeachersResponse.data.data.map(teacher => teacher.id) : [];
            
            // Determine which teachers to add and remove
            const teachersToAdd = validTeacherIds.filter(id => !currentTeacherIds.includes(parseInt(id)));
            const teachersToRemove = currentTeacherIds.filter(id => !validTeacherIds.includes(id.toString()));
            
            // Remove teachers that are no longer selected
            const removePromises = teachersToRemove.map(teacherId => {
                return api.withToken(token).post(`/houses/${this.houseData.id}/remove-teacher`, {
                    teacher_id: teacherId
                });
            });

            // Add new teachers
            const addPromises = teachersToAdd.map(teacherId => {
                return api.withToken(token).post(`/houses/${this.houseData.id}/assign-teacher`, {
                    teacher_id: parseInt(teacherId)
                });
            });

            // Execute all teacher assignment changes
            const allPromises = [...removePromises, ...addPromises];
            if (allPromises.length > 0) {
                await Promise.all(allPromises);
            }
            
            Toast.show({
                title: 'Success',
                message: `House "${name}" updated successfully`,
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('house-updated', {
                detail: {
                    house: houseResponse.data.data
                },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update house',
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
        const houseName = this.houseData ? this.houseData.name : 'House';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Edit House: ${houseName}">
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
                                    class="w-full"
                                    ${this.houseData && this.houseData.teachers ? `value='${JSON.stringify(this.houseData.teachers.map(t => t.id))}'` : ''}>
                                    ${this.teachers.map(teacher => `
                                        <ui-option value="${teacher.id}">${teacher.first_name} ${teacher.last_name}</ui-option>
                                    `).join('')}
                                </ui-search-dropdown>
                            ` : `
                                <div class="w-full h-8 bg-gray-200 rounded mr-2"></div>
                            `}
                        </div>

                        <!-- Notes -->
                        <div class="p-3 rounded-md bg-gray-50 border border-gray-100 text-gray-700 text-xs">
                            <ul class="list-disc pl-5 space-y-1">
                                <li>You can modify the house name and description.</li>
                                <li>Add or remove teachers by selecting/deselecting them from the list.</li>
                                <li>Changes will be saved when you click "Update House".</li>
                            </ul>
                        </div>

                        <!-- How this works -->
                        <div class="p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                            <div class="flex items-start space-x-2">
                                <i class="fas fa-info-circle mt-0.5"></i>
                                <div>
                                    <p class="font-medium">How this works</p>
                                    <ul class="list-disc pl-5 mt-1 space-y-1">
                                        <li>Modify the house name and description as needed.</li>
                                        <li>Select/deselect teachers to update assignments.</li>
                                        <li>Teachers not selected will be removed from this house.</li>
                                        <li>New teachers selected will be added to this house.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Cancel</ui-button>
                    <ui-button color="primary" dialog-action="confirm" disabled>Update House</ui-button>
                </div>
            </ui-dialog>
        `;
        
        // Re-setup event listeners and validate form after render
        setTimeout(() => {
            this.addFormEventListeners();
            this.populateForm();
        }, 0);
    }
}

customElements.define('house-update-dialog', HouseUpdateDialog);
export default HouseUpdateDialog;
