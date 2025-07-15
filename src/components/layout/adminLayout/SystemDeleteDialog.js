import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';

class SystemDeleteDialog extends App {
    constructor() {
        super();
        this.state = {
            setting: null,
        };
    }

    setSettingData(data) {
        this.setState({ setting: data });
    }

    async handleDelete() {
        const token = localStorage.getItem('token');
        try {
            const response = await api.withToken(token).delete(`/settings/${this.state.setting.id}`);
            if (response.data.success) {
                Toast.show({ title: 'Success', message: 'Setting deleted successfully.', variant: 'success' });
                this.dispatchEvent(new CustomEvent('setting-deleted', { bubbles: true, composed: true }));
                this.close();
            } else {
                Toast.show({ title: 'Error', message: response.data.message, variant: 'error' });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.message, variant: 'error' });
        }
    }

    close() {
        this.closest('ui-dialog').close();
    }

    render() {
        const { setting } = this.state;
        if (!setting) {
            return `<ui-dialog title="Delete Setting"><p>Loading...</p></ui-dialog>`;
        }

        return `
            <ui-dialog title="Delete Setting">
                <p>Are you sure you want to delete the setting with key <strong>${setting.setting_key}</strong>?</p>
                <div class="flex justify-end space-x-2 mt-4">
                    <ui-button variant="ghost" @click="${this.close}">Cancel</ui-button>
                    <ui-button variant="danger" @click="${this.handleDelete}">Delete</ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('system-delete-dialog', SystemDeleteDialog);
