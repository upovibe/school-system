import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/RadioGroup.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * System Settings Modal Component
 * 
 * A modal component for adding new system settings in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - setting-saved: Fired when a setting is successfully created
 * - modal-closed: Fired when modal is closed
 */
class SystemSettingsModal extends HTMLElement {
    constructor() {
        super();
        this.settingData = {
            setting_key: '',
            setting_value: '',
            setting_type: 'text',
            category: 'general',
            description: '',
            is_active: true,
        };
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save)
        this.addEventListener('confirm', () => {
            this.saveSetting();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });

        // Listen for setting type dropdown change
        this.addEventListener('change', (event) => {
            if (event.target.matches('ui-dropdown[data-field="setting_type"]')) {
                // Store current value before changing type
                const currentValueInput = this.querySelector('[data-value-input] input, [data-value-input] ui-input, [data-value-input] ui-textarea, [data-value-input] ui-radio-group');
                if (currentValueInput) {
                    this.settingData.setting_value = currentValueInput.value || currentValueInput.getAttribute('value') || '';
                }
                
                this.settingData.setting_type = event.target.value;
                this.updateValueInput();
            }
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.settingData = {
            setting_key: '',
            setting_value: '',
            setting_type: 'text',
            category: 'general',
            description: '',
            is_active: true,
        };
        this.render();
    }

    // Update the value input based on selected type
    updateValueInput() {
        const valueInputContainer = this.querySelector('[data-value-input]');
        if (valueInputContainer) {
            valueInputContainer.innerHTML = this.renderValueInput();
        }
    }

    // Render the appropriate input component based on setting type
    renderValueInput() {
        const settingType = this.settingData?.setting_type || 'text';
        const currentValue = this.settingData?.setting_value || '';

        switch (settingType) {
            case 'text':
                return `
                    <ui-input 
                        name="setting_value"
                        type="text" 
                        placeholder="Enter text value"
                        value="${currentValue}"
                        class="w-full">
                    </ui-input>
                `;
            
            case 'number':
                return `
                    <ui-input 
                        name="setting_value"
                        type="number" 
                        placeholder="Enter numeric value"
                        value="${currentValue}"
                        class="w-full">
                    </ui-input>
                `;
            
            case 'boolean':
                return `
                    <ui-radio-group 
                        name="setting_value"
                        value="${currentValue === '1' || currentValue === 'true' ? 'true' : 'false'}"
                        layout="horizontal"
                        class="w-full">
                        <ui-radio-option value="true" label="True"></ui-radio-option>
                        <ui-radio-option value="false" label="False"></ui-radio-option>
                    </ui-radio-group>
                `;
            
            case 'color':
                return `
                    <input 
                        name="setting_value"
                        type="color" 
                        value="${currentValue || '#000000'}"
                        class="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                `;
            
            case 'file':
                return `
                    <ui-file-upload 
                        name="setting_value"
                        accept="*/*"
                        max-size="10485760"
                        max-files="1"
                        class="w-full">
                    </ui-file-upload>
                `;
            
            case 'image':
                return `
                    <ui-file-upload 
                        name="setting_value"
                        accept="image/*"
                        max-size="5242880"
                        max-files="1"
                        class="w-full">
                    </ui-file-upload>
                `;
            
            case 'textarea':
                return `
                    <ui-textarea 
                        name="setting_value"
                        placeholder="Enter text value"
                        rows="4"
                        value="${currentValue}"
                        class="w-full">
                    </ui-textarea>
                `;
            
            case 'select':
                // For select type, we'll use a textarea to allow multiple options
                return `
                    <ui-textarea 
                        name="setting_value"
                        placeholder="Enter select options (one per line or comma separated)"
                        rows="3"
                        value="${currentValue}"
                        class="w-full">
                    </ui-textarea>
                `;
            
            default:
                return `
                    <ui-input 
                        name="setting_value"
                        type="text" 
                        placeholder="Enter value"
                        value="${currentValue}"
                        class="w-full">
                    </ui-input>
                `;
        }
    }

    // Save the new setting
    async saveSetting() {
        try {
            // Small delay to ensure components are initialized
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Get values from custom UI components
            const allInputs = this.querySelectorAll('ui-input');
            const keyInput = allInputs[0]; // First ui-input is the setting key
            const settingValueInput = allInputs[1]; // Second ui-input is the setting value
            const typeDropdown = this.querySelector('ui-dropdown[data-field="setting_type"]');
            const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
            const descriptionTextarea = this.querySelector('ui-textarea[name="description"]');
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

            // Get value based on the type
            let valueInput;
            let fileUpload = null;
            const settingType = typeDropdown ? typeDropdown.value : 'text';
            
            switch (settingType) {
                case 'boolean':
                    const radioGroup = this.querySelector('ui-radio-group[name="setting_value"]');
                    valueInput = radioGroup ? radioGroup.value : 'false';
                    break;
                case 'textarea':
                case 'select':
                    const textarea = this.querySelector('ui-textarea[name="setting_value"]');
                    valueInput = textarea ? textarea.value : '';
                    break;
                case 'file':
                case 'image':
                    fileUpload = this.querySelector('ui-file-upload[name="setting_value"]');
                    valueInput = fileUpload ? fileUpload.value : '';
                    break;
                case 'color':
                    const colorInput = this.querySelector('input[name="setting_value"]');
                    valueInput = colorInput ? colorInput.value : '#000000';
                    break;
                default:
                    // For text and number types, use the settingValueInput directly
                    valueInput = settingValueInput ? settingValueInput.value : '';
                    break;
            }

            // Fallback: Try to get value from the input element directly if component isn't initialized
            let settingKey = '';
            if (keyInput) {
                settingKey = keyInput.value || keyInput.getAttribute('value') || '';
            } else {
                // Try to find the actual input element inside the component
                const actualInput = this.querySelector('ui-input[name="setting_key"] input');
                if (actualInput) {
                    settingKey = actualInput.value || '';
                }
            }
            
            // Fallback for setting value if not found
            if (!valueInput && (settingType === 'text' || settingType === 'number')) {
                // Try to get from the setting data directly
                valueInput = this.settingData?.setting_value || '';
            }

            const settingData = {
                setting_key: settingKey,
                setting_value: valueInput,
                setting_type: settingType,
                category: categoryDropdown ? categoryDropdown.value : 'general',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                is_active: statusSwitch ? statusSwitch.checked : true
            };

            // Validate required fields
            if (!settingData.setting_key) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Setting key is required',
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
                    message: 'Please log in to create settings',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Handle file upload for file/image types
            let response;
            if ((settingType === 'file' || settingType === 'image') && fileUpload && fileUpload.getFiles().length > 0) {
                // Prepare form data for multipart request
                const formData = new FormData();
                
                // Add all form fields
                Object.keys(settingData).forEach(key => {
                    formData.append(key, settingData[key]);
                });
                
                // Add file if selected
                const file = fileUpload.getFiles()[0];
                formData.append('setting_value', file);
                
                // Create the setting with multipart data
                response = await api.withToken(token).post('/settings', formData);
            } else {
                // Create the setting with JSON data
                response = await api.withToken(token).post('/settings', settingData);
            }
            
            Toast.show({
                title: 'Success',
                message: 'Setting created successfully',
                variant: 'success',
                duration: 3000
            });

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('setting-saved', {
                detail: { setting: response.data.data },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error creating setting:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create setting',
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
                <div slot="title">Add New System Setting</div>
                
                <form id="setting-create-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Setting Key</label>
                        <ui-input 
                            name="setting_key"
                            type="text" 
                            placeholder="Enter setting key"
                            value="${this.settingData?.setting_key || ''}"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Setting Type</label>
                        <ui-dropdown 
                            data-field="setting_type"
                            placeholder="Select type"
                            value="${this.settingData?.setting_type || 'text'}"
                            class="w-full">
                            <ui-option value="text">Text</ui-option>
                            <ui-option value="number">Number</ui-option>
                            <ui-option value="boolean">Boolean</ui-option>
                            <ui-option value="color">Color</ui-option>
                            <ui-option value="file">File</ui-option>
                            <ui-option value="textarea">Textarea</ui-option>
                            <ui-option value="select">Select</ui-option>
                            <ui-option value="image">Image</ui-option>
                        </ui-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Setting Value</label>
                        <div data-value-input>
                            ${this.renderValueInput()}
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <ui-dropdown 
                            data-field="category"
                            placeholder="Select category"
                            value="${this.settingData?.category || 'general'}"
                            class="w-full">
                            <ui-option value="general">General</ui-option>
                            <ui-option value="theme">Theme</ui-option>
                            <ui-option value="contact">Contact</ui-option>
                            <ui-option value="social">Social</ui-option>
                            <ui-option value="map">Map</ui-option>
                            <ui-option value="branding">Branding</ui-option>
                            <ui-option value="system">System</ui-option>
                        </ui-dropdown>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea 
                            name="description"
                            placeholder="Briefly describe this setting"
                            rows="2"
                            value="${this.settingData?.description || ''}"
                            class="w-full">
                        </ui-textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch 
                            name="is_active"
                            ${this.settingData?.is_active ? 'checked' : ''}
                            class="w-full">
                            <span slot="label">Active</span>
                        </ui-switch>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('system-settings-modal', SystemSettingsModal);
export default SystemSettingsModal;
