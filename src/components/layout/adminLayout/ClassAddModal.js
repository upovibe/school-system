import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Button.js';
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
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    // Compute academic year on client (display-only)
    computeAcademicYear() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-12
        if (month >= 9) {
            return `${year}-${year + 1}`;
        }
        return `${year - 1}-${year}`;
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Validate form and toggle Save button
    validateForm() {
        try {
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const sectionInput = this.querySelector('ui-input[data-field="section"]');
            const saveBtn = this.querySelector('#save-class-btn');
            const name = nameInput ? String(nameInput.value || '').trim() : '';
            const section = sectionInput ? String(sectionInput.value || '').trim() : '';
            const isValid = !!name && !!section;
            if (saveBtn) {
                if (isValid) {
                    saveBtn.removeAttribute('disabled');
                } else {
                    saveBtn.setAttribute('disabled', '');
                }
            }
        } catch (_) { /* noop */ }
    }

    // Wire events for live validation and save
    addFormEventListeners() {
        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const sectionInput = this.querySelector('ui-input[data-field="section"]');
        const saveBtn = this.querySelector('#save-class-btn');

        if (nameInput) {
            nameInput.addEventListener('input', () => this.validateForm());
            nameInput.addEventListener('change', () => this.validateForm());
        }
        if (sectionInput) {
            sectionInput.addEventListener('input', () => this.validateForm());
            sectionInput.addEventListener('change', () => this.validateForm());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveClass());
        }

        // Initial validation state
        this.validateForm();
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
                academic_year: academicYearInput ? (academicYearInput.value || this.computeAcademicYear()) : this.computeAcademicYear(),
                capacity: capacityInput ? parseInt(capacityInput.value) || 30 : 30,
                status: statusSwitch ? (statusSwitch.checked ? 'active' : 'inactive') : 'active'
            };

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
        const computedYear = this.computeAcademicYear();
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
                            placeholder="Academic year is auto-computed"
                            value="${computedYear}"
                            readonly
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

                <!-- How this works (bottom) -->
                <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-info-circle mt-0.5"></i>
                        <div>
                            <p class="font-medium">How this works</p>
                            <ul class="list-disc pl-5 mt-1 space-y-1">
                                <li><strong>Class Name</strong>: short identifier for the class (e.g., P1, JHS1).</li>
                                <li><strong>Section</strong>: letter/number to distinguish parallel classes (e.g., A, B).</li>
                                <li><strong>Academic Year</strong>: used for reporting and filtering.</li>
                                <li><strong>Capacity</strong>: optional; defaults to 30.</li>
                                <li><strong>Status</strong>: Active classes are available for assignments.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div slot="footer" class="flex items-center justify-end gap-2">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    <ui-button id="save-class-btn" color="primary" disabled>Save</ui-button>
                </div>
            </ui-modal>
        `;

        // Attach form events and initialize validation
        this.addFormEventListeners();
    }
}

customElements.define('class-add-modal', ClassAddModal);
export default ClassAddModal; 