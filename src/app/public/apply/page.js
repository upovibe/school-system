import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/ApplicationFormSection.js';

class ApplyPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Apply | UPO UI';
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Check if already cached
            const globalState = store.getState();
            if (globalState.applyPageAllData) {
                this.set('allData', globalState.applyPageAllData);
                this.render();
                return;
            }
            // Fetch colors, settings, banner, and contact page data in parallel
            const [colors, settings, bannerImage, contactPageData] = await Promise.all([
                fetchColorSettings(),
                (async () => {
                    const keys = ['application_logo', 'application_name'];
                    const settingsPromises = keys.map(async (key) => {
                        try {
                            const response = await api.get(`/settings/key/${key}`);
                            return response.data.success ? { key, value: response.data.data.setting_value } : null;
                        } catch (error) {
                            return null;
                        }
                    });
                    const settingsResults = await Promise.all(settingsPromises);
                    const settingsObj = {};
                    settingsResults.forEach(result => {
                        if (result) settingsObj[result.key] = result.value;
                    });
                    return settingsObj;
                })(),
                (async () => {
                    try {
                        const bannerRes = await api.get('/pages/slug/contact');
                        if (bannerRes.data.success && bannerRes.data.data.banner_image) {
                            return bannerRes.data.data.banner_image;
                        }
                    } catch (e) {}
                    return null;
                })(),
                (async () => {
                    // Fetch contact page data
                    try {
                        const response = await api.get('/pages/slug/contact');
                        if (response.data.success) {
                            return response.data.data;
                        }
                    } catch (error) {
                        console.error('Error fetching contact page data:', error);
                    }
                    return null;
                })()
            ]);
            const allData = { colors, settings, bannerImage, contactPageData };
            store.setState({ applyPageAllData: allData });
            this.set('allData', allData);
            this.render();
        } catch (error) {
            this.set('error', 'Failed to load application page data');
        }
    }

    render() {
        const allData = this.get('allData');
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
        if (!allData) {
            return `
                <div class="container flex items-center justify-center mx-auto p-8">
                    <page-loader></page-loader>
                </div>
            `;
        }
        // Fix logo URL for consistency with Header
        const logoUrl = allData.settings.application_logo ? `/api/${allData.settings.application_logo}` : '';
        const settingsWithLogoUrl = { ...allData.settings, application_logo: logoUrl };
        return `
            <div class="mx-auto">
                <application-form-section 
                    settings='${JSON.stringify(settingsWithLogoUrl).replace(/'/g, "&apos;")}'
                    banner-image='${allData.bannerImage ? `/api/${allData.bannerImage}` : ''}'
                    colors='${escapeJsonForAttribute(allData.colors)}'
                    page-data='${escapeJsonForAttribute(allData.contactPageData || {})}'
                ></application-form-section>
            </div>
        `;
    }
}

customElements.define('app-apply-page', ApplyPage);
export default ApplyPage; 