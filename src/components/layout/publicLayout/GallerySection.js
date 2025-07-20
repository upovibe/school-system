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
                
                <!-- Creative Hero Area with Geometric Shapes -->
                <div class="relative mb-20">
                    <!-- Animated Background Shapes -->
                    <div class="absolute inset-0 overflow-hidden">
                        <div class="absolute top-0 left-1/4 w-32 h-32 bg-[${primaryColor}]/10 rounded-full blur-xl animate-pulse"></div>
                        <div class="absolute top-20 right-1/4 w-24 h-24 bg-[${accentColor}]/15 rounded-full blur-lg animate-pulse delay-1000"></div>
                        <div class="absolute bottom-10 left-1/3 w-20 h-20 bg-[${secondaryColor}]/10 rounded-full blur-md animate-pulse delay-500"></div>
                    </div>
                    
                    <!-- Main Content with Creative Layout -->
                    <div class="relative">
                        <!-- Hexagonal Content Container -->
                        <div class="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">
                            <!-- Banner Section -->
                            ${pageData.banner_image ? `
                                <div class="relative h-56 lg:h-72 overflow-hidden">
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
                                    
                                    <!-- Creative Overlay Pattern -->
                                    <div class="absolute inset-0 bg-gradient-to-br from-[${primaryColor}]/20 via-transparent to-[${accentColor}]/20"></div>
                                    <div class="absolute inset-0" style="background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);"></div>
                                    
                                    <!-- Floating Creative Elements -->
                                    <div class="absolute top-6 right-6">
                                        <div class="relative">
                                            <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                                                <div class="absolute inset-0 flex items-center justify-center">
                                                    <i class="fas fa-palette text-white text-lg"></i>
                                                </div>
                                            </div>
                                            <div class="absolute -top-2 -right-2 w-6 h-6 bg-[${accentColor}] rounded-full animate-bounce"></div>
                                        </div>
                                    </div>
                                    
                                    <!-- Corner Decoration -->
                                    <div class="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[${primaryColor}]/30 to-transparent clip-path-polygon"></div>
                                </div>
                            ` : ''}
                            
                            <!-- Creative Content Area -->
                            <div class="relative p-8 lg:p-12">
                                <!-- Geometric Accent -->
                                <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[${primaryColor}] via-[${accentColor}] to-[${secondaryColor}]"></div>
                                
                                <!-- Content with Creative Typography -->
                                <div class="relative z-10">
                                    <div class="mb-6">
                                        <div class="inline-block px-4 py-2 bg-gradient-to-r from-[${primaryColor}]/10 to-[${accentColor}]/10 rounded-full border border-[${primaryColor}]/20">
                                            <span class="text-sm font-semibold text-[${primaryColor}]">
                                                <i class="fas fa-sparkles mr-2"></i>
                                                Creative Gallery
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <content-display 
                                        content="${pageData.content.replace(/"/g, '&quot;')}"
                                        no-styles>
                                    </content-display>
                                    
                                    ${window.location.pathname !== '/public/gallery' ? `
                                        <div class="mt-8">
                                            <a href="/public/gallery" 
                                               class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] text-[${textColor}] font-bold rounded-2xl hover:from-[${accentColor}] hover:to-[${primaryColor}] transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 shadow-xl hover:shadow-2xl overflow-hidden">
                                                <span class="relative z-10">Unlock Gallery</span>
                                                <i class="fas fa-magic relative z-10 transition-transform duration-300 group-hover:rotate-12"></i>
                                                <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                                            </a>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${window.location.pathname === '/public/gallery' ? `
                <!-- Creative Gallery Navigation -->
                <div class="relative p-5 py-8">
                    <!-- Animated Background -->
                    <div class="absolute inset-0">
                        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[${primaryColor}]/5 via-transparent to-[${accentColor}]/5 rounded-[3rem]"></div>
                        <div class="absolute top-10 left-10 w-20 h-20 bg-[${primaryColor}]/10 rounded-full animate-spin-slow"></div>
                        <div class="absolute bottom-10 right-10 w-16 h-16 bg-[${accentColor}]/10 rounded-full animate-spin-slow-reverse"></div>
                    </div>
                    
                    <div class="relative">
                        <!-- Creative Section Header -->
                        <div class="text-center mb-16">
                            <div class="inline-block mb-4">
                                <div class="w-20 h-20 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <i class="fas fa-compass text-white text-2xl"></i>
                                </div>
                            </div>
                            <h3 class="text-3xl font-bold text-[${secondaryColor}] mb-3 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] bg-clip-text text-transparent">
                                Choose Your Adventure
                            </h3>
                            <p class="text-gray-600 max-w-md mx-auto">Embark on a visual journey through our creative collections</p>
                        </div>
                        
                                                    <!-- Creative Cards Layout -->
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                                <!-- Photo Gallery Card -->
                                <a href="/public/gallery/photos" class="group perspective-1000">
                                    <div class="relative transform-style-preserve-3d transition-all duration-700 group-hover:rotate-y-12">
                                        <div class="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-4 cursor-pointer">
                                        <!-- Creative Header -->
                                        <div class="relative h-40 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] overflow-hidden">
                                            <!-- Animated Background Pattern -->
                                            <div class="absolute inset-0 opacity-30">
                                                <div class="absolute top-4 left-4 w-8 h-8 border-2 border-white/30 rounded-full animate-ping"></div>
                                                <div class="absolute bottom-4 right-4 w-6 h-6 border-2 border-white/20 rounded-full animate-ping delay-300"></div>
                                            </div>
                                            
                                            <!-- Main Icon with Creative Effects -->
                                            <div class="absolute inset-0 flex items-center justify-center">
                                                <div class="relative">
                                                    <div class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-500">
                                                        <i class="fas fa-images text-white text-3xl group-hover:rotate-12 transition-transform duration-500"></i>
                                                    </div>
                                                    <div class="absolute -top-2 -right-2 w-8 h-8 bg-[${accentColor}] rounded-full animate-bounce"></div>
                                                    <div class="absolute -bottom-2 -left-2 w-6 h-6 bg-white/40 rounded-full animate-pulse"></div>
                                                </div>
                                            </div>
                                            
                                            <!-- Floating Elements -->
                                            <div class="absolute top-6 left-6 w-4 h-4 bg-white/40 rounded-full animate-pulse"></div>
                                            <div class="absolute bottom-6 right-6 w-3 h-3 bg-white/30 rounded-full animate-pulse delay-500"></div>
                                        </div>
                                        
                                        <!-- Creative Content -->
                                        <div class="p-8">
                                            <div class="mb-4">
                                                <h3 class="text-2xl font-bold text-[${secondaryColor}] mb-2 group-hover:text-[${primaryColor}] transition-colors duration-300">
                                                    Photo Gallery
                                                </h3>
                                                <div class="w-12 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full"></div>
                                            </div>
                                            
                                            <p class="text-gray-600 text-sm leading-relaxed mb-6">
                                                Immerse yourself in our collection of stunning photographs that capture the essence of our school community.
                                            </p>
                                            
                                            <!-- Creative Action Area -->
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-2 h-2 bg-[${primaryColor}] rounded-full animate-pulse"></div>
                                                    <span class="text-xs text-gray-500 font-medium">Static Collection</span>
                                                </div>
                                                <div class="relative">
                                                    <div class="w-12 h-12 bg-gradient-to-r from-[${primaryColor}]/10 to-[${accentColor}]/10 rounded-full flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[${primaryColor}] group-hover:to-[${accentColor}] group-hover:text-white transition-all duration-500">
                                                        <i class="fas fa-arrow-right text-sm group-hover:scale-110 transition-transform duration-300"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                            
                            <!-- Video Gallery Card -->
                            <a href="/public/gallery/videos" class="group perspective-1000">
                                <div class="relative transform-style-preserve-3d transition-all duration-700 group-hover:rotate-y-12">
                                    <div class="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-4 cursor-pointer">
                                        <!-- Creative Header -->
                                        <div class="relative h-40 bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}] overflow-hidden">
                                            <!-- Animated Background Pattern -->
                                            <div class="absolute inset-0 opacity-30">
                                                <div class="absolute top-4 right-4 w-8 h-8 border-2 border-white/30 rounded-full animate-ping delay-200"></div>
                                                <div class="absolute bottom-4 left-4 w-6 h-6 border-2 border-white/20 rounded-full animate-ping delay-500"></div>
                                            </div>
                                            
                                            <!-- Main Icon with Creative Effects -->
                                            <div class="absolute inset-0 flex items-center justify-center">
                                                <div class="relative">
                                                    <div class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-500">
                                                        <i class="fas fa-video text-white text-3xl group-hover:rotate-12 transition-transform duration-500"></i>
                                                    </div>
                                                    <div class="absolute -top-2 -left-2 w-8 h-8 bg-[${primaryColor}] rounded-full animate-bounce delay-300"></div>
                                                    <div class="absolute -bottom-2 -right-2 w-6 h-6 bg-white/40 rounded-full animate-pulse delay-200"></div>
                                                </div>
                                            </div>
                                            
                                            <!-- Floating Elements -->
                                            <div class="absolute top-6 right-6 w-4 h-4 bg-white/40 rounded-full animate-pulse delay-300"></div>
                                            <div class="absolute bottom-6 left-6 w-3 h-3 bg-white/30 rounded-full animate-pulse delay-700"></div>
                                        </div>
                                        
                                        <!-- Creative Content -->
                                        <div class="p-8">
                                            <div class="mb-4">
                                                <h3 class="text-2xl font-bold text-[${secondaryColor}] mb-2 group-hover:text-[${primaryColor}] transition-colors duration-300">
                                                    Video Gallery
                                                </h3>
                                                <div class="w-12 h-1 bg-gradient-to-r from-[${secondaryColor}] to-[${primaryColor}] rounded-full"></div>
                                            </div>
                                            
                                            <p class="text-gray-600 text-sm leading-relaxed mb-6">
                                                Experience our school events and activities in motion with our dynamic video collection.
                                            </p>
                                            
                                            <!-- Creative Action Area -->
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-2 h-2 bg-[${secondaryColor}] rounded-full animate-pulse delay-300"></div>
                                                    <span class="text-xs text-gray-500 font-medium">Dynamic Content</span>
                                                </div>
                                                <div class="relative">
                                                    <div class="w-12 h-12 bg-gradient-to-r from-[${secondaryColor}]/10 to-[${primaryColor}]/10 rounded-full flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[${secondaryColor}] group-hover:to-[${primaryColor}] group-hover:text-white transition-all duration-500">
                                                        <i class="fas fa-arrow-right text-sm group-hover:scale-110 transition-transform duration-300"></i>
                                                    </div>
                                                </div>
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