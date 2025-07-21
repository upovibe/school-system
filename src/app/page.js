import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/HeroSection.js';
import '@/components/layout/publicLayout/AboutSection.js';
import '@/components/layout/publicLayout/AcademicsSection.js';
import '@/components/layout/publicLayout/CommunitySection.js';
import '@/components/layout/publicLayout/ContactSection.js';
import '@/components/layout/DbSetupDialog.js';

/**
 * Root Page Component (/)
 *
 * This is the home page of the application.
 * It now renders within the global RootLayout.
 */
class RootPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        document.title = 'Home';

        try {
            const response = await api.get('/db/check');
            if (!response.data.success) {
                this.set('dbNotConnected', true);
                return;
            }
        } catch (error) {
            this.set('dbNotConnected', true);
            return;
        }

        this.set('dbNotConnected', false);
        await this.loadAllData();
    }

    async loadAllData() {
        this.set('allData', null).set('error', null);

        try {
            const colors = await fetchColorSettings();
            const pages = await this.fetchAllPages();
            const settings = await this.loadAllSettings();

            const allData = { colors, pages, settings };
            store.setState({ homePageData: allData });
            this.set('allData', allData);
        } catch (error) {
            console.error('Error loading all data:', error);
            this.set('error', 'Failed to load page data');
        }
    }

    async fetchAllPages() {
        const pageSlugs = ['home', 'about-us', 'academics', 'community', 'contact'];
        const pagePromises = pageSlugs.map(slug => this.fetchPageData(slug));
        const pages = await Promise.all(pagePromises);
        return {
            home: pages[0],
            about: pages[1],
            academics: pages[2],
            community: pages[3],
            contact: pages[4],
        };
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

    async loadAllSettings() {
        try {
            const response = await api.get('/settings/group/public');
            if (response.data.success) {
                const settingsObject = {};
                response.data.data.forEach(item => {
                    settingsObject[item.setting_key] = item.setting_value;
                });
                return settingsObject;
            }
            return {};
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    renderSection(sectionName, data) {
        const { colors, pages, settings } = data;
        const pageDataKey = sectionName.split('-')[0];
        const pageData = pages[pageDataKey];

        const sectionSettings = Object.entries(settings)
            .filter(([key]) => key.startsWith(pageDataKey))
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});

        return `
            <${sectionName}-section
                colors='${escapeJsonForAttribute(colors)}'
                page-data='${escapeJsonForAttribute(pageData)}'
                settings='${escapeJsonForAttribute(sectionSettings)}'>
            </${sectionName}-section>
        `;
    }

    render() {
        if (this.get('dbNotConnected')) {
            return `<db-setup-dialog></db-setup-dialog>`;
        }

        const error = this.get('error');
        if (error) {
            return `<div class="container mx-auto flex items-center justify-center p-8">
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            ${error}
                        </div>
                    </div>`;
        }

        const allData = this.get('allData');
        if (!allData) {
            return `<div class="container flex items-center justify-center mx-auto p-8">
                        <page-loader></page-loader>
                    </div>`;
        }

        return `
            <div class="mx-auto">
                ${this.renderSection('hero', allData)}
                ${this.renderSection('about', allData)}
                ${this.renderSection('academics', allData)}
                ${this.renderSection('community', allData)}
                ${this.renderSection('contact', allData)}
            </div>
        `;
    }
}

customElements.define('app-root-page', RootPage);
export default RootPage; 