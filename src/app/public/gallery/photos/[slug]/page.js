import App from '@/core/App.js';
import '@/components/layout/publicLayout/PhotoGalleryView.js';

/**
 * Photo Gallery Slug Page Component (/gallery/photos/[slug])
 * 
 * This is the individual photo gallery page that displays a specific photo gallery.
 * File-based routing: /gallery/photos/[slug] → app/public/gallery/photos/[slug]/page.js
 */
class PhotoGallerySlugPage extends App {
    connectedCallback() {
        super.connectedCallback();
        
        // Get the slug from the URL
        const slug = this.getSlugFromUrl();
        document.title = `Photo Gallery | UPO UI`;
        
        this.set('slug', slug);
        this.render();
    }

    getSlugFromUrl() {
        // Extract slug from URL path
        const pathSegments = window.location.pathname.split('/');
        const slugIndex = pathSegments.indexOf('photos') + 1;
        return pathSegments[slugIndex] || null;
    }

    render() {
        const slug = this.get('slug');

        if (!slug) {
            return `
                <div class="container mx-auto flex items-center justify-center p-8">
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        Photo gallery not found
                    </div>
                </div>
            `;
        }

        return `
            <div class="container mx-auto px-4 py-8">
                <!-- Photo Gallery View Component -->
                <app-photo-gallery-view slug="${slug}"></app-photo-gallery-view>
            </div>
        `;
    }
}

customElements.define('app-photo-gallery-slug-page', PhotoGallerySlugPage);
export default PhotoGallerySlugPage; 