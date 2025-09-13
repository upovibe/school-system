import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * Admission Config Modal Component
 * 
 * A modal component for configuring admission settings in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - config-saved: Fired when configuration is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class AdmissionConfigModal extends HTMLElement {
    constructor() {
        super();
        this.configData = {
            admission_status: 'open',
            max_applications_per_ip_per_day: 3,
            enabled_levels: ['primary', 'jhs', 'shs'],
            level_classes: {
                primary: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
                jhs: ['JHS1', 'JHS2', 'JHS3'],
                shs: ['SHS1', 'SHS2', 'SHS3']
            },
            shs_programmes: ['Science', 'Business', 'Arts', 'General Arts'],
            school_types: ['Day', 'Boarding', 'Day/Boarding'],
            required_documents: ['birth_certificate', 'passport_photo', 'report_card']
        };
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadCurrentConfig();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save)
        this.addEventListener('confirm', () => {
            this.saveConfig();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });

        // Listen for form changes
        this.addEventListener('change', (event) => {
            this.handleFormChange(event);
        });

        this.addEventListener('input', (event) => {
            this.handleFormChange(event);
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Load current admission configuration
    async loadCurrentConfig() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/admission/config');
            if (response.data.success && response.data.data) {
                this.configData = { ...this.configData, ...response.data.data };
                this.render();
            }
        } catch (error) {
            console.error('❌ Error loading admission config:', error);
        }
    }

    // Handle form changes
    handleFormChange(event) {
        const { name, value, type, checked } = event.target;
        
        if (name === 'enabled_levels') {
            // Handle level checkboxes
            const levels = Array.from(this.querySelectorAll('input[name="enabled_levels"]:checked'))
                .map(input => input.value);
            this.configData.enabled_levels = levels;
        } else if (name === 'required_documents') {
            // Handle document checkboxes
            const documents = Array.from(this.querySelectorAll('input[name="required_documents"]:checked'))
                .map(input => input.value);
            this.configData.required_documents = documents;
        } else if (name && name in this.configData) {
            if (type === 'checkbox') {
                this.configData[name] = checked;
            } else if (type === 'number') {
                this.configData[name] = parseInt(value) || 0;
            } else {
                this.configData[name] = value;
            }
        }
    }

    // Save the configuration
    async saveConfig() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to save configuration',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get current config ID or create new one
            const currentConfig = await api.withToken(token).get('/admission/config');
            let response;

            if (currentConfig.data.success && currentConfig.data.data) {
                // Update existing config
                response = await api.withToken(token).put(`/admission-configs/${currentConfig.data.data.id}`, this.configData);
            } else {
                // Create new config
                response = await api.withToken(token).post('/admission-configs', this.configData);
            }
            
            Toast.show({
                title: 'Success',
                message: 'Admission configuration saved successfully',
                variant: 'success',
                duration: 3000
            });

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('config-saved', {
                detail: { config: response.data.data },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error saving admission config:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to save configuration',
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
                size="lg"
                close-button="true">
                <div slot="title">Admission Configuration</div>
                
                <form id="admission-config-form" class="space-y-6">
                    <!-- Admission Status -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-medium text-gray-900">Admission Status</h4>
                                    <p class="text-sm text-gray-600">Control whether new applications are being accepted</p>
                                </div>
                                <ui-switch 
                                    name="admission_status"
                                    ${this.configData.admission_status === 'open' ? 'checked' : ''}
                                    class="w-full">
                                    <span slot="label">Open for Applications</span>
                                </ui-switch>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Max Applications per IP per Day</label>
                                <ui-input 
                                    name="max_applications_per_ip_per_day"
                                    type="number" 
                                    placeholder="Enter number"
                                    value="${this.configData.max_applications_per_ip_per_day}"
                                    class="w-full">
                                </ui-input>
                            </div>
                        </div>
                    </div>

                    <!-- Enabled Levels -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Enabled Levels</h3>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="flex items-center">
                                <input type="checkbox" name="enabled_levels" value="creche" 
                                    ${this.configData.enabled_levels.includes('creche') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Creche</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="enabled_levels" value="nursery" 
                                    ${this.configData.enabled_levels.includes('nursery') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Nursery</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="enabled_levels" value="kg" 
                                    ${this.configData.enabled_levels.includes('kg') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">KG</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="enabled_levels" value="primary" 
                                    ${this.configData.enabled_levels.includes('primary') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Primary</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="enabled_levels" value="jhs" 
                                    ${this.configData.enabled_levels.includes('jhs') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">JHS</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="enabled_levels" value="shs" 
                                    ${this.configData.enabled_levels.includes('shs') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">SHS</span>
                            </label>
                        </div>
                    </div>

                    <!-- Required Documents -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="birth_certificate" 
                                    ${this.configData.required_documents.includes('birth_certificate') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Birth Certificate</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="passport_photo" 
                                    ${this.configData.required_documents.includes('passport_photo') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Passport Photo</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="report_card" 
                                    ${this.configData.required_documents.includes('report_card') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Report Card</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="transfer_letter" 
                                    ${this.configData.required_documents.includes('transfer_letter') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Transfer Letter</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="bece_results" 
                                    ${this.configData.required_documents.includes('bece_results') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">BECE Results</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="required_documents" value="immunization_card" 
                                    ${this.configData.required_documents.includes('immunization_card') ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Immunization Card</span>
                            </label>
                        </div>
                    </div>

                    <!-- SHS Programmes -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">SHS Programmes</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Available Programmes (one per line)</label>
                            <ui-textarea 
                                name="shs_programmes_text"
                                placeholder="Enter programmes, one per line"
                                rows="4"
                                value="${this.configData.shs_programmes.join('\n')}"
                                class="w-full">
                            </ui-textarea>
                        </div>
                    </div>

                    <!-- School Types -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">School Types</h3>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Available School Types (one per line)</label>
                            <ui-textarea 
                                name="school_types_text"
                                placeholder="Enter school types, one per line"
                                rows="3"
                                value="${this.configData.school_types.join('\n')}"
                                class="w-full">
                            </ui-textarea>
                        </div>
                    </div>
                </form>
                
                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    <ui-button color="primary" modal-action="confirm">Save Configuration</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('admission-config-modal', AdmissionConfigModal);
export default AdmissionConfigModal;
