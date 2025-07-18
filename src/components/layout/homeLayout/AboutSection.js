import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import PageLoader from '@/components/common/PageLoader.js';

/**
 * About Section Component
 * 
 * Displays information about the school with content from the home page
 */
class AboutSection extends App {
    constructor() {
        super();
        this.pageData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadPageData();
    }

    async loadPageData() {
        // Check if data is already cached in global store
        const globalState = store.getState();
        if (globalState.homePageData) {
            this.set('pageData', globalState.homePageData);
            this.render();
            return;
        }

        // If not cached, wait a bit for HeroSection to load it first
        setTimeout(async () => {
            const updatedState = store.getState();
            if (updatedState.homePageData) {
                this.set('pageData', updatedState.homePageData);
                this.render();
            } else {
                // Only fetch if HeroSection hasn't loaded it yet
                await this.fetchPageData();
            }
        }, 100);
    }

    async fetchPageData() {
        try {
            const response = await api.get('/pages/slug/home');
            if (response.data.success) {
                const pageData = response.data.data;
                
                // Cache the data in global store
                store.setState({ homePageData: pageData });
                
                // Set local state and render
                this.set('pageData', pageData);
                this.render();
            }
        } catch (error) {
            console.error('Error fetching page data:', error);
            this.set('error', 'Failed to load page data');
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
            <!-- About Section -->
            <section class="py-16 bg-gray-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-12">
                        <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            About Our School
                        </h2>
                        <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-lg p-8 lg:p-12">
                        <div class="prose prose-lg max-w-none">
                            <div class="content-section">
                                <div class="content-preview text-lg leading-relaxed text-gray-700">
                                    ${pageData.content}
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-8 text-center">
                            <a href="/public/about-us" 
                               class="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
                                <i class="fas fa-arrow-right mr-2"></i>
                                Learn More About Us
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('about-section', AboutSection);
export default AboutSection; 