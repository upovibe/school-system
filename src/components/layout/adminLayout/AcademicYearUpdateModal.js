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
        
        // Listen for confirm button click (modal's default action)
        this.addEventListener('confirm', () => {
            this.updateAcademicYear();
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            // Re-render when modal is opened to ensure content is displayed
            this.render();
            // Always try to populate form after rendering if we have data
            setTimeout(() => {
                if (this.academicYearData) {
                    this.populateForm();
                }
            }, 0);
        }
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set academic year data for editing
    setAcademicYearData(academicYear) {
        // console.log('setAcademicYearData called with:', academicYear);
        this.academicYearData = academicYear;
        // Always try to populate form after a short delay
        setTimeout(() => {
            if (this.academicYearData && this.hasAttribute('open')) {
                this.populateForm();
            }
        }, 0);
    }

    // Populate form with existing data
    populateForm() {
        // console.log('populateForm called, academicYearData:', this.academicYearData);
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
        
        // Set switch states using setAttribute/removeAttribute
        if (isActiveSwitch) {
            if (this.academicYearData.is_active) {
                isActiveSwitch.setAttribute('checked', '');
            } else {
                isActiveSwitch.removeAttribute('checked');
            }
        }
        
        if (isCurrentSwitch) {
            if (this.academicYearData.is_current) {
                isCurrentSwitch.setAttribute('checked', '');
            } else {
                isCurrentSwitch.removeAttribute('checked');
            }
        }

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
            
            const yearCode = yearCodeInput ? String(yearCodeInput.value || '').trim() : '';
            const displayName = displayNameInput ? String(displayNameInput.value || '').trim() : '';
            const startDate = startDateInput ? String(startDateInput.value || '').trim() : '';
            const endDate = endDateInput ? String(endDateInput.value || '').trim() : '';
            
            // Validate year code format (YYYY-YYYY or YYYY/YYYY)
            const yearCodePattern = /^\d{4}[-/]\d{4}$/;
            const isYearCodeValid = yearCodePattern.test(yearCode);
            
            const isValid = !!yearCode && !!displayName && !!startDate && !!endDate && isYearCodeValid;
            
            // Show validation message for year code
            if (yearCodeInput) {
                const existingMessage = yearCodeInput.parentNode.querySelector('.validation-message');
                if (existingMessage) {
                    existingMessage.remove();
                }
                
                if (yearCode && !isYearCodeValid) {
                    const message = document.createElement('p');
                    message.className = 'validation-message text-xs text-red-500 mt-1';
                    message.textContent = 'Year code must be in format: YYYY-YYYY or YYYY/YYYY';
                    yearCodeInput.parentNode.appendChild(message);
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
            // Add input validation to only allow numbers, hyphens, and forward slashes
            yearCodeInput.addEventListener('input', (e) => {
                const value = e.target.value;
                const filteredValue = value.replace(/[^0-9\-/]/g, '');
                if (value !== filteredValue) {
                    e.target.value = filteredValue;
                }
                this.validateForm();
            });
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
            const updateData = {
                year_code: yearCode,
                display_name: displayName,
                start_date: startDate,
                end_date: endDate,
                is_active: isActive ? 1 : 0,
                is_current: isCurrent ? 1 : 0,
                status: 'active'
            };

            // Show loading state - modal will handle button states automatically

            // Call API
            const token = localStorage.getItem('token');
            const response = await api.withToken(token).put(`/academic-years/${this.academicYearData.id}`, updateData);
            
            // Check if academic year was updated successfully (following subjects pattern)
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Academic year updated successfully',
                    variant: 'success'
                });

                // Get the updated data from the response
                const updatedData = response.data.data || response.data;

                // Create the updated academic year object from form data and existing data
                const updatedAcademicYear = {
                    ...this.academicYearData, // Keep existing data
                    year_code: yearCode,
                    display_name: displayName,
                    start_date: startDate,
                    end_date: endDate,
                    is_active: isActive ? 1 : 0,
                    is_current: isCurrent ? 1 : 0,
                    status: 'active',
                    updated_at: new Date().toISOString()
                };

                // Dispatch event with the updated academic year data
                this.dispatchEvent(new CustomEvent('academic-year-updated', {
                    detail: { academicYear: updatedAcademicYear },
                    bubbles: true
                }));

                // Don't call this.close() - let the parent page handle it (following delete modal pattern)
            } else {
                throw new Error(response.data?.message || 'Failed to update academic year');
            }
        } catch (error) {
            Toast.show({
                title: 'Error',
                message: 'Failed to update academic year. Please try again.',
                variant: 'error'
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Update Academic Year</div>
                <form id="academic-year-update-form" class="space-y-4">
                                         <div>
                         <label class="block text-sm font-medium text-gray-700 mb-1">Year Code <span class="text-red-500">*</span></label>
                         <ui-input
                             data-field="year_code"
                             type="text"
                             placeholder="e.g., 2024-2025"
                             class="w-full"
                             maxlength="9">
                         </ui-input>
                         <p class="text-xs text-gray-500 mt-1">Format: YYYY-YYYY or YYYY/YYYY (e.g., 2024-2025, 2024/2025)</p>
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
                        <ui-switch name="is_active" class="w-full">
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
                                <li><strong>Warning</strong>: changing dates may affect existing classes and records</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
            </ui-modal>
        `;

        // Attach form events and initialize validation
        this.addFormEventListeners();
        
        // Populate form if we have data (after event listeners are attached)
        if (this.academicYearData) {
            setTimeout(() => {
                this.populateForm();
            }, 50);
        }
    }
}

customElements.define('academic-year-update-modal', AcademicYearUpdateModal);
export default AcademicYearUpdateModal;
