import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import api from '@/services/api.js';

/**
 * Class Update Modal Component
 * 
 * A modal component for updating existing classes in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - class-updated: Fired when a class is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class ClassUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.classData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update Class)
        this.addEventListener('confirm', () => {
            this.updateClass();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set class data for editing
    setClassData(classItem) {
        this.classData = classItem;
        this.populateForm();
    }

    // Populate form with existing class data
    populateForm() {
        if (!this.classData) return;

        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const sectionInput = this.querySelector('ui-input[data-field="section"]');
        const academicYearInput = this.querySelector('ui-input[data-field="academic_year"]');
        const capacityInput = this.querySelector('ui-input[data-field="capacity"]');
        const statusSwitch = this.querySelector('ui-switch[name="status"]');

        if (nameInput) nameInput.value = this.classData.name || '';
        if (sectionInput) sectionInput.value = this.classData.section || '';
        if (academicYearInput) academicYearInput.value = this.classData.academic_year || '';
        if (capacityInput) capacityInput.value = this.classData.capacity || 30;
        if (statusSwitch) {
            if (this.classData.status === 'active') {
                statusSwitch.setAttribute('checked', '');
            } else {
                statusSwitch.removeAttribute('checked');
            }
        }
    }

    // Update the class
    async updateClass() {
        try {
            if (!this.classData) {
                Toast.show({
                    title: 'Error',
                    message: 'No class data available for update',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get form data using the data-field attributes for reliable selection
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const sectionInput = this.querySelector('ui-input[data-field="section"]');
            const academicYearInput = this.querySelector('ui-input[data-field="academic_year"]');
            const capacityInput = this.querySelector('ui-input[data-field="capacity"]');
            const statusSwitch = this.querySelector('ui-switch[name="status"]');

            const classData = {
                name: nameInput ? nameInput.value : '',
                section: sectionInput ? sectionInput.value : '',
                academic_year: academicYearInput ? academicYearInput.value : '',
                capacity: capacityInput ? parseInt(capacityInput.value) || 30 : 30,
                status: statusSwitch ? (statusSwitch.checked ? 'active' : 'inactive') : 'active'
            };

            console.log('Class update data being sent:', classData); // Debug log

            // Validate required fields
            if (!classData.name) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the class name',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!classData.section) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the class section',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!classData.academic_year) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the academic year',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update classes',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Update class
            const response = await api.withToken(token).put(`/classes/${this.classData.id}`, classData);
            
            // Check if class was updated successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Class updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Construct the updated class data
                const updatedClass = {
                    ...this.classData,
                    name: classData.name,
                    section: classData.section,
                    academic_year: classData.academic_year,
                    capacity: classData.capacity,
                    status: classData.status,
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('class-updated', {
                    detail: { class: updatedClass },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to update class');
            }

        } catch (error) {
            console.error('❌ Error updating class:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update class',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Update Class</div>
                <form id="class-update-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                        <ui-input 
                            data-field="name"
                            type="text" 
                            placeholder="Enter class name (e.g., P1, JHS1)"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <ui-input 
                            data-field="section"
                            type="text" 
                            placeholder="Enter section (e.g., A, B, C)"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        <ui-input 
                            data-field="academic_year"
                            type="text" 
                            placeholder="Enter academic year (e.g., 2024-2025)"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                        <ui-input 
                            data-field="capacity"
                            type="number" 
                            placeholder="Enter class capacity"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch 
                            name="status"
                            class="w-full">
                            <span slot="label">Active</span>
                        </ui-switch>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('class-update-modal', ClassUpdateModal);
export default ClassUpdateModal; 