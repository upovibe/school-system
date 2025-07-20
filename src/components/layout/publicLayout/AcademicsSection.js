import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Academics Section Component
 * 
 * Displays academics information with content from the academics page
 */
class AcademicsSection extends App {
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
                if (settings.academics_title) this.set('academicsTitle', settings.academics_title);
                if (settings.academics_subtitle) this.set('academicsSubtitle', settings.academics_subtitle);
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
            <!-- Academics Section -->
            <section class="mx-auto py-10 bg-gray-50">
                    <div class="text-center mb-12">
                        <h2 class="text-3xl lg:text-4xl font-bold text-[${primaryColor}] mb-4">
                            ${this.get('academicsTitle')}
                        </h2>
                        <p class="text-lg opacity-80 mb-4">
                            ${this.get('academicsSubtitle')}
                        </p>
                        <div class="w-24 h-1 bg-[${primaryColor}] mx-auto rounded-full"></div>
                    </div>
                    
                    <div class="bg-white rounded-3xl shadow-lg overflow-hidden">
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
                                        <p class="text-gray-500 font-medium">Academics banner image</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Content Column (Right) -->
                            <div class="p-5 lg:p-12 flex flex-col justify-center">
                                <content-display 
                                    content="${pageData.content.replace(/"/g, '&quot;')}"
                                    no-styles>
                                </content-display>
                                
                                ${window.location.pathname !== '/public/academics' ? `
                                <div class="mt-8">
                                    <a href="/public/academics" 
                                       class="inline-flex items-center justify-center gap-2 px-6 py-1.5 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl group">
                                        Learn More
                                        <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                    </a>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    ${window.location.pathname === '/public/academics' ? `
                    <!-- School Levels Cards -->
                    <div class="mt-16">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Preschool Card -->
                            <a href="/public/academics/pre-school" class="block">
                                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                                    <div class="w-16 h-16 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <i class="fas fa-baby text-white text-xl"></i>
                                    </div>
                                    <h3 class="text-xl font-semibold text-[${secondaryColor}] mb-3">Preschool</h3>
                                    <p class="text-gray-600 text-sm leading-relaxed">
                                        Early learning foundation for young minds.
                                    </p>
                                </div>
                            </a>
                            
                            <!-- Primary School Card -->
                            <a href="/public/academics/primary-school" class="block">
                                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                                    <div class="w-16 h-16 bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <i class="fas fa-child text-white text-xl"></i>
                                    </div>
                                    <h3 class="text-xl font-semibold text-[${secondaryColor}] mb-3">Primary School</h3>
                                    <p class="text-gray-600 text-sm leading-relaxed">
                                        Building strong academic foundations.
                                    </p>
                                </div>
                            </a>
                            
                            <!-- Junior High School Card -->
                            <a href="/public/academics/junior-high-school" class="block">
                                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                                    <div class="w-16 h-16 bg-gradient-to-br from-[${primaryColor}] to-[${secondaryColor}] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <i class="fas fa-user-graduate text-white text-xl"></i>
                                    </div>
                                    <h3 class="text-xl font-semibold text-[${secondaryColor}] mb-3">Junior High School</h3>
                                    <p class="text-gray-600 text-sm leading-relaxed">
                                        Preparing students for higher education.
                                    </p>
                                </div>
                            </a>
                        </div>
                    </div>
                    ` : ''}
            </section>
        `;
    }
}

customElements.define('academics-section', AcademicsSection);
export default AcademicsSection; 