import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import '@/components/layout/publicLayout/ApplicationFormSection.js';

class ApplyPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Apply | UPO UI';
        this.loadSettings();
    }

    async loadSettings() {
        try {
            // Check if already cached
            const globalState = store.getState();
            if (globalState.applyPageSettings) {
                this.set('settings', globalState.applyPageSettings);
                this.render();
                return;
            }
            // Fetch only the required settings
            const keys = ['school_logo', 'school_name'];
            const settingsPromises = keys.map(async (key) => {
                try {
                    const response = await api.get(`/settings/key/${key}`);
                    return response.data.success ? { key, value: response.data.data.setting_value } : null;
                } catch (error) {
                    return null;
                }
            });
            const settingsResults = await Promise.all(settingsPromises);
            const settings = {};
            settingsResults.forEach(result => {
                if (result) settings[result.key] = result.value;
            });
            store.setState({ applyPageSettings: settings });
            this.set('settings', settings);
            this.render();
        } catch (error) {
            this.set('error', 'Failed to load application page settings');
        }
    }

    render() {
        const settings = this.get('settings');
        const error = this.get('error');
        if (error) {
            return `
                <div class="container mx-auto flex items-center justify-center p-8">
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        ${error}
                    </div>
                </div>
            `;
        }
        if (!settings) {
            return `
                <div class="container flex items-center justify-center mx-auto p-8">
                    <page-loader></page-loader>
                </div>
            `;
        }
        // Fix logo URL for consistency with Header
        const logoUrl = settings.school_logo ? `/api/${settings.school_logo}` : '';
        const settingsWithLogoUrl = { ...settings, school_logo: logoUrl };
        return `
            <div class="min-h-[60vh] flex flex-col items-center justify-center">
                <application-form-section settings='${JSON.stringify(settingsWithLogoUrl).replace(/'/g, "&apos;")}'></application-form-section>
            </div>
        `;
    }
}

customElements.define('app-apply-page', ApplyPage);
export default ApplyPage; 