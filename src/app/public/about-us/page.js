import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/homeLayout/AboutSection.js';

/**
 * About Us Page Component (/about-us)
 * 
 * This is the about us page of the application.
 * It now uses the same centralized data loading approach as the home page.
 * File-based routing: /about-us → app/public/about-us/page.js
 */
class AboutUsPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'About Us | UPO UI';
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load about page data
            const aboutPageData = await this.fetchPageData('about-us');

            // Load about settings
            const settingsData = await this.loadAboutSettings();

            // Combine all data
            const allData = {
                colors,
                page: aboutPageData,
                settings: settingsData
            };

            // Cache in global store
            store.setState({ aboutUsPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading about us data:', error);
            this.set('error', 'Failed to load about us page data');
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

    async loadAboutSettings() {
        try {
            const settingsKeys = [
                'about_title', 'about_subtitle'
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
                <!-- About Section Component -->
                <about-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'
                    settings='${escapeJsonForAttribute({
                        about_title: allData.settings.about_title,
                        about_subtitle: allData.settings.about_subtitle
                    })}'>
                </about-section>
            </div>
        `;
    }
}

customElements.define('app-about-us-page', AboutUsPage);
export default AboutUsPage; 