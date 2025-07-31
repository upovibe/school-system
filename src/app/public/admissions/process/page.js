import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import '@/components/layout/publicLayout/ApplicationProcessSection.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { setDocumentTitle } from '@/utils/appSettings.js';

/**
 * Admissions Process Page Component (/admissions/process)
 * 
 * This is the admissions process page of the application.
 * It renders within the global RootLayout and fetches data for the "process" slug.
 * File-based routing: /admissions/process → app/public/admissions/process/page.js
 */
class AdmissionsProcessPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        await this.loadPageData();
        await setDocumentTitle('Admissions Process');
    }

    async loadPageData() {
        // Check if data is already cached in global store
        const globalState = store.getState();
        if (globalState.admissionsProcessPageData && globalState.colors) {
            this.set('pageData', globalState.admissionsProcessPageData);
            this.set('colors', globalState.colors);
            this.render();
            return;
        }

        // If not cached, fetch from API
        await this.fetchPageData();
    }

    async fetchPageData() {
        try {
            // Fetch page data and colors in parallel
            const [pageResponse, colors] = await Promise.all([
                api.get('/pages/slug/process'),
                fetchColorSettings()
            ]);

            if (pageResponse.data.success) {
                const pageData = pageResponse.data.data;
                
                // Cache the data in global store
                store.setState({ 
                    admissionsProcessPageData: pageData,
                    colors: colors
                });
                
                // Set local state and render
                this.set('pageData', pageData);
                this.set('colors', colors);
                this.render();
            }
        } catch (error) {
            console.error('Error fetching admissions process page data:', error);
            this.set('error', 'Failed to load admissions process page data');
        }
    }

    async refreshData() {
        // Clear the cache
        store.setState({ admissionsProcessPageData: null });
        
        // Fetch fresh data
        await this.fetchPageData();
    }

    render() {
        const pageData = this.get('pageData');
        const colors = this.get('colors');
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

        if (!pageData || !colors) {
            return `
                <div class="container flex items-center justify-center mx-auto p-8">
                    <page-loader></page-loader>
                </div>
            `;
        }

        return `
            <application-process-section 
                colors='${JSON.stringify(colors)}'
                page-data='${JSON.stringify(pageData).replace(/'/g, "&apos;")}'>
            </application-process-section>
        `;
    }
}

customElements.define('app-admissions-process-page', AdmissionsProcessPage);
export default AdmissionsProcessPage; 