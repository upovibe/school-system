import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/PhotoGallerySection.js';

/**
 * Photo Gallery Page Component (/gallery/photos)
 * 
 * This is the photo gallery page that displays photo galleries.
 * It now uses the same centralized data loading approach as other pages.
 * File-based routing: /gallery/photos → app/public/gallery/photos/page.js
 */
class PhotoGalleryPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        await this.loadAllData();
        await setDocumentTitle('Photo Gallery');
    }

    async loadAllData() {
        try {
            // Load colors
            const colors = await fetchColorSettings();

            // Load photo gallery page data by slug
            const photoPageData = await this.fetchPageData('photos');

            // Combine all data
            const allData = {
                colors,
                page: photoPageData
            };

            // Cache in global store
            store.setState({ photoGalleryPageData: allData });

            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading photo gallery data:', error);
            this.set('error', 'Failed to load photo gallery page data');
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
                <!-- Photo Gallery Section Component -->
                <photo-gallery-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'>
                </photo-gallery-section>
            </div>
        `;
    }
}

customElements.define('app-photo-gallery-page', PhotoGalleryPage);
export default PhotoGalleryPage; 