import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';

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
                if (settings.about_title) this.set('aboutTitle', settings.about_title);
                if (settings.about_subtitle) this.set('aboutSubtitle', settings.about_subtitle);
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
            <!-- About Section -->
            <section class="mx-auto py-10">
                    <div class="text-center mb-12">
                        <h2 class="text-3xl lg:text-4xl font-bold text-[${primaryColor}] mb-4">
                            ${this.get('aboutTitle')}
                        </h2>
                        <p class="text-lg opacity-80 mb-4">
                            ${this.get('aboutSubtitle')}
                        </p>
                        <div class="w-24 h-1 bg-[${primaryColor}] mx-auto rounded-full"></div>
                    </div>
                    
                    <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            <!-- Content Column (Left) -->
                            <div class="p-5 lg:p-12 flex flex-col justify-center">
                                <div class="content-preview text-lg leading-relaxed">
                                    ${pageData.content}
                                </div>
                                
                                ${window.location.pathname !== '/public/about-us' ? `
                                    <div class="mt-8">
                                        <a href="/public/about-us" 
                                           class="inline-flex items-center justify-center gap-2 px-6 py-1.5 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl group">
                                            Read More
                                            <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                        </a>
                                    </div>
                                ` : ''}
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
                                        <p class="text-gray-500 font-medium">About banner image</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${window.location.pathname === '/public/about-us' ? `
                    <!-- Mission, Vision, Values & Team Cards -->
                    <div class="mt-16">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Mission & Vision Card -->
                            <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                                <div class="w-16 h-16 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-bullseye text-white text-xl"></i>
                                </div>
                                <h3 class="text-xl font-semibold text-[${secondaryColor}] mb-3">Our Mission & Vision</h3>
                                <p class="text-gray-600 text-sm leading-relaxed">
                                    Empowering students and shaping tomorrow's leaders.
                                </p>
                            </div>
                            
                            <!-- Values Card -->
                            <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                                <div class="w-16 h-16 bg-gradient-to-br from-[${secondaryColor}] to-[${primaryColor}] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-heart text-white text-xl"></i>
                                </div>
                                <h3 class="text-xl font-semibold text-[${secondaryColor}] mb-3">Our Values</h3>
                                <p class="text-gray-600 text-sm leading-relaxed">
                                    Excellence, Integrity, Respect, Innovation, and Community.
                                </p>
                            </div>
                            
                            <!-- Team Card -->
                            <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                                <div class="w-16 h-16 bg-gradient-to-br from-[${primaryColor}] to-[${secondaryColor}] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-users text-white text-xl"></i>
                                </div>
                                <h3 class="text-xl font-semibold text-[${secondaryColor}] mb-3">Our Team</h3>
                                <p class="text-gray-600 text-sm leading-relaxed">
                                    Dedicated educators committed to nurturing student potential.
                                </p>
                            </div>
                        </div>
                    </div>
                    ` : ''}
            </section>
        `;
    }
}

customElements.define('about-section', AboutSection);
export default AboutSection; 