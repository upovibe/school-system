import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/EventsSection.js';

/**
 * Events Page Component (/community/events)
 * 
 * This is the events page of the application.
 * It now uses the same centralized data loading approach as the community page.
 * File-based routing: /community/events → app/public/community/events/page.js
 */
class EventsPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Events | UPO UI';
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load events page data
            const eventsPageData = await this.fetchPageData('events');

            // Combine all data
            const allData = {
                colors,
                page: eventsPageData
            };

            // Cache in global store
            store.setState({ eventsPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading events data:', error);
            this.set('error', 'Failed to load events page data');
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
                <!-- Events Section Component -->
                <events-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'>
                </events-section>
            </div>
        `;
    }
}

customElements.define('app-events-page', EventsPage);
export default EventsPage; 