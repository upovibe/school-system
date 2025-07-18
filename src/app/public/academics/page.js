import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/homeLayout/AcademicsSection.js';

/**
 * Academics Page Component (/acadamics)
 * 
 * This is the academics page of the application.
 * It now uses the same centralized data loading approach as the home page.
 * File-based routing: /acadamics → app/public/acadamics/page.js
 */
class AcademicsPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Academics | UPO UI';
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load academics page data
            const academicsPageData = await this.fetchPageData('academics');

            // Load academics settings
            const settingsData = await this.loadAcademicsSettings();

            // Combine all data
            const allData = {
                colors,
                page: academicsPageData,
                settings: settingsData
            };

            // Cache in global store
            store.setState({ academicsPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading academics data:', error);
            this.set('error', 'Failed to load academics page data');
        }
    }

    async fetchPageData(slug) {
        try {
            const response = await api.get(`/pages/slug/${slug}`);
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error(`Error fetching ${slug} page data:`, error);
            return null;
        }
    }

    async loadAcademicsSettings() {
        try {
            const settingsKeys = [
                'academics_title', 'academics_subtitle'
            ];

            const settingsPromises = settingsKeys.map(async (key) => {
                try {
                    const response = await api.get(`/settings/key/${key}`);
                    return response.data.success ? { key, value: response.data.data.setting_value } : null;
                } catch (error) {
                    console.error(`Error fetching setting ${key}:`, error);
                    return null;
                }
            });

            const settingsResults = await Promise.all(settingsPromises);
            
            // Convert to object
            const settingsObject = {};
            settingsResults.forEach(result => {
                if (result) {
                    settingsObject[result.key] = result.value;
                }
            });

            return settingsObject;
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
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

        // Convert data to JSON strings for attributes with proper escaping
        const colorsData = escapeJsonForAttribute(allData.colors);

        return `
            <div class="mx-auto">
                <!-- Academics Section Component -->
                <academics-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'
                    settings='${escapeJsonForAttribute({
                        academics_title: allData.settings.academics_title,
                        academics_subtitle: allData.settings.academics_subtitle
                    })}'>
                </academics-section>
            </div>
        `;
    }
}

customElements.define('app-academics-page', AcademicsPage);
export default AcademicsPage; 