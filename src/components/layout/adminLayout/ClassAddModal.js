import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import api from '@/services/api.js';

/**
 * Class Add Modal Component
 * 
 * A modal component for adding new classes in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - class-saved: Fired when a class is successfully created
 * - modal-closed: Fired when modal is closed
 */
class ClassAddModal extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Add Class)
        this.addEventListener('confirm', () => {
            this.saveClass();
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

    // Save the new class
    async saveClass() {
        try {
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

            console.log('Class data being sent:', classData); // Debug log

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
                    message: 'Please log in to create classes',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Create class
            const response = await api.withToken(token).post('/classes', classData);
            
            // Check if class was created successfully
            if (response.status === 201 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Class created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Construct the new class data from response
                const newClass = {
                    id: response.data.data.id,
                    name: classData.name,
                    section: classData.section,
                    academic_year: classData.academic_year,
                    capacity: classData.capacity,
                    status: classData.status,
                    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('class-saved', {
                    detail: { class: newClass },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to create class');
            }

        } catch (error) {
            console.error('❌ Error saving class:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create class',
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
                <div slot="title">Add New Class</div>
                <form id="class-form" class="space-y-4">
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
                            placeholder="Enter class capacity (default: 30)"
                            value="30"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch 
                            name="status"
                            checked
                            class="w-full">
                            <span slot="label">Active</span>
                        </ui-switch>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('class-add-modal', ClassAddModal);
export default ClassAddModal; 