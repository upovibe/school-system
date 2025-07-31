import App from '@/core/App.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/VideoGalleryView.js';

/**
 * Video Gallery Slug Page Component (/gallery/videos/[slug])
 * 
 * This is the individual video gallery page that displays a specific video gallery.
 * File-based routing: /gallery/videos/[slug] → app/public/gallery/videos/[slug]/page.js
 */
class VideoGallerySlugPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        
        // Get the slug from the URL
        const slug = this.getSlugFromUrl();
        
        this.set('slug', slug);
        this.render();
        
        await setDocumentTitle('Video Gallery');
    }

    getSlugFromUrl() {
        // Extract slug from URL path
        const pathSegments = window.location.pathname.split('/');
        const slugIndex = pathSegments.indexOf('videos') + 1;
        return pathSegments[slugIndex] || null;
    }

    render() {
        const slug = this.get('slug');

        if (!slug) {
            return `
                <div class="container mx-auto flex items-center justify-center p-8">
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        Video gallery not found
                    </div>
                </div>
            `;
        }

        return `
            <div class="container mx-auto px-4 py-8">
                <!-- Video Gallery View Component -->
                <app-video-gallery-view slug="${slug}"></app-video-gallery-view>
            </div>
        `;
    }
}

customElements.define('app-video-gallery-slug-page', VideoGallerySlugPage);
export default VideoGallerySlugPage; 