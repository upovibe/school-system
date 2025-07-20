import App from '@/core/App.js';
import api from '@/services/api.js';
import PageLoader from '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/GallerySection.js';

/**
 * Gallery Page Component (/gallery)
 * 
 * This is the gallery page of the application.
 * It now uses the same centralized data loading approach as the academics page.
 * File-based routing: /gallery → app/public/gallery/page.js
 */
class GalleryPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Gallery | UPO UI';
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load gallery page data
            const galleryPageData = await this.fetchPageData('gallery');

            // Combine all data
            const allData = {
                colors,
                page: galleryPageData
            };

            // Cache in global store
            store.setState({ galleryPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading gallery data:', error);
            this.set('error', 'Failed to load gallery page data');
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
                <!-- Gallery Section Component -->
                <gallery-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'
                    settings='${escapeJsonForAttribute({})}'>
                </gallery-section>
            </div>
        </div>
        `;
    }
}

customElements.define('app-gallery-page', GalleryPage);
export default GalleryPage; 