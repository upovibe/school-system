import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * Academic Year Add Modal Component
 * 
 * A modal component for adding new academic years in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - academic-year-saved: Fired when an academic year is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class AcademicYearAddModal extends HTMLElement {
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

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            // Re-render when modal is opened to ensure content is displayed
            this.render();
        }
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
            const yearCodeInput = this.querySelector('ui-input[data-field="year_code"]');
            const displayNameInput = this.querySelector('ui-input[data-field="display_name"]');
            const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
            const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
            const saveBtn = this.querySelector('#save-academic-year-btn');
            
            const yearCode = yearCodeInput ? String(yearCodeInput.value || '').trim() : '';
            const displayName = displayNameInput ? String(displayNameInput.value || '').trim() : '';
            const startDate = startDateInput ? String(startDateInput.value || '').trim() : '';
            const endDate = endDateInput ? String(endDateInput.value || '').trim() : '';
            
            const isValid = !!yearCode && !!displayName && !!startDate && !!endDate;
            
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
        const yearCodeInput = this.querySelector('ui-input[data-field="year_code"]');
        const displayNameInput = this.querySelector('ui-input[data-field="display_name"]');
        const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
        const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
        const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
        const isCurrentSwitch = this.querySelector('ui-switch[name="is_current"]');
        const saveBtn = this.querySelector('#save-academic-year-btn');

        if (yearCodeInput) {
            yearCodeInput.addEventListener('input', () => this.validateForm());
            yearCodeInput.addEventListener('change', () => this.validateForm());
        }
        if (displayNameInput) {
            displayNameInput.addEventListener('input', () => this.validateForm());
            displayNameInput.addEventListener('change', () => this.validateForm());
        }
        if (startDateInput) {
            startDateInput.addEventListener('input', () => this.validateForm());
            startDateInput.addEventListener('change', () => this.validateForm());
        }
        if (endDateInput) {
            endDateInput.addEventListener('input', () => this.validateForm());
            endDateInput.addEventListener('change', () => this.validateForm());
        }
        if (isActiveSwitch) {
            isActiveSwitch.addEventListener('change', () => this.validateForm());
        }
        if (isCurrentSwitch) {
            isCurrentSwitch.addEventListener('change', () => this.validateForm());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAcademicYear());
        }

        // Initial validation state
        this.validateForm();
    }

    // Save the academic year
    async saveAcademicYear() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const yearCodeInput = this.querySelector('ui-input[data-field="year_code"]');
            const displayNameInput = this.querySelector('ui-input[data-field="display_name"]');
            const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
            const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const isCurrentSwitch = this.querySelector('ui-switch[name="is_current"]');

            const yearCode = yearCodeInput ? String(yearCodeInput.value || '').trim() : '';
            const displayName = displayNameInput ? String(displayNameInput.value || '').trim() : '';
            const startDate = startDateInput ? String(startDateInput.value || '').trim() : '';
            const endDate = endDateInput ? String(endDateInput.value || '').trim() : '';
            const isActive = isActiveSwitch ? isActiveSwitch.hasAttribute('checked') : false;
            const isCurrent = isCurrentSwitch ? isCurrentSwitch.hasAttribute('checked') : false;

            // Validate required fields
            if (!yearCode || !displayName || !startDate || !endDate) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in all required fields',
                    variant: 'error'
                });
                return;
            }

            // Validate date format and logic
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please enter valid dates',
                    variant: 'error'
                });
                return;
            }

            if (startDateObj >= endDateObj) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'End date must be after start date',
                    variant: 'error'
                });
                return;
            }

            // Prepare data for API
            const academicYearData = {
                year_code: yearCode,
                display_name: displayName,
                start_date: startDate,
                end_date: endDate,
                is_active: isActive,
                is_current: isCurrent,
                status: 'active'
            };

            // Show loading state
            const saveBtn = this.querySelector('#save-academic-year-btn');
            if (saveBtn) {
                saveBtn.setAttribute('loading', '');
                saveBtn.textContent = 'Saving...';
            }

            // Call API
            const token = localStorage.getItem('token');
            const response = await api.withToken(token).post('/academic-years', academicYearData);
            
            // Check if academic year was created successfully (following subjects pattern)
            if (response.status === 201 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Academic year created successfully',
                    variant: 'success'
                });

                // Dispatch event with the new academic year data
                this.dispatchEvent(new CustomEvent('academic-year-saved', {
                    detail: { academicYear: response.data.data },
                    bubbles: true
                }));

                // Don't call this.close() - let the parent page handle it
            } else {
                throw new Error(response.data?.message || 'Failed to create academic year');
            }
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: 'Failed to create academic year. Please try again.',
                variant: 'error'
            });
        } finally {
            // Reset button state
            const saveBtn = this.querySelector('#save-academic-year-btn');
            if (saveBtn) {
                saveBtn.removeAttribute('loading');
                saveBtn.textContent = 'Save Academic Year';
            }
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Add New Academic Year</div>
                <form id="academic-year-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Year Code <span class="text-red-500">*</span></label>
                        <ui-input
                            data-field="year_code"
                            type="text"
                            placeholder="e.g., 2024-2025"
                            class="w-full">
                        </ui-input>
                        <p class="text-xs text-gray-500 mt-1">Format: YYYY-YYYY (e.g., 2024-2025)</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Display Name <span class="text-red-500">*</span></label>
                        <ui-input
                            data-field="display_name"
                            type="text"
                            placeholder="e.g., Academic Year 2024-2025"
                            class="w-full">
                        </ui-input>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Start Date <span class="text-red-500">*</span></label>
                        <ui-input
                            data-field="start_date"
                            type="date"
                            class="w-full">
                        </ui-input>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">End Date <span class="text-red-500">*</span></label>
                        <ui-input
                            data-field="end_date"
                            type="date"
                            class="w-full">
                        </ui-input>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Active Status</label>
                        <ui-switch name="is_active" checked class="w-full">
                            <span slot="label">Can be used for current operations</span>
                        </ui-switch>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Current Year</label>
                        <ui-switch name="is_current" class="w-full">
                            <span slot="label">Mark as the current academic year</span>
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
                                <li><strong>Year Code</strong>: unique identifier in YYYY-YYYY format (e.g., 2024-2025)</li>
                                <li><strong>Display Name</strong>: human-readable name for the academic year</li>
                                <li><strong>Start/End Dates</strong>: actual school calendar period</li>
                                <li><strong>Active Status</strong>: can be used for classes, grading periods, and records</li>
                                <li><strong>Current Year</strong>: only one academic year can be marked as current</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div slot="footer" class="flex items-center justify-end gap-2">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    <ui-button id="save-academic-year-btn" color="primary" disabled>Save</ui-button>
                </div>
            </ui-modal>
        `;

        // Attach form events and initialize validation
        this.addFormEventListeners();
    }
}

customElements.define('academic-year-add-modal', AcademicYearAddModal);
export default AcademicYearAddModal;
