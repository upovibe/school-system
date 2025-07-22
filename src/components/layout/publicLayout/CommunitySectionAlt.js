import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Community Section Alternative Component
 * 
 * Displays community information with banner at top and flex layout below
 */
class CommunitySectionAlt extends App {
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
                if (settings.community_title) this.set('communityTitle', settings.community_title);
                if (settings.community_subtitle) this.set('communitySubtitle', settings.community_subtitle);
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
            <!-- Community Section Alternative -->
            <section class="mx-auto py-10">
                <!-- Header Section -->
                <div class="text-center mb-12">
                    <h2 class="text-3xl lg:text-4xl font-bold text-[${primaryColor}] mb-4">
                        ${pageData.title || ''}
                    </h2>
                    <p class="text-lg opacity-80 mb-4">
                        ${pageData.subtitle || ''}
                    </p>
                    <div class="w-24 h-1 bg-[${primaryColor}] mx-auto rounded-full"></div>
                </div>
                
                <!-- Banner Section -->
                <div class="relative h-64 lg:h-80 mb-12 rounded-3xl overflow-hidden shadow-2xl">
                    <img src="/api/${pageData.banner_image}" 
                         alt="Community" 
                         class="w-full h-full object-cover"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                        <div class="text-center">
                            <i class="fas fa-users text-gray-400 text-4xl mb-2"></i>
                            <p class="text-gray-500 font-medium">Community banner</p>
                        </div>
                    </div>
                    
                    <!-- Overlay with stats -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div class="absolute bottom-6 left-6 right-6">
                        <div class="flex flex-wrap gap-4 text-white">
                            <div class="bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30">
                                <div class="text-2xl font-bold">500+</div>
                                <div class="text-sm opacity-90">Students</div>
                            </div>
                            <div class="bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30">
                                <div class="text-2xl font-bold">50+</div>
                                <div class="text-sm opacity-90">Teachers</div>
                            </div>
                            <div class="bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30">
                                <div class="text-2xl font-bold">1000+</div>
                                <div class="text-sm opacity-90">Families</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Content and Cards Section -->
                <div class="flex flex-col lg:flex-row gap-8">
                    <!-- Content Column (Left) -->
                    <div class="lg:flex-1">
                        <div class="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
                            <content-display 
                                content="${pageData.content.replace(/"/g, '&quot;')}"
                                no-styles>
                            </content-display>
                            
                            ${window.location.pathname !== '/public/community' ? `
                                <div class="mt-8">
                                    <a href="/public/community" 
                                       class="inline-flex items-center justify-center gap-2 px-6 py-2 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl group">
                                        Explore Community
                                        <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Cards Column (Right) -->
                    <div class="lg:w-1/3">
                        <div class="grid grid-cols-1 gap-6">
                            <!-- Events Card -->
                            <a href="/public/community/events" class="block">
                                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group border border-gray-100">
                                    <div class="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <i class="fas fa-calendar-alt text-white text-xl"></i>
                                    </div>
                                    <h3 class="text-xl font-semibold text-[${secondaryColor}] mb-3">Events</h3>
                                    <p class="text-gray-600 text-sm leading-relaxed">
                                        Stay updated with school events, celebrations, and activities
                                    </p>
                                </div>
                            </a>
                            
                            <!-- News Card -->
                            <a href="/public/community/news" class="block">
                                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group border border-gray-100">
                                    <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <i class="fas fa-newspaper text-white text-xl"></i>
                                    </div>
                                    <h3 class="text-xl font-semibold text-[${secondaryColor}] mb-3">News</h3>
                                    <p class="text-gray-600 text-sm leading-relaxed">
                                        Latest news, updates, and achievements from our school
                                    </p>
                                </div>
                            </a>
                            
                            <!-- Announcements Card -->
                            <a href="/public/community/announcements" class="block">
                                <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group border border-gray-100">
                                    <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <i class="fas fa-bullhorn text-white text-xl"></i>
                                    </div>
                                    <h3 class="text-xl font-semibold text-[${secondaryColor}] mb-3">Announcements</h3>
                                    <p class="text-gray-600 text-sm leading-relaxed">
                                        Important announcements and notifications for the community
                                    </p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('community-section-alt', CommunitySectionAlt);
export default CommunitySectionAlt; 