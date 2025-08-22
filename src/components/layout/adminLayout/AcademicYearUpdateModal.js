import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * Academic Year Update Modal Component
 * 
 * A modal component for updating existing academic years in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - academic-year-updated: Fired when an academic year is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class AcademicYearUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.academicYearData = null;
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

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set academic year data for editing
    setAcademicYearData(academicYear) {
        this.academicYearData = academicYear;
        this.populateForm();
    }

    // Populate form with existing data
    populateForm() {
        if (!this.academicYearData) return;

        const yearCodeInput = this.querySelector('ui-input[data-field="year_code"]');
        const displayNameInput = this.querySelector('ui-input[data-field="display_name"]');
        const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
        const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
        const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
        const isCurrentSwitch = this.querySelector('ui-switch[name="is_current"]');

        if (yearCodeInput) yearCodeInput.value = this.academicYearData.year_code || '';
        if (displayNameInput) displayNameInput.value = this.academicYearData.display_name || '';
        if (startDateInput) startDateInput.value = this.academicYearData.start_date || '';
        if (endDateInput) endDateInput.value = this.academicYearData.end_date || '';
        if (isActiveSwitch) isActiveSwitch.checked = this.academicYearData.is_active || false;
        if (isCurrentSwitch) isCurrentSwitch.checked = this.academicYearData.is_current || false;

        // Validate form after populating
        this.validateForm();
    }

    // Validate form and toggle Save button
    validateForm() {
        try {
            const yearCodeInput = this.querySelector('ui-input[data-field="year_code"]');
            const displayNameInput = this.querySelector('ui-input[data-field="display_name"]');
            const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
            const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
            const saveBtn = this.querySelector('#update-academic-year-btn');
            
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
        const saveBtn = this.querySelector('#update-academic-year-btn');

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
            saveBtn.addEventListener('click', () => this.updateAcademicYear());
        }

        // Initial validation state
        this.validateForm();
    }

    // Update the academic year
    async updateAcademicYear() {
        try {
            if (!this.academicYearData || !this.academicYearData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No academic year data to update',
                    variant: 'error'
                });
                return;
            }

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
            const isActive = isActiveSwitch ? isActiveSwitch.checked : false;
            const isCurrent = isCurrentSwitch ? isCurrentSwitch.checked : false;

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
            const updateData = {
                year_code: yearCode,
                display_name: displayName,
                start_date: startDate,
                end_date: endDate,
                is_active: isActive,
                is_current: isCurrent,
                status: 'active'
            };

            // Show loading state
            const saveBtn = this.querySelector('#update-academic-year-btn');
            if (saveBtn) {
                saveBtn.setAttribute('loading', '');
                saveBtn.textContent = 'Updating...';
            }

            // Call API
            const token = localStorage.getItem('token');
            const response = await api.withToken(token).put(`/academic-years/${this.academicYearData.id}`, updateData);

            if (response.data && response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Academic year updated successfully',
                    variant: 'success'
                });

                // Dispatch event with the updated academic year data
                this.dispatchEvent(new CustomEvent('academic-year-updated', {
                    detail: { academicYear: response.data.data },
                    bubbles: true
                }));

                // Close modal
                this.close();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data?.message || 'Failed to update academic year',
                    variant: 'error'
                });
            }
        } catch (error) {
            console.error('Error updating academic year:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to update academic year. Please try again.',
                variant: 'error'
            });
        } finally {
            // Reset button state
            const saveBtn = this.querySelector('#update-academic-year-btn');
            if (saveBtn) {
                saveBtn.removeAttribute('loading');
                saveBtn.textContent = 'Update Academic Year';
            }
        }
    }

    render() {
        return `
            <ui-modal 
                title="Update Academic Year"
                size="lg"
                ${this.hasAttribute('open') ? 'open' : ''}
            >
                <div slot="content" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Year Code -->
                        <div class="space-y-2">
                            <label for="year_code" class="block text-sm font-medium text-gray-700">
                                Year Code <span class="text-red-500">*</span>
                            </label>
                            <ui-input
                                id="year_code"
                                data-field="year_code"
                                type="text"
                                placeholder="e.g., 2024-2025"
                                class="w-full"
                                required
                            ></ui-input>
                            <p class="text-xs text-gray-500">Format: YYYY-YYYY (e.g., 2024-2025)</p>
                        </div>

                        <!-- Display Name -->
                        <div class="space-y-2">
                            <label for="display_name" class="block text-sm font-medium text-gray-700">
                                Display Name <span class="text-red-500">*</span>
                            </label>
                            <ui-input
                                id="display_name"
                                data-field="display_name"
                                type="text"
                                placeholder="e.g., Academic Year 2024-2025"
                                class="w-full"
                                required
                            ></ui-input>
                        </div>

                        <!-- Start Date -->
                        <div class="space-y-2">
                            <label for="start_date" class="block text-sm font-medium text-gray-700">
                                Start Date <span class="text-red-500">*</span>
                            </label>
                            <ui-input
                                id="start_date"
                                data-field="start_date"
                                type="date"
                                class="w-full"
                                required
                            ></ui-input>
                        </div>

                        <!-- End Date -->
                        <div class="space-y-2">
                            <label for="end_date" class="block text-sm font-medium text-gray-700">
                                End Date <span class="text-red-500">*</span>
                            </label>
                            <ui-input
                                id="end_date"
                                data-field="end_date"
                                type="date"
                                class="w-full"
                                required
                            ></ui-input>
                        </div>
                    </div>

                    <!-- Status Switches -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">Active Status</label>
                            <ui-switch name="is_active"></ui-switch>
                            <p class="text-xs text-gray-500">Can be used for current operations</p>
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">Current Year</label>
                            <ui-switch name="is_current"></ui-switch>
                            <p class="text-xs text-gray-500">Mark as the current academic year</p>
                        </div>
                    </div>

                    <!-- Help Text -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-info-circle text-blue-400"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-blue-800">Important Notes</h3>
                                <div class="mt-2 text-sm text-blue-700">
                                    <ul class="list-disc pl-5 space-y-1">
                                        <li>Only one academic year can be marked as current</li>
                                        <li>Active years can be used for classes, grading periods, and student records</li>
                                        <li>Dates should represent the actual school calendar period</li>
                                        <li>Changing dates may affect existing classes and records</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button variant="secondary" @click="${() => this.close()}">
                        Cancel
                    </ui-button>
                    <ui-button 
                        id="update-academic-year-btn"
                        variant="primary"
                        disabled
                    >
                        Update Academic Year
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            this.open();
            // Add event listeners after modal is opened
            setTimeout(() => {
                this.addFormEventListeners();
            }, 100);
        } else if (name === 'open' && newValue === null) {
            this.close();
        }
    }
}

customElements.define('academic-year-update-modal', AcademicYearUpdateModal);
export default AcademicYearUpdateModal;
