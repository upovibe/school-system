import App from '@/core/App.js';
import api from '@/services/api.js';
import PageLoader from '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/VideoGallerySection.js';

/**
 * Video Gallery Page Component (/gallery/videos)
 * 
 * This is the video gallery page that displays video galleries.
 * It now uses the same centralized data loading approach as other pages.
 * File-based routing: /gallery/videos → app/public/gallery/videos/page.js
 */
class VideoGalleryPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        await this.loadAllData();
        await setDocumentTitle('Video Gallery');
    }

    async loadAllData() {
        try {
            // Load colors
            const colors = await fetchColorSettings();

            // Load video gallery page data by slug
            const videoPageData = await this.fetchPageData('videos');

            // Combine all data
            const allData = {
                colors,
                page: videoPageData
            };

            // Cache in global store
            store.setState({ videoGalleryPageData: allData });

            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading video gallery data:', error);
            this.set('error', 'Failed to load video gallery page data');
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
                <!-- Video Gallery Section Component -->
                <video-gallery-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'>
                </video-gallery-section>
            </div>
        `;
    }
}

customElements.define('app-video-gallery-page', VideoGalleryPage);
export default VideoGalleryPage; 