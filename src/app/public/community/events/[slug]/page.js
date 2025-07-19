import App from '@/core/App.js';
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

    connectedCallback() {
        super.connectedCallback();
        console.log('EventPage connectedCallback called'); // Debug log
        
        // Get slug from URL path
        const pathSegments = window.location.pathname.split('/');
        this.slug = pathSegments[pathSegments.length - 1];
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