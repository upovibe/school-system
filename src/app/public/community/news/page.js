import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/NewsSection.js';

/**
 * News Page Component (/community/news)
 * 
 * This is the news page of the application.
 * It now uses the same centralized data loading approach as the community page.
 * File-based routing: /community/news → app/public/community/news/page.js
 */
class NewsPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        await this.loadAllData();
        await setDocumentTitle('News');
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load news page data
            const newsPageData = await this.fetchPageData('news');

            // Combine all data
            const allData = {
                colors,
                page: newsPageData
            };

            // Cache in global store
            store.setState({ newsPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading news data:', error);
            this.set('error', 'Failed to load news page data');
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
                <!-- News Section Component -->
                <news-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'>
                </news-section>
            </div>
        `;
    }
}

customElements.define('app-news-page', NewsPage);
export default NewsPage; 