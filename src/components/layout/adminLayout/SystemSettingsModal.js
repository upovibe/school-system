import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Toast.js';

class SystemSettingsModal extends App {
    constructor() {
        super();
        this.state = {
            setting_key: '',
            setting_value: '',
            setting_type: 'text',
            category: 'general',
            description: '',
            is_active: true,
        };
    }

    async handleSave(e) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const response = await api.withToken(token).post('/settings', this.state);
            if (response.data.success) {
                Toast.show({ title: 'Success', message: 'Setting saved successfully.', variant: 'success' });
                this.dispatchEvent(new CustomEvent('setting-saved', { bubbles: true, composed: true }));
                this.close();
            } else {
                Toast.show({ title: 'Error', message: response.data.message, variant: 'error' });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.message, variant: 'error' });
        }
    }

    close() {
        this.closest('ui-modal').close();
    }

    render() {
        return `
            <ui-modal title="Add New Setting">
                <form class="space-y-4" @submit="${this.handleSave}">
                    <ui-input label="Key" placeholder="e.g., site_name" name="setting_key" value="${this.state.setting_key}" required></ui-input>
                    <ui-textarea label="Value" placeholder="Enter setting value" name="setting_value" value="${this.state.setting_value}"></ui-textarea>
                    <ui-input label="Type" placeholder="e.g., text, number, boolean" name="setting_type" value="${this.state.setting_type}"></ui-input>
                    <ui-input label="Category" placeholder="e.g., general, theme, social" name="category" value="${this.state.category}"></ui-input>
                    <ui-textarea label="Description" placeholder="Briefly describe the setting" name="description" value="${this.state.description}"></ui-textarea>
                    <ui-switch label="Active" name="is_active" checked="${this.state.is_active}"></ui-switch>
                    <div class="flex justify-end space-x-2">
                        <ui-button type="button" variant="ghost" @click="${this.close}">Cancel</ui-button>
                        <ui-button type="submit">Save</ui-button>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('system-settings-modal', SystemSettingsModal);
