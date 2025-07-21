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
        // 1. Check DB connection first
        try {
            const dbCheck = await fetch('/api/db/check').then(r => r.json());
            if (!dbCheck.success) {
                this.set('dbNotConnected', true);
                this.render();
                return;
            }
        } catch (e) {
            this.set('dbNotConnected', true);
            this.render();
            return;
        }
        // 2. If connected, load data as usual
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load all page data in parallel
            const [homePageData, aboutPageData, academicsPageData, communityPageData, contactPageData] = await Promise.all([
                this.fetchPageData('home'),
                this.fetchPageData('about-us'),
                this.fetchPageData('academics'),
                this.fetchPageData('community'),
                this.fetchPageData('contact')
            ]);

            // Load all settings in parallel
            const settingsData = await this.loadAllSettings();

            // Combine all data
            const allData = {
                colors,
                pages: {
                    home: homePageData,
                    about: aboutPageData,
                    academics: academicsPageData,
                    community: communityPageData,
                    contact: contactPageData
                },
                settings: settingsData
            };

            // Cache in global store
            store.setState({ homePageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading all data:', error);
            this.set('error', 'Failed to load page data');
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

    async loadAllSettings() {
        try {
            const settingsKeys = [
                'hero_title', 'hero_subtitle',
                'about_title', 'about_subtitle',
                'academics_title', 'academics_subtitle',
                'community_title', 'community_subtitle',
                'contact_title', 'contact_subtitle',
                'school_logo', 'contact_email', 'contact_phone',
                'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url', 'youtube_url'
            ];

            const settingsPromises = settingsKeys.map(async (key) => {
                try {
                    const response = await api.get(`/settings/key/${key}`);
                    return response.data.success ? { key, value: response.data.data.setting_value } : null;
                } catch (error) {
                    console.error(`Error fetching setting ${key}:`, error);
                    return null;
                }
            });

            const settingsResults = await Promise.all(settingsPromises);
            
            // Convert to object
            const settingsObject = {};
            settingsResults.forEach(result => {
                if (result) {
                    settingsObject[result.key] = result.value;
                }
            });

            return settingsObject;
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    render() {
        if (this.get('dbNotConnected')) {
            return `<db-setup-dialog></db-setup-dialog>`;
        }
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
        const pagesData = escapeJsonForAttribute(allData.pages);
        const settingsData = escapeJsonForAttribute(allData.settings);

        return `
            <div class="mx-auto">
                <!-- Hero Section Component -->
                <hero-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.pages.home)}'
                    settings='${escapeJsonForAttribute({
                        hero_title: allData.settings.hero_title,
                        hero_subtitle: allData.settings.hero_subtitle
                    })}'>
                </hero-section>
                
                <!-- About Section Component -->
                <about-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.pages.about)}'
                    settings='${escapeJsonForAttribute({
                        about_title: allData.settings.about_title,
                        about_subtitle: allData.settings.about_subtitle
                    })}'>
                </about-section>
                
                <!-- Academics Section Component -->
                <academics-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.pages.academics)}'
                    settings='${escapeJsonForAttribute({
                        academics_title: allData.settings.academics_title,
                        academics_subtitle: allData.settings.academics_subtitle
                    })}'>
                </academics-section>
                
                <!-- Community Section Component -->
                <community-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.pages.community)}'
                    settings='${escapeJsonForAttribute({
                        community_title: allData.settings.community_title,
                        community_subtitle: allData.settings.community_subtitle
                    })}'>
                </community-section>

                <!-- Contact Section Component -->
                <contact-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.pages.contact)}'
                    settings='${escapeJsonForAttribute({
                        contact_title: allData.settings.contact_title,
                        contact_subtitle: allData.settings.contact_subtitle,
                    })}'>
                </contact-section>
            </div>
        `;
    }
}

customElements.define('app-root-page', RootPage);
export default RootPage; 