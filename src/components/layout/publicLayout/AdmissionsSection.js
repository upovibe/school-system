import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Admissions Section Component
 * 
 * Displays admissions content with unique creative cards for requirements and application process
 */
class AdmissionsSection extends App {
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
                        <i class="fas fa-graduation-cap text-gray-400 text-4xl mb-4"></i>
                        <h2 class="text-xl font-medium text-gray-600 mb-2">Admissions</h2>
                        <p class="text-gray-500">Our admissions information is being prepared.</p>
                    </div>
                </div>
            `;
        }

        const bannerImages = this.getBannerImages(pageData);

        return `
            <!-- Admissions Section -->
            <section class="mx-auto">
                <!-- Hero Banner -->
                ${bannerImages.length > 0 ? `
                    <div class="relative w-full h-[400px] overflow-hidden rounded-3xl mb-8">
                        <img src="${this.getImageUrl(bannerImages[0])}" 
                             alt="Admissions Banner" 
                             class="w-full h-full object-cover rounded-3xl"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="absolute inset-0 hidden items-center justify-center bg-gray-100 rounded-3xl">
                            <div class="text-center text-gray-500">
                                <i class="fas fa-image text-3xl mb-2"></i>
                                <p>Banner image</p>
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
                ` : ''}
                
                <!-- Content Section -->
                <div class="max-w-4xl mx-auto p-5 pb-16">
                    <content-display 
                        content="${pageData.content.replace(/"/g, '&quot;')}"
                        no-styles>
                    </content-display>
                </div>
                
                <!-- Unique Cards Section -->
                <div class="max-w-6xl mx-auto px-6 py-16">
                    <!-- Section Header -->
                    <div class="text-center mb-16">
                        <h2 class="text-3xl lg:text-4xl font-bold text-[${secondaryColor}] mb-4">
                            Start Your Journey
                        </h2>
                        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                            Discover the requirements and application process to join our school community
                        </p>
                        <div class="w-24 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] mx-auto rounded-full mt-6"></div>
                    </div>
                    
                    <!-- Unique Cards Layout -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <!-- Requirements Card - Unique Design -->
                        <a href="/public/admissions/requirements" class="block group">
                            <div class="relative">
                                <div class="absolute inset-0 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                                <div class="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                                    <!-- Card Header with Pattern -->
                                    <div class="relative h-24 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] overflow-hidden">
                                        <!-- Geometric Pattern -->
                                        <div class="absolute inset-0 opacity-20">
                                            <div class="absolute top-3 left-3 w-6 h-6 border-2 border-white/30 rounded-lg rotate-45"></div>
                                            <div class="absolute top-8 right-6 w-4 h-4 border-2 border-white/20 rounded-full"></div>
                                            <div class="absolute bottom-6 left-8 w-3 h-3 border-2 border-white/40 rotate-45"></div>
                                            <div class="absolute bottom-3 right-3 w-8 h-8 border-2 border-white/25 rounded-lg"></div>
                                        </div>
                                        
                                        <!-- Icon Container -->
                                        <div class="absolute inset-0 flex items-center justify-center">
                                            <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-300">
                                                <i class="fas fa-clipboard-list text-white text-lg"></i>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Card Content -->
                                    <div class="p-4 text-center">
                                        <h3 class="text-lg font-bold text-[${secondaryColor}] group-hover:text-[${primaryColor}] transition-colors duration-300">
                                            Requirements
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </a>
                        
                        <!-- Application Process Card - Unique Design -->
                        <a href="/public/admissions/process" class="block group">
                            <div class="relative">
                                <div class="absolute inset-0 bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}] rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                                <div class="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                                    <!-- Card Header with Pattern -->
                                    <div class="relative h-24 bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}] overflow-hidden">
                                        <!-- Geometric Pattern -->
                                        <div class="absolute inset-0 opacity-20">
                                            <div class="absolute top-4 right-4 w-6 h-6 border-2 border-white/30 rounded-lg rotate-45"></div>
                                            <div class="absolute top-10 left-4 w-4 h-4 border-2 border-white/20 rounded-full"></div>
                                            <div class="absolute bottom-4 right-8 w-3 h-3 border-2 border-white/40 rotate-45"></div>
                                            <div class="absolute bottom-4 left-4 w-8 h-8 border-2 border-white/25 rounded-lg"></div>
                                        </div>
                                        
                                        <!-- Icon Container -->
                                        <div class="absolute inset-0 flex items-center justify-center">
                                            <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-300">
                                                <i class="fas fa-route text-white text-lg"></i>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Card Content -->
                                    <div class="p-4 text-center">
                                        <h3 class="text-lg font-bold text-[${secondaryColor}] group-hover:text-[${primaryColor}] transition-colors duration-300">
                                            Application Process
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('admissions-section', AdmissionsSection);
export default AdmissionsSection; 