import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Announcement Section Component
 * 
 * Displays announcement content with images, following the same pattern as AboutSection
 */
class AnnouncementSection extends App {
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

        if (settingsAttr) {
            const settings = unescapeJsonFromAttribute(settingsAttr);
            if (settings) {
                if (settings.announcement_title) this.set('announcementTitle', settings.announcement_title);
                if (settings.announcement_subtitle) this.set('announcementSubtitle', settings.announcement_subtitle);
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
        const textColor = this.get('text_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');

        // Only render if there's content
        if (!pageData?.content || pageData.content.trim() === '') {
            return '';
        }

        return `
            <!-- Announcement Section -->
            <section class="mx-auto py-10">
                    <div class="text-center mb-12">
                        <h2 class="text-3xl lg:text-4xl font-bold text-[${primaryColor}] mb-4">
                            ${pageData.title || ''}
                        </h2>
                        <p class="text-lg opacity-80 mb-4">
                            ${pageData.subtitle || ''}
                        </p>
                        <div class="w-24 h-1 bg-[${primaryColor}] mx-auto rounded-full"></div>
                    </div>
                    
                    <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            <!-- Content Column (Left) -->
                            <div class="p-5 lg:p-12 flex flex-col justify-center">
                                <content-display 
                                    content="${pageData.content.replace(/"/g, '&quot;')}"
                                    no-styles>
                                </content-display>
                                
                                ${window.location.pathname !== '/public/community/announcements' ? `
                                    <div class="mt-8">
                                        <a href="/public/community/announcements" 
                                           class="inline-flex items-center justify-center gap-2 px-6 py-1.5 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl group">
                                            Read More
                                            <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                        </a>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- Banner Image Column (Right) -->
                            <div class="relative h-64 lg:h-auto">
                                ${pageData.banner_image ? 
                                    `<img src="/api/${pageData.banner_image}" 
                                         alt="Announcement Banner" 
                                         class="w-full h-full object-cover"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                                    ''
                                }
                                <div class="absolute inset-0 ${pageData.banner_image ? 'hidden' : 'flex'} items-center justify-center bg-gray-100">
                                    <div class="text-center">
                                        <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                        <p class="text-gray-500 font-medium">Announcement banner image</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </section>
        `;
    }
}

customElements.define('announcement-section', AnnouncementSection);
export default AnnouncementSection;
