import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/OurTeamSection.js';

/**
 * Our Team Page Component (/about-us/our-team)
 * 
 * This is the our team page of the application.
 * It now uses the same centralized data loading approach as other pages.
 * File-based routing: /about-us/our-team → app/public/about-us/our-team/page.js
 */
class OurTeamPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        await this.loadAllData();
        await setDocumentTitle('Our Team');
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load our team page data
            const pageData = await this.fetchPageData();

            // Load team members data
            const teamMembers = await this.fetchTeamMembers();

            // Combine all data
            const allData = {
                colors,
                page: pageData,
                teamMembers
            };

            // Cache in global store
            store.setState({ ourTeamPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading our team data:', error);
            this.set('error', 'Failed to load our team page data');
        }
    }

    async fetchPageData() {
        // Check if data is already cached in global store
        const globalState = store.getState();
        if (globalState.ourTeamPageContentData) {
            return globalState.ourTeamPageContentData;
        }

        // If not cached, fetch from API
        try {
            const response = await api.get('/pages/slug/our-team');
            if (response.data.success) {
                const pageData = response.data.data;
                
                // Cache the data in global store
                store.setState({ ourTeamPageContentData: pageData });
                
                return pageData;
            }
        } catch (error) {
            console.error('Error fetching our team page data:', error);
            return null;
        }
    }

    async fetchTeamMembers() {
        // Check if data is already cached in global store
        const globalState = store.getState();
        if (globalState.ourTeamMembersData) {
            return globalState.ourTeamMembersData;
        }

        // If not cached, fetch from API
        try {
            const response = await api.get('/teams/public');
            if (response.data.success) {
                const teamMembers = response.data.data;
                
                // Cache the data in global store
                store.setState({ ourTeamMembersData: teamMembers });
                
                return teamMembers;
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
            return [];
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
                <!-- Our Team Section Component -->
                <our-team-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'
                    team-members='${escapeJsonForAttribute(allData.teamMembers)}'>
                </our-team-section>
            </div>
        `;
    }
}

customElements.define('app-our-team-page', OurTeamPage);
export default OurTeamPage;
