import App from '@/core/App.js';
import api from '@/services/api.js';
import PageLoader from '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/ValuesAimsSection.js';

/**
 * Values & Aims Page Component (/about-us/values-aims)
 * 
 * This is the values and aims page of the application.
 * It now uses the same centralized data loading approach as other pages.
 * File-based routing: /about-us/values-aims → app/public/about-us/values-aims/page.js
 */
class ValuesAimsPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        await this.loadAllData();
        await setDocumentTitle('Values & Aims');
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load values aims page data
            const pageData = await this.fetchPageData();

            // Combine all data
            const allData = {
                colors,
                page: pageData
            };

            // Cache in global store
            store.setState({ valuesAimsPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading values aims data:', error);
            this.set('error', 'Failed to load values aims page data');
        }
    }

    async fetchPageData() {
        // Check if data is already cached in global store
        const globalState = store.getState();
        if (globalState.valuesAimsPageContentData) {
            return globalState.valuesAimsPageContentData;
        }

        // If not cached, fetch from API
        try {
            const response = await api.get('/pages/slug/values-aims');
            if (response.data.success) {
                const pageData = response.data.data;
                
                // Cache the data in global store
                store.setState({ valuesAimsPageContentData: pageData });
                
                return pageData;
            }
        } catch (error) {
            console.error('Error fetching values aims page data:', error);
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
                <!-- Values & Aims Section Component -->
                <values-aims-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'>
                </values-aims-section>
            </div>
        `;
    }
}

customElements.define('app-values-aims-page', ValuesAimsPage);
export default ValuesAimsPage;
