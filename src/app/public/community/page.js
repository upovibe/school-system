import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/CommunitySectionAlt.js';

/**
 * Community Page Component (/community)
 * 
 * This is the community page of the application.
 * It now uses the same centralized data loading approach as the home page.
 * File-based routing: /community → app/public/community/page.js
 */
class CommunityPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        await this.loadAllData();
        await setDocumentTitle('Community');
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load community page data
            const communityPageData = await this.fetchPageData('community');

            // Load community settings
            const settingsData = await this.loadCommunitySettings();

            // Combine all data
            const allData = {
                colors,
                page: communityPageData,
                settings: settingsData
            };

            // Cache in global store
            store.setState({ communityPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading community data:', error);
            this.set('error', 'Failed to load community page data');
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

    async loadCommunitySettings() {
        try {
            const settingsKeys = [
                'community_title', 'community_subtitle'
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
                <!-- Community Section Alt Component -->
                <community-section-alt 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'
                    settings='${escapeJsonForAttribute({
                        community_title: allData.settings.community_title,
                        community_subtitle: allData.settings.community_subtitle
                    })}'>
                </community-section-alt>
            </div>
        `;
    }
}

customElements.define('app-community-page', CommunityPage);
export default CommunityPage; 