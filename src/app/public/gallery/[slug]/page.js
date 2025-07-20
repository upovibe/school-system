import App from '@/core/App.js';
import '@/components/layout/publicLayout/PhotoGalleryView.js';

/**
 * Individual Gallery Page
 * 
 * Displays detailed information for a specific gallery based on slug
 */
class GallerySlugPage extends App {
    constructor() {
        super();
        this.slug = null;
    }

    connectedCallback() {
        super.connectedCallback();
        
        // Get slug from URL path
        const pathSegments = window.location.pathname.split('/');
        this.slug = pathSegments[pathSegments.length - 1];
    }

    render() {
        return `
            <div class="min-h-screen bg-gray-50">
                <app-photo-gallery-view slug="${this.slug || ''}"></app-photo-gallery-view>
            </div>
        `;
    }
}

customElements.define('app-gallery-slug-page', GallerySlugPage);
export default GallerySlugPage; 