import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/RadioGroup.js';
import '@/components/ui/Switch.js';
import api from '@/services/api.js';

/**
 * System Update Modal Component
 * 
 * A modal component for editing existing system settings in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - setting-updated: Fired when a setting is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class SystemUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.settingData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update)
        this.addEventListener('confirm', () => {
            this.updateSetting();
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
        this.settingData = null;
    }

    // Set setting data for editing
    setSettingData(settingData) {
        this.settingData = settingData;
        // Re-render the modal with the new data
        this.render();
    }

    // Update the setting
    async updateSetting() {
        try {
            // Get values from custom UI components
            const keyInput = this.querySelector('ui-input[name="setting_key"]');
            const valueInput = this.querySelector('ui-textarea[name="setting_value"]');
            const typeDropdown = this.querySelector('ui-dropdown[data-field="setting_type"]');
            const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
            const descriptionTextarea = this.querySelector('ui-textarea[name="description"]');
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

            const settingData = {
                setting_key: keyInput ? keyInput.value : '',
                setting_value: valueInput ? valueInput.value : '',
                setting_type: typeDropdown ? typeDropdown.value : 'text',
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
                    message: 'Please log in to update settings',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Update the setting
            const response = await api.withToken(token).put(`/settings/${this.settingData.id}`, settingData);
            
            Toast.show({
                title: 'Success',
                message: 'Setting updated successfully',
                variant: 'success',
                duration: 3000
            });

            // Construct the updated setting data from response
            const updatedSetting = {
                ...this.settingData, // Keep existing fields like id, created_at
                ...settingData,
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('setting-updated', {
                detail: { setting: updatedSetting },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error updating setting:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update setting',
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
                <div slot="title">Update System Setting</div>
                
                <form id="setting-update-form" class="space-y-4">
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
                        <ui-textarea 
                            name="setting_value"
                            placeholder="Enter setting value"
                            rows="3"
                            class="w-full">${this.settingData?.setting_value || ''}</ui-textarea>
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
                            class="w-full">${this.settingData?.description || ''}</ui-textarea>
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

customElements.define('system-update-modal', SystemUpdateModal);
export default SystemUpdateModal;
