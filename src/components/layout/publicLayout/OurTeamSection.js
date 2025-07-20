import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Our Team Section Component
 * 
 * Displays team content with a unique design layout
 */
class OurTeamSection extends App {
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
        if (!imagePath) return null;
        
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
                    <div class="bg-white rounded-3xl shadow-lg p-8">
                        <i class="fas fa-users text-gray-400 text-6xl mb-4"></i>
                        <h2 class="text-2xl font-semibold text-gray-600 mb-2">Our Team</h2>
                        <p class="text-gray-500">Our team information is being prepared.</p>
                    </div>
                </div>
            `;
        }

        const bannerImages = this.getBannerImages(pageData);

        return `
            <!-- Our Team Section -->
            <section class="mx-auto py-10">
                <!-- Team Hero Banner -->
                ${bannerImages.length > 0 ? `
                    <div class="mb-16">
                        <div class="relative">
                            <!-- Main Banner Image with Team Styling -->
                            <div class="relative w-full h-[500px] overflow-hidden">
                                <img src="${this.getImageUrl(bannerImages[0])}" 
                                     alt="Our Team Banner" 
                                     class="w-full h-full object-cover"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}]">
                                    <div class="text-center text-white">
                                        <i class="fas fa-users text-6xl mb-4"></i>
                                        <p class="text-xl">Our Team</p>
                                    </div>
                                </div>
                                <!-- Team specific overlay -->
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                
                                <!-- Team Content Overlay -->
                                <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
                                    <div class="max-w-4xl mx-auto">
                                        <div class="flex items-center gap-4 mb-4">
                                            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <i class="fas fa-users text-2xl"></i>
                                            </div>
                                            <div>
                                                <h1 class="text-4xl lg:text-5xl font-bold mb-2">Our Team</h1>
                                                <p class="text-lg opacity-90">Dedicated educators committed to excellence</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Team Gallery -->
                        ${bannerImages.length > 1 ? `
                            <div class="mt-12">
                                <h2 class="text-3xl font-bold text-[${secondaryColor}] mb-8 text-center">Meet Our Team</h2>
                                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    ${bannerImages.slice(1).map((imagePath, index) => `
                                        <div class="relative group">
                                            <div class="relative w-full aspect-square overflow-hidden rounded-full">
                                                <img src="${this.getImageUrl(imagePath)}" 
                                                     alt="Team Member ${index + 2}" 
                                                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                                <div class="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}] rounded-full">
                                                    <div class="text-center text-white">
                                                        <i class="fas fa-user text-lg mb-1"></i>
                                                        <p class="text-xs">Image not found</p>
                                                    </div>
                                                </div>
                                                <!-- Hover overlay -->
                                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <!-- Team Content Section -->
                <div class="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                    <div class="p-8 lg:p-16">
                        <!-- Team Header -->
                        <div class="text-center mb-12">
                            <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}] rounded-full mb-6">
                                <i class="fas fa-users text-white text-2xl"></i>
                            </div>
                            <h2 class="text-3xl lg:text-4xl font-bold text-[${secondaryColor}] mb-4">Our Dedicated Team</h2>
                            <div class="w-24 h-1 bg-gradient-to-r from-[${secondaryColor}] to-[${primaryColor}] mx-auto rounded-full"></div>
                        </div>
                        
                        <!-- Content Display -->
                        <div class="max-w-4xl mx-auto">
                            <content-display 
                                content="${pageData.content.replace(/"/g, '&quot;')}"
                                no-styles>
                            </content-display>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('our-team-section', OurTeamSection);
export default OurTeamSection; 