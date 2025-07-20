import App from '@/core/App.js';
import api from '@/services/api.js';
import PageLoader from '@/components/common/PageLoader.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import { escapeJsonForAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/ContactSectionAlt.js';

/**
 * Contact Page Component (/contact)
 * 
 * This is the contact page that displays contact information and form.
 * It now uses the same centralized data loading approach as other pages.
 * File-based routing: /contact → app/public/contact/page.js
 */
class ContactPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Contact | UPO UI';
        this.loadAllData();
    }

    async loadAllData() {
        try {
            // Load colors first
            const colors = await fetchColorSettings();
            
            // Load contact settings
            const settingsData = await this.loadContactSettings();

            // Combine all data
            const allData = {
                colors,
                settings: settingsData
            };

            // Cache in global store
            store.setState({ contactPageData: allData });
            
            // Set local state and render
            this.set('allData', allData);
            this.render();

        } catch (error) {
            console.error('Error loading contact data:', error);
            this.set('error', 'Failed to load contact page data');
        }
    }

    async loadContactSettings() {
        try {
            const settingsKeys = [
                'contact_title', 'contact_subtitle', 'contact_address', 'contact_phone', 'contact_email',
                'map_location_name', 'map_address', 'map_latitude', 'map_longitude', 'map_embed_url', 'map_zoom_level'
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
                <!-- Contact Section Alt Component -->
                <contact-section-alt 
                    colors='${colorsData}'
                    settings='${escapeJsonForAttribute({
                        contact_title: allData.settings.contact_title,
                        contact_subtitle: allData.settings.contact_subtitle,
                        contact_address: allData.settings.contact_address,
                        contact_phone: allData.settings.contact_phone,
                        contact_email: allData.settings.contact_email,
                        map_location_name: allData.settings.map_location_name,
                        map_address: allData.settings.map_address,
                        map_latitude: allData.settings.map_latitude,
                        map_longitude: allData.settings.map_longitude,
                        map_embed_url: allData.settings.map_embed_url,
                        map_zoom_level: allData.settings.map_zoom_level
                    })}'>
                </contact-section-alt>
            </div>
        `;
    }
}

customElements.define('app-contact-page', ContactPage);
export default ContactPage; 