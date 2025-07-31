import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import '@/components/layout/publicLayout/RequirementsSection.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { setDocumentTitle } from '@/utils/appSettings.js';

/**
 * Admissions Requirements Page Component (/admissions/requirements)
 * 
 * This is the admissions requirements page of the application.
 * It renders within the global RootLayout and fetches data for the "requirements" slug.
 * File-based routing: /admissions/requirements → app/public/admissions/requirements/page.js
 */
class AdmissionsRequirementsPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        await this.loadPageData();
        await setDocumentTitle('Admissions Requirements');
    }

    async loadPageData() {
        // Check if data is already cached in global store
        const globalState = store.getState();
        if (globalState.admissionsRequirementsPageData && globalState.colors) {
            this.set('pageData', globalState.admissionsRequirementsPageData);
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
                api.get('/pages/slug/requirements'),
                fetchColorSettings()
            ]);

            if (pageResponse.data.success) {
                const pageData = pageResponse.data.data;
                
                // Cache the data in global store
                store.setState({ 
                    admissionsRequirementsPageData: pageData,
                    colors: colors
                });
                
                // Set local state and render
                this.set('pageData', pageData);
                this.set('colors', colors);
                this.render();
            }
        } catch (error) {
            console.error('Error fetching admissions requirements page data:', error);
            this.set('error', 'Failed to load admissions requirements page data');
        }
    }

    async refreshData() {
        // Clear the cache
        store.setState({ admissionsRequirementsPageData: null });
        
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
            <requirements-section 
                colors='${JSON.stringify(colors)}'
                page-data='${JSON.stringify(pageData).replace(/'/g, "&apos;")}'>
            </requirements-section>
        `;
    }
}

customElements.define('app-admissions-requirements-page', AdmissionsRequirementsPage);
export default AdmissionsRequirementsPage; 