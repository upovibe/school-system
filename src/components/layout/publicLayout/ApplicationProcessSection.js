import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Application Process Section Component
 * 
 * Displays application process content with minimalistic design
 */
class ApplicationProcessSection extends App {
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

        // Render immediately with the data
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

        // Only render if there's content
        if (!pageData?.content || pageData.content.trim() === '') {
            return `
                <div class="text-center py-16">
                    <div class="bg-white rounded-lg shadow-sm p-8">
                        <i class="fas fa-tasks text-gray-400 text-4xl mb-4"></i>
                        <h2 class="text-xl font-medium text-gray-600 mb-2">Application Process</h2>
                        <p class="text-gray-500">Our application process is being prepared.</p>
                    </div>
                </div>
            `;
        }

        const bannerImages = this.getBannerImages(pageData);

        return `
            <!-- Application Process Section -->
            <section class="mx-auto">
                
                <!-- Hero Banner -->
                <div class="relative w-full h-[400px] overflow-hidden rounded-3xl mb-8">
                    ${bannerImages.length > 0 ? `
                        <img src="${this.getImageUrl(bannerImages[0])}" 
                             alt="Application Process Banner" 
                             class="w-full h-full object-cover rounded-3xl"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    ` : ''}
                    <div class="absolute inset-0 ${bannerImages.length > 0 ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl">
                        <div class="text-center text-gray-500">
                            <i class="fas fa-route text-4xl mb-3"></i>
                            <p class="text-lg font-medium">Application Process Banner</p>
                        </div>
                    </div>
                    <!-- Gradient overlay from dark bottom to transparent top -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-3xl"></div>
                    
                    <!-- Content overlay -->
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center text-white px-4">
                            <h1 class="text-2xl lg:text-3xl xl:text-4xl font-bold mb-2">${pageData.title || ''}</h1>
                            <p class="text-base lg:text-lg opacity-90">${pageData.subtitle || ''}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Minimal Content Section -->
                <div class="max-w-4xl mx-auto p-5">
                    <content-display 
                        content="${pageData.content.replace(/"/g, '&quot;')}"
                        no-styles>
                    </content-display>
                </div>
            </section>
        `;
    }
}

customElements.define('application-process-section', ApplicationProcessSection);
export default ApplicationProcessSection; 