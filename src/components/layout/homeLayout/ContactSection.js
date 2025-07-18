import App from '@/core/App.js';
import api from '@/services/api.js';

/**
 * Contact Section Component
 * 
 * Displays a contact banner with call-to-action overlay using page data
 */
class ContactSection extends App {
    constructor() {
        super();
        this.pageData = null;
        this.contactTitle = '';
        this.contactSubtitle = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadContactSettings();
        this.loadPageData();
    }

    async loadContactSettings() {
        try {
            // Fetch contact title and subtitle from settings
            const contactTitleResponse = await api.get('/settings/key/contact_title');
            const contactSubtitleResponse = await api.get('/settings/key/contact_subtitle');

            if (contactTitleResponse.data.success) {
                this.set('contactTitle', contactTitleResponse.data.data.setting_value);
            }

            if (contactSubtitleResponse.data.success) {
                this.set('contactSubtitle', contactSubtitleResponse.data.data.setting_value);
            }
        } catch (error) {
            console.error('Error fetching contact settings:', error);
        }
    }

    async loadPageData() {
        try {
            await this.fetchPageData();
        } catch (error) {
            console.error('Error loading contact data:', error);
        }
    }

    async fetchPageData() {
        try {
            const response = await api.get('/pages/slug/contact');
            if (response.data.success) {
                const pageData = response.data.data;

                // Set local state and render
                this.set('pageData', pageData);
                this.render();
            }
        } catch (error) {
            console.error('Error fetching contact data:', error);
            this.set('error', 'Failed to load contact data');
        }
    }

    render() {
        const pageData = this.get('pageData');
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

        // Don't show loading if pageData is null - just return empty
        // This prevents duplicate loading spinners
        if (!pageData) {
            return '';
        }

        return `
            <!-- Contact Section -->
            <section class="mx-auto py-16 px-4">
                <div class="max-w-6xl mx-auto">
                    <!-- Contact Banner Card -->
                    <div class="relative group rounded-3xl overflow-hidden shadow-2xl">
                        <!-- Banner Background -->
                        <div class="relative h-64 lg:h-80 overflow-hidden">
                            <img src="/api/${pageData.banner_image}" 
                                 alt="Contact Us" 
                                 class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
                                <div class="text-center">
                                    <i class="fas fa-envelope text-green-400 text-4xl mb-2"></i>
                                    <p class="text-green-600 font-medium">Contact banner</p>
                                </div>
                            </div>
                            
                            <!-- Overlay with content -->
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            
                            <!-- Content overlay -->
                            <div class="absolute inset-0 flex items-center justify-center">
                                <div class="text-center text-white relative z-10 px-6">
                                    <!-- Header with animated icon -->
                                    <div class="flex justify-center mb-6">
                                        <div class="size-16 min-w-16 min-h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300 border border-white/30">
                                            <i class="fas fa-envelope text-white text-2xl animate-pulse"></i>
                                        </div>
                                    </div>
                                    
                                    <!-- Title and Subtitle -->
                                    <h2 class="text-3xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                                        ${this.get('contactTitle')}
                                    </h2>
                                    <p class="text-lg lg:text-xl mb-8 max-w-2xl mx-auto opacity-90 drop-shadow-md">
                                        ${this.get('contactSubtitle')}
                                    </p>
                                    
                                    <!-- Call to Action Button -->
                                    <div class="flex justify-center">
                                        <a href="/contact" 
                                           class="inline-flex items-center px-8 py-4 bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group border border-white/30 hover:bg-white/30">
                                            <span>Contact Us</span>
                                            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('contact-section', ContactSection);
export default ContactSection; 