import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import PageLoader from '@/components/common/PageLoader.js';

// Load Quill CSS for content display
if (!document.querySelector('link[href*="quill"]')) {
    const link = document.createElement('link');
    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

/**
 * Academics Section Component
 * 
 * Displays academics information with content from the academics page
 */
class AcademicsSection extends App {
    constructor() {
        super();
        this.pageData = null;
        this.academicsTitle = '';
        this.academicsSubtitle = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadAcademicsSettings();
        this.loadPageData();
    }

    async loadAcademicsSettings() {
        try {
            // Fetch academics title and subtitle from settings
            const academicsTitleResponse = await api.get('/settings/key/academics_title');
            const academicsSubtitleResponse = await api.get('/settings/key/academics_subtitle');
            
            if (academicsTitleResponse.data.success) {
                this.set('academicsTitle', academicsTitleResponse.data.data.setting_value);
            }
            
            if (academicsSubtitleResponse.data.success) {
                this.set('academicsSubtitle', academicsSubtitleResponse.data.data.setting_value);
            }
        } catch (error) {
            console.error('Error fetching academics settings:', error);
        }
    }

    async loadPageData() {
        try {
            await this.fetchPageData();
        } catch (error) {
            console.error('Error loading academics data:', error);
        }
    }

    async fetchPageData() {
        try {
            const response = await api.get('/pages/slug/academics');
            if (response.data.success) {
                const pageData = response.data.data;
                
                // Set local state and render
                this.set('pageData', pageData);
                this.render();
            }
        } catch (error) {
            console.error('Error fetching academics data:', error);
            this.set('error', 'Failed to load academics data');
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

        // Only render if there's content
        if (!pageData.content || pageData.content.trim() === '') {
            return '';
        }

        return `
            <!-- Academics Section -->
            <section class="py-10 bg-gray-50">
                <div class="mx-auto ">
                    <div class="text-center mb-12">
                        <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            ${this.get('academicsTitle')}
                        </h2>
                        <p class="text-lg text-gray-600 mb-4">
                            ${this.get('academicsSubtitle')}
                        </p>
                        <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            <!-- Banner Image Column (Left) -->
                            <div class="relative h-64 lg:h-auto">
                                <img src="/api/${pageData.banner_image}" 
                                     alt="Academics" 
                                     class="w-full h-full object-cover"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                                    <div class="text-center">
                                        <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                        <p class="text-gray-500">Academics banner image</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Content Column (Right) -->
                            <div class="p-5 lg:p-12 flex flex-col justify-center">
                                <div class="content-preview text-lg leading-relaxed">
                                    ${pageData.content}
                                </div>
                                
                                <div class="mt-8">
                                    <a href="/public/academics" 
                                       class="inline-flex items-center justify-center gap-2 px-6 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl group">
                                        Learn More
                                        <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('academics-section', AcademicsSection);
export default AcademicsSection; 