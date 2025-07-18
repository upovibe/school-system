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
            const response = await api.get('/pages/slug/about-us');
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
                <div class="mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-12">
                        <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            About Our School
                        </h2>
                        <div class="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            <!-- Content Column (Left) -->
                            <div class="p-8 lg:p-12 flex flex-col justify-center">
                                <div class="content-preview text-lg leading-relaxed">
                                    ${pageData.content}
                                </div>
                            </div>
                            
                            <!-- Banner Image Column (Right) -->
                            <div class="relative h-64 lg:h-auto">
                                <img src="/api/${pageData.banner_image}" 
                                     alt="About Our School" 
                                     class="w-full h-full object-cover"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                                    <div class="text-center">
                                        <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                        <p class="text-gray-500">About banner image</p>
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

customElements.define('about-section', AboutSection);
export default AboutSection; 