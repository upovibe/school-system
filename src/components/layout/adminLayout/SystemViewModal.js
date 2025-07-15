import App from '@/core/App.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';

class SystemViewModal extends App {
    constructor() {
        super();
        this.state = {
            setting: null,
        };
    }

    setSettingData(data) {
        this.setState({ setting: data });
    }

    close() {
        this.closest('ui-modal').close();
    }

    render() {
        const { setting } = this.state;
        if (!setting) {
            return `<ui-modal title="View Setting"><p>Loading...</p></ui-modal>`;
        }

        return `
            <ui-modal title="View Setting">
                <div class="space-y-4">
                    <div><strong>ID:</strong> ${setting.id}</div>
                    <div><strong>Key:</strong> ${setting.setting_key}</div>
                    <div><strong>Value:</strong> ${setting.setting_value}</div>
                    <div><strong>Type:</strong> ${setting.setting_type}</div>
                    <div><strong>Category:</strong> ${setting.category}</div>
                    <div><strong>Description:</strong> ${setting.description}</div>
                    <div><strong>Status:</strong> ${setting.is_active ? 'Active' : 'Inactive'}</div>
                    <div><strong>Created At:</strong> ${new Date(setting.created_at).toLocaleString()}</div>
                    <div><strong>Updated At:</strong> ${new Date(setting.updated_at).toLocaleString()}</div>
                </div>
                <div class="flex justify-end space-x-2 mt-4">
                    <ui-button @click="${this.close}">Close</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('system-view-modal', SystemViewModal);
