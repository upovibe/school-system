import App from '@/core/App.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/NewsView.js';

/**
 * Individual News Page
 * 
 * Displays detailed information for a specific news article based on slug
 */
class NewsArticlePage extends App {
    constructor() {
        super();
        this.slug = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        
        // Get slug from URL path
        const pathSegments = window.location.pathname.split('/');
        this.slug = pathSegments[pathSegments.length - 1];
        
        await setDocumentTitle('News Article');
    }

    render() {
        return `
            <div class="min-h-screen bg-gray-50">
                <app-news-view slug="${this.slug || ''}"></app-news-view>
            </div>
        `;
    }
}

customElements.define('app-news-article-page', NewsArticlePage);
export default NewsArticlePage; 