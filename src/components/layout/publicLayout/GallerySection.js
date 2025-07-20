import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Gallery Section Component
 * 
 * Displays gallery information with content from the gallery page and galleries from API
 */
class GallerySection extends App {
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
                if (settings.gallery_title) this.set('galleryTitle', settings.gallery_title);
                if (settings.gallery_subtitle) this.set('gallerySubtitle', settings.gallery_subtitle);
            }
        }

        // Render immediately with the data
        this.render();
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
            <!-- Gallery Section -->
            <section class="mx-auto py-10">
                
                <!-- Hero Content Area with Overlapping Elements -->
                <div class="relative mb-16">
                    <!-- Background Pattern -->
                    <div class="absolute inset-0 bg-gradient-to-br from-[${primaryColor}]/5 to-[${accentColor}]/5 rounded-3xl"></div>
                    
                    <!-- Main Content Container -->
                    <div class="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <!-- Top Banner with Image -->
                        ${pageData.banner_image ? `
                            <div class="relative h-48 lg:h-64 overflow-hidden">
                                <img src="/api/${pageData.banner_image}" 
                                     alt="Gallery" 
                                     class="w-full h-full object-cover"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                                    <div class="text-center">
                                        <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                        <p class="text-gray-500 font-medium">Gallery banner image</p>
                                    </div>
                                </div>
                                
                                <!-- Gradient Overlay -->
                                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                                
                                <!-- Floating Content Badge -->
                                <div class="absolute bottom-4 right-4">
                                    <div class="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                                        <span class="text-sm font-semibold text-[${primaryColor}]">
                                            <i class="fas fa-images mr-2"></i>
                                            Gallery
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Content Area with Side Accent -->
                        <div class="relative">
                            <!-- Side Accent Line -->
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[${primaryColor}] to-[${accentColor}]"></div>
                            
                            <!-- Content -->
                            <div class="p-8 lg:p-12 pl-12">
                                <content-display 
                                    content="${pageData.content.replace(/"/g, '&quot;')}"
                                    no-styles>
                                </content-display>
                                
                                ${window.location.pathname !== '/public/gallery' ? `
                                    <div class="mt-8">
                                        <a href="/public/gallery" 
                                           class="inline-flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] text-[${textColor}] font-semibold rounded-full hover:from-[${accentColor}] hover:to-[${primaryColor}] transition-all duration-500 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl group">
                                            <span>Explore Gallery</span>
                                            <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                        </a>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                ${window.location.pathname === '/public/gallery' ? `
                <!-- Gallery Types Cards with Unique Layout -->
                <div class="relative">
                    <!-- Background Decoration -->
                    <div class="absolute inset-0 bg-gradient-to-r from-[${primaryColor}]/5 via-transparent to-[${accentColor}]/5 rounded-3xl"></div>
                    
                    <div class="relative">
                        <!-- Section Header -->
                        <div class="text-center mb-12">
                            <h3 class="text-2xl font-bold text-[${secondaryColor}] mb-2">Choose Your View</h3>
                            <p class="text-gray-600">Explore our gallery in different formats</p>
                        </div>
                        
                        <!-- Cards Container -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <!-- Photo Gallery Card -->
                            <a href="/public/gallery/photos" class="group">
                                <div class="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer">
                                    <!-- Card Header with Icon -->
                                    <div class="relative h-32 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] flex items-center justify-center">
                                        <div class="absolute inset-0 bg-black/10"></div>
                                        <i class="fas fa-images text-white text-4xl relative z-10 group-hover:scale-110 transition-transform duration-300"></i>
                                        
                                        <!-- Floating Elements -->
                                        <div class="absolute top-4 right-4 w-3 h-3 bg-white/30 rounded-full"></div>
                                        <div class="absolute bottom-4 left-4 w-2 h-2 bg-white/20 rounded-full"></div>
                                    </div>
                                    
                                    <!-- Card Content -->
                                    <div class="p-6">
                                        <h3 class="text-xl font-bold text-[${secondaryColor}] mb-3 group-hover:text-[${primaryColor}] transition-colors duration-300">
                                            Photo Gallery
                                        </h3>
                                        <p class="text-gray-600 text-sm leading-relaxed mb-4">
                                            Browse through our collection of beautiful photographs capturing precious moments.
                                        </p>
                                        
                                        <!-- Action Button -->
                                        <div class="flex items-center justify-between">
                                            <span class="text-xs text-gray-500">Static Images</span>
                                            <div class="w-8 h-8 bg-[${primaryColor}]/10 rounded-full flex items-center justify-center group-hover:bg-[${primaryColor}] group-hover:text-white transition-all duration-300">
                                                <i class="fas fa-arrow-right text-xs"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                            
                            <!-- Video Gallery Card -->
                            <a href="/public/gallery/videos" class="group">
                                <div class="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer">
                                    <!-- Card Header with Icon -->
                                    <div class="relative h-32 bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}] flex items-center justify-center">
                                        <div class="absolute inset-0 bg-black/10"></div>
                                        <i class="fas fa-video text-white text-4xl relative z-10 group-hover:scale-110 transition-transform duration-300"></i>
                                        
                                        <!-- Floating Elements -->
                                        <div class="absolute top-4 left-4 w-2 h-2 bg-white/20 rounded-full"></div>
                                        <div class="absolute bottom-4 right-4 w-3 h-3 bg-white/30 rounded-full"></div>
                                    </div>
                                    
                                    <!-- Card Content -->
                                    <div class="p-6">
                                        <h3 class="text-xl font-bold text-[${secondaryColor}] mb-3 group-hover:text-[${primaryColor}] transition-colors duration-300">
                                            Video Gallery
                                        </h3>
                                        <p class="text-gray-600 text-sm leading-relaxed mb-4">
                                            Watch our school events and activities come to life in motion.
                                        </p>
                                        
                                        <!-- Action Button -->
                                        <div class="flex items-center justify-between">
                                            <span class="text-xs text-gray-500">Dynamic Content</span>
                                            <div class="w-8 h-8 bg-[${secondaryColor}]/10 rounded-full flex items-center justify-center group-hover:bg-[${secondaryColor}] group-hover:text-white transition-all duration-300">
                                                <i class="fas fa-arrow-right text-xs"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
                ` : ''}
            </section>
        `;
    }
}

customElements.define('gallery-section', GallerySection);
export default GallerySection; 