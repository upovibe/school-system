import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Textarea.js';
import api from '@/services/api.js';

/**
 * Grading Period Update Modal Component
 * 
 * A modal component for updating existing grading periods in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * - grading-period-data: object - the grading period data to update
 * 
 * Events:
 * - grading-period-updated: Fired when a grading period is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class GradingPeriodUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.gradingPeriodData = null;
    }

    static get observedAttributes() {
        return ['open', 'grading-period-data'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update Grading Period)
        this.addEventListener('confirm', () => {
            this.updateGradingPeriod();
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

    // Update the grading period
    async updateGradingPeriod() {
        try {
            if (!this.gradingPeriodData || !this.gradingPeriodData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No grading period data to update',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get form data using the data-field attributes for reliable selection
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const academicYearInput = this.querySelector('ui-input[data-field="academic_year"]');
            const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
            const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

            const gradingPeriodData = {
                name: nameInput ? nameInput.value : '',
                academic_year: academicYearInput ? academicYearInput.value : '',
                start_date: startDateInput ? startDateInput.value : '',
                end_date: endDateInput ? endDateInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                is_active: statusSwitch ? (statusSwitch.checked ? 1 : 0) : 1
            };

            console.log('Grading period update data being sent:', gradingPeriodData); // Debug log

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

            if (!gradingPeriodData.academic_year) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the academic year',
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
            const confirmButton = this.querySelector('ui-button[slot="confirm"]');
            if (confirmButton) {
                confirmButton.setAttribute('loading', '');
                confirmButton.textContent = 'Updating...';
            }

            // Send the request
            const response = await api.put(`/grading-periods/${this.gradingPeriodData.id}`, gradingPeriodData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Grading period updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the updated grading period data
                this.dispatchEvent(new CustomEvent('grading-period-updated', {
                    detail: {
                        gradingPeriod: {
                            id: this.gradingPeriodData.id,
                            name: gradingPeriodData.name,
                            academic_year: gradingPeriodData.academic_year,
                            start_date: gradingPeriodData.start_date,
                            end_date: gradingPeriodData.end_date,
                            description: gradingPeriodData.description,
                            is_active: gradingPeriodData.is_active,
                            created_at: this.gradingPeriodData.created_at,
                            updated_at: new Date().toISOString()
                        }
                    }
                }));

                this.close();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.message || 'Failed to update grading period',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error updating grading period:', error);
            Toast.show({
                title: 'Error',
                message: 'Failed to update grading period. Please try again.',
                variant: 'error',
                duration: 3000
            });
        } finally {
            // Reset loading state
            const confirmButton = this.querySelector('ui-button[slot="confirm"]');
            if (confirmButton) {
                confirmButton.removeAttribute('loading');
                confirmButton.textContent = 'Update Grading Period';
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'grading-period-data' && newValue) {
            try {
                this.gradingPeriodData = JSON.parse(newValue);
                this.populateForm();
            } catch (error) {
                console.error('Error parsing grading period data:', error);
            }
        }
    }

    populateForm() {
        if (!this.gradingPeriodData) return;

        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const academicYearInput = this.querySelector('ui-input[data-field="academic_year"]');
        const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
        const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
        const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
        const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

        if (nameInput) nameInput.value = this.gradingPeriodData.name || '';
        if (academicYearInput) academicYearInput.value = this.gradingPeriodData.academic_year || '';
        if (startDateInput) startDateInput.value = this.gradingPeriodData.start_date || '';
        if (endDateInput) endDateInput.value = this.gradingPeriodData.end_date || '';
        if (descriptionTextarea) descriptionTextarea.value = this.gradingPeriodData.description || '';
        if (statusSwitch) statusSwitch.checked = this.gradingPeriodData.is_active == 1;
    }

    render() {
        return `
            <ui-modal 
                title="Update Grading Period"
                size="lg"
                ${this.hasAttribute('open') ? 'open' : ''}>
                
                <div class="space-y-6">
                    <!-- Period Name -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Period Name *
                        </label>
                        <ui-input 
                            data-field="name"
                            placeholder="e.g., First Term, Second Term, Final Term"
                            required>
                        </ui-input>
                    </div>

                    <!-- Academic Year -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Academic Year *
                        </label>
                        <ui-input 
                            data-field="academic_year"
                            placeholder="e.g., 2024-2025"
                            required>
                        </ui-input>
                    </div>

                    <!-- Date Range -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Start Date *
                            </label>
                            <ui-input 
                                data-field="start_date"
                                type="date"
                                required>
                            </ui-input>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                End Date *
                            </label>
                            <ui-input 
                                data-field="end_date"
                                type="date"
                                required>
                            </ui-input>
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <ui-textarea 
                            data-field="description"
                            placeholder="Optional description for this grading period..."
                            rows="3">
                        </ui-textarea>
                    </div>

                    <!-- Active Status -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <ui-switch 
                            name="is_active">
                            Active
                        </ui-switch>
                    </div>
                </div>

                <ui-button slot="confirm" variant="primary">
                    Update Grading Period
                </ui-button>
                <ui-button slot="cancel" variant="secondary">
                    Cancel
                </ui-button>
            </ui-modal>
        `;
    }
}

customElements.define('grading-period-update-modal', GradingPeriodUpdateModal);
export default GradingPeriodUpdateModal;
