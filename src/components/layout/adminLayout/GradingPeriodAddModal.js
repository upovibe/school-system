import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Button.js';
import '@/components/ui/Dropdown.js';
import api from '@/services/api.js';

/**
 * Grading Period Add Modal Component
 * 
 * A modal component for adding new grading periods in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - grading-period-saved: Fired when a grading period is successfully created
 * - modal-closed: Fired when modal is closed
 */
class GradingPeriodAddModal extends HTMLElement {
    constructor() {
        super();
        this.eventListenersAttached = false;
    }

    static get observedAttributes() {
        return ['open', 'academic-years'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            this.render();
            // Ensure validation is called after render when modal opens
            setTimeout(() => {
                this.validateForm();
            }, 100);
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for modal actions
        this.addEventListener('modal-action', (event) => {
            const action = event.detail?.action;
            if (action === 'confirm') {
                this.saveGradingPeriod();
            } else if (action === 'cancel') {
                this.close();
            }
        });
        
        // Add form validation listeners after render
        setTimeout(() => {
            this.addFormEventListeners();
        }, 0);
    }

    // Validate form and toggle Confirm button
    validateForm() {
        try {
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
            const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
            
            const name = nameInput ? String(nameInput.value || '').trim() : '';
            const startDate = startDateInput ? startDateInput.value : '';
            const endDate = endDateInput ? endDateInput.value : '';
            
            const isValid = !!name && !!startDate && !!endDate;
            
            // Get the custom confirm button by ID
            const confirmBtn = this.querySelector('#save-period-btn');
            if (confirmBtn) {
                if (isValid) {
                    confirmBtn.removeAttribute('disabled');
                } else {
                    confirmBtn.setAttribute('disabled', '');
                }
            }
        } catch (_) { /* noop */ }
    }

    // Wire events for live validation
    addFormEventListeners() {
        // Prevent duplicate event listeners
        if (this.eventListenersAttached) {
            return;
        }
        
        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
        const endDateInput = this.querySelector('ui-input[data-field="end_date"]');

        if (nameInput) {
            nameInput.addEventListener('input', () => this.validateForm());
            nameInput.addEventListener('change', () => this.validateForm());
        }
        if (startDateInput) {
            startDateInput.addEventListener('change', () => this.validateForm());
        }
        if (endDateInput) {
            endDateInput.addEventListener('change', () => this.validateForm());
        }

        // Add click event for the custom save button
        const saveBtn = this.querySelector('#save-period-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveGradingPeriod());
        }

        // Initial validation state
        this.validateForm();
        
        // Mark as attached
        this.eventListenersAttached = true;
    }

    // Get academic years data from attribute
    getAcademicYears() {
        try {
            const academicYearsAttr = this.getAttribute('academic-years');
            return academicYearsAttr ? JSON.parse(academicYearsAttr) : [];
        } catch (error) {
            console.error('Error parsing academic years:', error);
            return [];
        }
    }

    // Get current academic year ID from loaded data
    getCurrentAcademicYearId() {
        const academicYears = this.getAcademicYears();
        const currentYear = academicYears.find(ay => ay.is_current === 1);
        return currentYear ? currentYear.id : null;
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
    }

    // Save the new grading period
    async saveGradingPeriod() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
            const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
            const academicYearDropdown = this.querySelector('ui-dropdown[data-field="academic_year_id"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

            // Get the auth token (only once)
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to perform this action',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get academic year ID - handle both readonly input and dropdown cases
            let academicYearId = this.getCurrentAcademicYearId();
            if (academicYearDropdown) {
                academicYearId = parseInt(academicYearDropdown.value);
            } else {
                // If no dropdown (readonly case), get from current academic years
                const academicYears = this.getAcademicYears();
                if (academicYears.length === 1) {
                    academicYearId = academicYears[0].id;
                }
            }

            const gradingPeriodData = {
                name: nameInput ? nameInput.value : '',
                academic_year_id: academicYearId,
                start_date: startDateInput ? startDateInput.value : '',
                end_date: endDateInput ? endDateInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.getValue() : '',
                is_active: statusSwitch ? (statusSwitch.checked ? 1 : 0) : 1
            };

            console.log('📝 Sending data:', gradingPeriodData);

            // Validate required fields
            if (!gradingPeriodData.name) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the period name',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!gradingPeriodData.start_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the start date',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!gradingPeriodData.end_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the end date',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Validate date range
            const startDate = new Date(gradingPeriodData.start_date);
            const endDate = new Date(gradingPeriodData.end_date);
            
            if (startDate >= endDate) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'End date must be after start date',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Show loading state
            const confirmButton = this.querySelector('#save-period-btn');
            if (confirmButton) {
                confirmButton.setAttribute('loading', '');
                confirmButton.textContent = 'Creating...';
            }

            console.log('🌐 Making API call to create grading period...');
            // Send the request
            const response = await api.withToken(token).post('/grading-periods', gradingPeriodData);
            console.log('✅ API response received:', response.data);

            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Grading period created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Get the current academic year display name
                const currentAcademicYear = this.getAcademicYears()[0];
                const academicYearDisplay = currentAcademicYear ? 
                    `${currentAcademicYear.year_code}${currentAcademicYear.display_name ? ` (${currentAcademicYear.display_name})` : ''}` : 
                    'Unknown';

                // Dispatch event with the new grading period data
                this.dispatchEvent(new CustomEvent('grading-period-saved', {
                    detail: {
                        gradingPeriod: {
                            id: response.data.data.id,
                            name: gradingPeriodData.name,
                            academic_year: academicYearDisplay,
                            academic_year_id: gradingPeriodData.academic_year_id,
                            start_date: gradingPeriodData.start_date,
                            end_date: gradingPeriodData.end_date,
                            description: gradingPeriodData.description,
                            is_active: gradingPeriodData.is_active,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                    },
                    bubbles: true,
                    composed: true
                }));

                // Reset form
                this.resetForm();
                this.close();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to create grading period',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: 'Failed to create grading period. Please try again.',
                variant: 'error',
                duration: 3000
            });
        } finally {
            // Reset loading state
            const confirmButton = this.querySelector('#save-period-btn');
            if (confirmButton) {
                confirmButton.removeAttribute('loading');
                confirmButton.textContent = 'Create Period';
            }
        }
    }

    resetForm() {
        const inputs = this.querySelectorAll('ui-input, ui-textarea');
        inputs.forEach(input => {
            input.value = '';
        });

        const switchElement = this.querySelector('ui-switch[name="is_active"]');
        if (switchElement) {
            switchElement.checked = true;
        }
        
        // Re-validate after reset
        this.validateForm();
    }

    render() {
        const academicYears = this.getAcademicYears();
        const currentYearId = this.getCurrentAcademicYearId();
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Add New Grading Period</div>
                <form id="grading-period-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Period Name</label>
                        <ui-input 
                            data-field="name"
                            type="text" 
                            placeholder="e.g., First Term, Second Term, Final Term"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        ${academicYears.length === 1 ? 
                            // If only one academic year (current), show as readonly input
                            `<ui-input 
                                data-field="academic_year_id"
                                type="text" 
                                value="${academicYears[0].year_code}${academicYears[0].display_name ? ` (${academicYears[0].display_name})` : ''}"
                                readonly
                                class="w-full">
                            </ui-input>` :
                            // If multiple academic years, show as dropdown
                            `<ui-dropdown data-field="academic_year_id" value="${currentYearId || ''}">
                                ${academicYears.map(ay => `
                                    <option value="${ay.id}" ${ay.id == currentYearId ? 'selected' : ''}>
                                        ${ay.year_code}${ay.display_name ? ` (${ay.display_name})` : ''}
                                    </option>
                                `).join('')}
                            </ui-dropdown>`
                        }
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <ui-input 
                            data-field="start_date"
                            type="date" 
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <ui-input 
                            data-field="end_date"
                            type="date" 
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea 
                            data-field="description"
                            placeholder="Optional description for this grading period..."
                            rows="3"
                            class="w-full">
                        </ui-textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch 
                            name="is_active"
                            checked
                            class="w-full">
                            <span slot="label">Active</span>
                        </ui-switch>
                    </div>
                </form>
                <div slot="footer" class="flex items-center justify-end gap-2">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    <ui-button id="save-period-btn" color="primary" disabled>Create Period</ui-button>
                </div>
            </ui-modal>
        `;
        
        // Event listeners are already set up in connectedCallback
    }
}

customElements.define('grading-period-add-modal', GradingPeriodAddModal);
export default GradingPeriodAddModal;
