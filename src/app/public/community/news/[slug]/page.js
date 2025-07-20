import App from '@/core/App.js';
import '@/components/layout/publicLayout/NewsView.js';

/**
 * Individual News Page
 * 
 * Displays detailed information for a specific news article based on slug
 */
class NewsPage extends App {
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
                <app-news-view slug="${this.slug || ''}"></app-news-view>
            </div>
        `;
    }
}

customElements.define('app-news-page', NewsPage);
export default NewsPage; 