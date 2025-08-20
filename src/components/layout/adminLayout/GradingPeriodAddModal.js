import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Textarea.js';
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
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            this.render();
            // Load current academic year and ensure validation is called after render when modal opens
            setTimeout(() => {
                this.loadCurrentAcademicYear();
                this.validateForm();
            }, 100);
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        // Load current academic year when component is connected
        this.loadCurrentAcademicYear();
    }

    setupEventListeners() {
        // Listen for confirm button click (Add Grading Period)
        this.addEventListener('confirm', () => {
            this.saveGradingPeriod();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
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
    }

    // Load and display the current academic year
    async loadCurrentAcademicYear() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/grading-periods/academic-year-switch-date');
            if (response.data.success) {
                const currentYear = response.data.data.current_academic_year;
                const yearDisplay = this.querySelector('#current-academic-year');
                if (yearDisplay) {
                    yearDisplay.textContent = currentYear;
                    yearDisplay.className = 'text-sm text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200';
                }
            }
        } catch (error) {
            console.error('Error loading current academic year:', error);
            const yearDisplay = this.querySelector('#current-academic-year');
            if (yearDisplay) {
                yearDisplay.textContent = 'Error loading';
                yearDisplay.className = 'text-sm text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200';
            }
        }
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
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

            // Get the current academic year from the API
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

            // Fetch current academic year
            const academicYearResponse = await api.withToken(token).get('/grading-periods/academic-year-switch-date');
            if (!academicYearResponse.data.success) {
                Toast.show({
                    title: 'Error',
                    message: 'Failed to get current academic year',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const currentAcademicYear = academicYearResponse.data.data.current_academic_year;

            const gradingPeriodData = {
                name: nameInput ? nameInput.value : '',
                academic_year: currentAcademicYear, // Automatically set from API
                start_date: startDateInput ? startDateInput.value : '',
                end_date: endDateInput ? endDateInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.getValue() : '',
                is_active: statusSwitch ? (statusSwitch.checked ? 1 : 0) : 1
            };

            //console.log('Grading period data being sent:', gradingPeriodData); // Debug log

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

            // Get the auth token
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

            // Show loading state
            const confirmButton = this.querySelector('#save-period-btn');
            if (confirmButton) {
                confirmButton.setAttribute('loading', '');
                confirmButton.textContent = 'Creating...';
            }

            // Send the request
            const response = await api.withToken(token).post('/grading-periods', gradingPeriodData);

            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Grading period created successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the new grading period data
                this.dispatchEvent(new CustomEvent('grading-period-saved', {
                    detail: {
                        gradingPeriod: {
                            id: response.data.data.id,
                            name: gradingPeriodData.name,
                            academic_year: gradingPeriodData.academic_year,
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
            console.error('Error creating grading period:', error);
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
                        <div class="flex items-center space-x-2">
                            <div id="current-academic-year" class="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border">
                                Loading...
                            </div>
                            <span class="text-xs text-gray-500">(Automatically set)</span>
                        </div>
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
        
        // Re-setup event listeners and validate form after render
        setTimeout(() => {
            this.addFormEventListeners();
        }, 0);
    }
}

customElements.define('grading-period-add-modal', GradingPeriodAddModal);
export default GradingPeriodAddModal;
