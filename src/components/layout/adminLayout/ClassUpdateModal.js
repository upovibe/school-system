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
        this.addFormEventListeners();
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

    // Wire events for live validation and update
    addFormEventListeners() {
        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const sectionInput = this.querySelector('ui-input[data-field="section"]');
        const updateBtn = this.querySelector('#update-class-btn');

        if (nameInput) {
            nameInput.addEventListener('input', () => this.validateForm());
            nameInput.addEventListener('change', () => this.validateForm());
        }
        if (sectionInput) {
            sectionInput.addEventListener('input', () => this.validateForm());
            sectionInput.addEventListener('change', () => this.validateForm());
        }
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateClass());
        }

        // Initial validation state
        this.validateForm();
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
        if (academicYearInput) {
            academicYearInput.value = this.classData.academic_year || this.computeAcademicYear();
            academicYearInput.setAttribute('readonly', '');
        }
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
                academic_year: academicYearInput ? (academicYearInput.value || this.computeAcademicYear()) : this.computeAcademicYear(),
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

            // Academic year is read-only and server-enforced; no validation needed

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

    // Validate form and toggle Update button
    validateForm() {
        try {
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const sectionInput = this.querySelector('ui-input[data-field="section"]');
            const updateBtn = this.querySelector('#update-class-btn');
            const name = nameInput ? String(nameInput.value || '').trim() : '';
            const section = sectionInput ? String(sectionInput.value || '').trim() : '';
            
            // Check if section contains only letters (no numbers)
            const sectionValid = /^[A-Za-z]+$/.test(section);
            
            const isValid = !!name && !!section && sectionValid;
            
            console.log('🔍 Validation Debug:', { name, section, sectionValid, isValid, updateBtn: !!updateBtn });
            
            if (updateBtn) {
                if (isValid) {
                    updateBtn.removeAttribute('disabled');
                    console.log('✅ Button enabled');
                } else {
                    updateBtn.setAttribute('disabled', '');
                    console.log('❌ Button disabled');
                }
            } else {
                console.log('⚠️ Update button not found!');
            }
            
            // Show/hide section error message
            const sectionError = this.querySelector('#section-error');
            if (sectionError) {
                if (section && !sectionValid) {
                    sectionError.textContent = 'Section must contain only letters (A-Z, a-z)';
                    sectionError.classList.remove('hidden');
                } else {
                    sectionError.classList.add('hidden');
                }
            }
        } catch (error) { 
            console.error('❌ Validation error:', error);
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
                            placeholder="Enter section letter only (e.g., A, B, C)"
                            class="w-full">
                        </ui-input>
                        <div id="section-error" class="hidden text-red-500 text-sm mt-1"></div>
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
                
                <!-- How this works (bottom) -->
                <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-info-circle mt-0.5"></i>
                        <div>
                            <p class="font-medium">How this works</p>
                            <ul class="list-disc pl-5 mt-1 space-y-1">
                                <li><strong>Class Name</strong>: short identifier for the class (e.g., P1, JHS1).</li>
                                <li><strong>Section</strong>: letter only to distinguish parallel classes (e.g., A, B, C - no numbers allowed).</li>
                                <li><strong>Academic Year</strong>: used for reporting and filtering.</li>
                                <li><strong>Capacity</strong>: optional; defaults to 30.</li>
                                <li><strong>Status</strong>: Active classes are available for assignments.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div slot="footer" class="flex items-center justify-end gap-2">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    <ui-button id="update-class-btn" color="primary" disabled>Update</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('class-update-modal', ClassUpdateModal);
export default ClassUpdateModal; 