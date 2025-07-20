import App from '@/core/App.js';
import api from '@/services/api.js';
import PageLoader from '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/MissionVisionSection.js';

/**
 * Mission Vision Page Component (/about-us/mission-vision)
 * 
 * This is the mission vision page of the application.
 * It now uses the same centralized data loading approach as other pages.
 * File-based routing: /about-us/mission-vision → app/public/about-us/mission-vision/page.js
 */
class MissionVisionPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Mission & Vision | UPO UI';
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load mission vision page data
            const pageData = await this.fetchPageData();

            // Combine all data
            const allData = {
                colors,
                page: pageData
            };

            // Cache in global store
            store.setState({ missionVisionPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading mission vision data:', error);
            this.set('error', 'Failed to load mission vision page data');
        }
    }

    async fetchPageData() {
        // Check if data is already cached in global store
        const globalState = store.getState();
        if (globalState.missionVisionPageContentData) {
            return globalState.missionVisionPageContentData;
        }

        // If not cached, fetch from API
        try {
            const response = await api.get('/pages/slug/mission-vision');
            if (response.data.success) {
                const pageData = response.data.data;
                
                // Cache the data in global store
                store.setState({ missionVisionPageContentData: pageData });
                
                return pageData;
            }
        } catch (error) {
            console.error('Error fetching mission vision page data:', error);
            return null;
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
                <!-- Mission Vision Section Component -->
                <mission-vision-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'>
                </mission-vision-section>
            </div>
        `;
    }
}

customElements.define('app-mission-vision-page', MissionVisionPage);
export default MissionVisionPage; 