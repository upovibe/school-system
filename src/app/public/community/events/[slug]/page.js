import App from '@/core/App.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/EventView.js';

/**
 * Individual Event Page
 * 
 * Displays detailed information for a specific event based on slug
 */
class EventPage extends App {
    constructor() {
        super();
        this.slug = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        
        // Get slug from URL path
        const pathSegments = window.location.pathname.split('/');
        this.slug = pathSegments[pathSegments.length - 1];
        
        await setDocumentTitle('Event');
    }

    render() {
        return `
            <div class="min-h-screen bg-gray-50">
                <app-event-view slug="${this.slug || ''}"></app-event-view>
            </div>
        `;
    }
}

customElements.define('app-event-page', EventPage);
export default EventPage;