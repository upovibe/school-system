import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import { setDocumentTitle } from '@/utils/appSettings.js';
import '@/components/layout/publicLayout/AnnouncementSection.js';

// Load Quill CSS for content display
if (!document.querySelector('link[href*="quill"]')) {
    const link = document.createElement('link');
    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

/**
 * Announcements Page Component (/community/announcements)
 * 
 * This is the announcements page of the application.
 * It renders within the global RootLayout and fetches data for the "announcements" slug.
 * File-based routing: /community/announcements → app/public/community/announcements/page.js
 */
class AnnouncementsPage extends App {
    async connectedCallback() {
        super.connectedCallback();
        await this.loadAllData();
        await setDocumentTitle('Announcements');
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load announcements page data
            const announcementsPageData = await this.fetchPageData('announcements');

            // Load announcement settings
            const settingsData = await this.loadAnnouncementSettings();

            // Combine all data
            const allData = {
                colors,
                page: announcementsPageData,
                settings: settingsData
            };

            // Cache in global store
            store.setState({ announcementsPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading announcements data:', error);
            this.set('error', 'Failed to load announcements page data');
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

    async loadAnnouncementSettings() {
        try {
            const settingsKeys = [
                'announcement_title', 'announcement_subtitle'
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

    // Method to refresh data (clear cache and fetch again)
    async refreshData() {
        // Clear the cache
        store.setState({ announcementsPageData: null });
        
        // Fetch fresh data
        await this.loadAllData();
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
                <!-- Announcement Section Component -->
                <announcement-section 
                    colors='${colorsData}'
                    page-data='${escapeJsonForAttribute(allData.page)}'
                    settings='${escapeJsonForAttribute({
                        announcement_title: allData.settings.announcement_title,
                        announcement_subtitle: allData.settings.announcement_subtitle
                    })}'>
                </announcement-section>
            </div>
        `;
    }
}

customElements.define('app-announcements-page', AnnouncementsPage);
export default AnnouncementsPage; 