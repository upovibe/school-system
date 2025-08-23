import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import api from '@/services/api.js';

/**
 * Grading Period Update Modal Component
 * 
 * A modal component for updating existing grading periods in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
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
        return ['open', 'academic-years'];
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
        this.removeAttribute('open', '');
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

    // Set grading period data for editing
    setGradingPeriodData(gradingPeriodItem) {
        this.gradingPeriodData = gradingPeriodItem;
        this.populateForm();
    }

    // Populate form with existing grading period data
    populateForm() {
        if (!this.gradingPeriodData) return;

        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
        const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
        const academicYearInput = this.querySelector('ui-input[data-field="academic_year"]');
        const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
        const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

        if (nameInput) nameInput.value = this.gradingPeriodData.name || '';
        if (startDateInput) startDateInput.value = this.gradingPeriodData.start_date || '';
        if (endDateInput) endDateInput.value = this.gradingPeriodData.end_date || '';
        if (academicYearInput) {
            // For update modal, we'll populate this after the render when we know the field type
            // The actual population will happen in the render method
        }
        if (descriptionTextarea) descriptionTextarea.setValue(this.gradingPeriodData.description || '');
        if (statusSwitch) {
            if (this.gradingPeriodData.is_active == 1) {
                statusSwitch.setAttribute('checked', '');
            } else {
                statusSwitch.removeAttribute('checked');
            }
        }
    }

    // Update the grading period
    async updateGradingPeriod() {
        try {
            if (!this.gradingPeriodData) {
                Toast.show({
                    title: 'Error',
                    message: 'No grading period data available for update',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get form data using the data-field attributes for reliable selection
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
            const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

            // Get academic year ID - handle both readonly input and dropdown cases
            let academicYearId = this.gradingPeriodData.academic_year_id; // Keep existing if no change
            const academicYearDropdown = this.querySelector('ui-dropdown[data-field="academic_year_id"]');
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

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update grading periods',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Update grading period
            const response = await api.withToken(token).put(`/grading-periods/${this.gradingPeriodData.id}`, gradingPeriodData);
            
            // Check if grading period was updated successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Grading period updated successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Get the current academic year display name
                const currentAcademicYear = this.getAcademicYears()[0];
                const academicYearDisplay = currentAcademicYear ? 
                    `${currentAcademicYear.year_code}${currentAcademicYear.display_name ? ` (${currentAcademicYear.display_name})` : ''}` : 
                    'Unknown';

                // Construct the updated grading period data
                const updatedGradingPeriod = {
                    ...this.gradingPeriodData,
                    name: gradingPeriodData.name,
                    academic_year: academicYearDisplay,
                    academic_year_id: gradingPeriodData.academic_year_id,
                    start_date: gradingPeriodData.start_date,
                    end_date: gradingPeriodData.end_date,
                    description: gradingPeriodData.description,
                    is_active: gradingPeriodData.is_active,
                    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('grading-period-updated', {
                    detail: { gradingPeriod: updatedGradingPeriod },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to update grading period');
            }

        } catch (error) {
            console.error('❌ Error updating grading period:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update grading period. Please try again.',
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
                <div slot="title">Update Grading Period</div>
                <form id="grading-period-update-form" class="space-y-4">
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
                        ${this.gradingPeriodData && this.gradingPeriodData.academic_year_id ? 
                            // If we have existing academic year data, show as readonly input
                            `<ui-input 
                                data-field="academic_year_id"
                                type="text" 
                                value="${this.gradingPeriodData.academic_year || 'Unknown'}"
                                readonly
                                class="w-full">
                            </ui-input>` :
                            // If no existing data, show dropdown with current academic years
                            `${(() => {
                                const academicYears = this.getAcademicYears();
                                const currentYearId = this.getCurrentAcademicYearId();
                                return academicYears.length === 1 ? 
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
                                            <ui-option value="${ay.id}" ${ay.id == currentYearId ? 'selected' : ''}>
                                                ${ay.year_code}${ay.display_name ? ` (${ay.display_name})` : ''}
                                            </ui-option>
                                        `).join('')}
                                    </ui-dropdown>`;
                            })()}`
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
                                <li>Update <strong>Name</strong>, <strong>Start Date</strong>, and <strong>End Date</strong> as needed.</li>
                                <li><strong>Academic Year</strong> automatically set to the current academic year for consistency.</li>
                                <li>Set <strong>Status</strong> to inactive to hide the period from new assignments.</li>
                                <li><strong>Description</strong> is optional but helpful for organization.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('grading-period-update-modal', GradingPeriodUpdateModal);
export default GradingPeriodUpdateModal;
