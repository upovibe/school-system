import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/NewsList.js';
import '@/components/ui/ContentDisplay.js';

/**
 * News Section Component
 * 
 * Displays news information with content from the news page
 */
class NewsSection extends App {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
    }

    loadDataFromProps() {
        // Get data from props/attributes
        const colorsAttr = this.getAttribute('colors');
        const pageDataAttr = this.getAttribute('page-data');
        const settingsAttr = this.getAttribute('settings');

        if (colorsAttr) {
            try {
                const colors = JSON.parse(colorsAttr);
                Object.entries(colors).forEach(([key, value]) => {
                    this.set(key, value);
                });
            } catch (error) {
                console.error('Error parsing colors:', error);
            }
        }

        if (pageDataAttr) {
            const pageData = unescapeJsonFromAttribute(pageDataAttr);
            if (pageData) {
                this.set('pageData', pageData);
            }
        }

        // Load news data from API
        this.loadNewsData();
    }

    async loadNewsData() {
        // This method is now handled by the NewsList component
        // Render with the loaded data
        this.render();
    }

    // Helper method to get proper image URL
    getImageUrl(imagePath) {
        if (!imagePath) return '';
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        
        // If it's a relative path without /, construct the URL
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    // Helper method to parse banner images from various formats
    getBannerImages(pageData) {
        if (!pageData || !pageData.banner_image) {
            return [];
        }

        let bannerImages = pageData.banner_image;

        // If it's a string, try to parse as JSON
        if (typeof bannerImages === 'string') {
            try {
                const parsed = JSON.parse(bannerImages);
                if (Array.isArray(parsed)) {
                    bannerImages = parsed;
                } else {
                    bannerImages = [bannerImages];
                }
            } catch (e) {
                // If parsing fails, treat as single path
                bannerImages = [bannerImages];
            }
        } else if (!Array.isArray(bannerImages)) {
            // If it's not an array, wrap in array
            bannerImages = [bannerImages];
        }

        // Filter out empty/null values
        return bannerImages.filter(img => img && img.trim() !== '');
    }

    render() {
        const pageData = this.get('pageData');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');

        // Only render if there's content
        if (!pageData?.content || pageData.content.trim() === '') {
            return '';
        }

        return `
            <!-- News Section -->
            <section class="mx-auto py-10">
                <!-- Banner Image at Top -->
                <div class="mb-8">
                    <div class="relative w-full h-96">
                        ${this.getBannerImages(pageData).length > 0 ? `
                            <img src="${this.getImageUrl(this.getBannerImages(pageData)[0])}" 
                                 alt="News Banner" 
                                 class="w-full h-full object-cover rounded-3xl shadow-lg"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        ` : ''}
                        <div class="absolute inset-0 ${this.getBannerImages(pageData).length > 0 ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-lg">
                            <div class="text-center">
                                <i class="fas fa-newspaper text-gray-400 text-4xl mb-2"></i>
                                <p class="text-gray-500 font-medium">News Banner</p>
                            </div>
                        </div>
                        <!-- Dark gradient overlay from bottom to top -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-3xl"></div>
                        
                        <!-- Content overlay -->
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="text-center text-white px-4">
                                <h1 class="text-2xl lg:text-3xl xl:text-4xl font-bold mb-2">${pageData.title || ''}</h1>
                                <p class="text-base lg:text-lg opacity-90">${pageData.subtitle || ''}</p>
                            </div>
                        </div> 
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Content Container -->
                    <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 flex-1 w-full">
                        <div class="p-5 lg:p-12">
                            <content-display 
                                content="${pageData.content.replace(/"/g, '&quot;')}"
                                no-styles>
                            </content-display>
                            
                            ${window.location.pathname !== '/public/community/news' ? `
                                <div class="mt-8">
                                    <a href="/public/community/news" 
                                       class="inline-flex items-center justify-center gap-2 px-6 py-1.5 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl group">
                                        View All News
                                        <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- News List Container -->
                    <news-list primary_color="${primaryColor}" secondary_color="${secondaryColor}"></news-list>
                </div>
            </section>
        `;
    }
}

customElements.define('news-section', NewsSection);
export default NewsSection; 