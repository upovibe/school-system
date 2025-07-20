import App from '@/core/App.js';
import api from '@/services/api.js';
import PageLoader from '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/PhotoGallerySection.js';

/**
 * Photo Gallery Page Component (/gallery/photos)
 * 
 * This is the photo gallery page that displays photo galleries.
 * It now uses the same centralized data loading approach as other pages.
 * File-based routing: /gallery/photos → app/public/gallery/photos/page.js
 */
class PhotoGalleryPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Photo Gallery | UPO UI';
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Load colors only
            const colors = await fetchColorSettings();

            // Combine all data
            const allData = {
                colors
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
                    colors='${colorsData}'>
                </photo-gallery-section>
            </div>
        `;
    }
}

customElements.define('app-photo-gallery-page', PhotoGalleryPage);
export default PhotoGalleryPage; 