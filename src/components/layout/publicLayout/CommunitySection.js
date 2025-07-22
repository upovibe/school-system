import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Community Section Component
 * 
 * Displays community information with a unique card-based layout
 */
class CommunitySection extends App {
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
            <!-- Community Section -->
            <section class="mx-auto py-10">
                <!-- Main Content Card -->
                <div class="relative mb-12">
                    <!-- Animated background pattern -->
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl overflow-hidden">
                        <div class="absolute top-0 left-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl animate-pulse opacity-30"></div>
                        <div class="absolute top-1/4 right-0 w-24 h-24 bg-indigo-200 rounded-full blur-2xl animate-bounce opacity-30"></div>
                        <div class="absolute bottom-0 left-1/3 w-40 h-40 bg-purple-200 rounded-full blur-3xl animate-pulse delay-1000 opacity-30"></div>
                    </div>
                    
                    <!-- Main content container with glass effect -->
                    <div class="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                        <!-- Top banner section with parallax effect -->
                        <div class="relative h-48 lg:h-80 overflow-hidden">
                            <img src="/api/${pageData.banner_image}" 
                                 alt="Community" 
                                 class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                                <div class="text-center">
                                    <i class="fas fa-users text-gray-400 text-4xl mb-2"></i>
                                    <p class="text-gray-500 font-medium">Community banner</p>
                                </div>
                            </div>
                            
                            <!-- Animated overlay with community stats -->
                            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                            <div class="absolute bottom-2 gap-2 gap-y-4 galeft-4 right-4">
                                <div class="flex flex-wrap gap-2 text-white">
                                    <div class="bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 transform hover:scale-105 transition-all duration-300">
                                        <div class="text-2xl font-bold animate-pulse">500+</div>
                                        <div class="text-sm opacity-90">Students</div>
                                    </div>
                                    <div class="bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 transform hover:scale-105 transition-all duration-300">
                                        <div class="text-2xl font-bold animate-pulse delay-300">50+</div>
                                        <div class="text-sm opacity-90">Teachers</div>
                                    </div>
                                    <div class="bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 transform hover:scale-105 transition-all duration-300">
                                        <div class="text-2xl font-bold animate-pulse delay-700">1000+</div>
                                        <div class="text-sm opacity-90">Families</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Floating action indicator -->
                            <div class="absolute top-4 right-4">
                                <div class="bg-white/20 backdrop-blur-md rounded-full p-2 border border-white/30 animate-bounce">
                                    <i class="fas fa-hand-point-down text-white text-lg"></i>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Content section with innovative floating design -->
                        <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-5 lg:p-12 border border-white/50 relative overflow-hidden">
                            <!-- Decorative corner elements -->
                            <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-bl-2xl opacity-10"></div>
                            <div class="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500 to-pink-600 rounded-tr-2xl opacity-10"></div>
                            
                            <!-- Header with animated icon -->
                            <div class="flex items-start mb-6 relative z-10">
                                <div class="size-14 min-w-14 min-h-14 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-2xl flex items-center justify-center mr-4 shadow-lg transform hover:rotate-12 transition-transform duration-300">
                                    <i class="fas fa-heart text-white text-xl animate-pulse"></i>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-bold text-[${secondaryColor}] bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] bg-clip-text text-transparent">
                                        ${pageData.title || ''}
                                    </h3>
                                    <p class="text-gray-600">${pageData.subtitle || ''}</p>
                                </div>
                            </div>
                            
                            <!-- Content and Feature Cards -->
                            <div class="flex flex-col lg:flex-row gap-8 relative z-10">
                                <!-- Content with enhanced typography -->
                                <div class="lg:flex-1">
                                    <content-display 
                                        content="${pageData.content.replace(/"/g, '&quot;')}"
                                        no-styles>
                                    </content-display>
                                </div>
                                
                                <!-- Feature Cards Grid -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full lg:w-1/2">
                                    <!-- Events Card -->
                                    <a href="/public/community/events" class="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 text-center group cursor-pointer">
                                        <div class="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <i class="fas fa-calendar-alt text-white text-xl"></i>
                                        </div>
                                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Events</h3>
                                        <p class="text-gray-600 text-sm">Stay updated with school events, celebrations, and activities</p>
                                    </a>
                                    
                                    <!-- News Card -->
                                    <a href="/public/community/news" class="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 text-center group cursor-pointer">
                                        <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <i class="fas fa-newspaper text-white text-xl"></i>
                                        </div>
                                        <h3 class="text-xl font-semibold text-gray-900 mb-2">News</h3>
                                        <p class="text-gray-600 text-sm">Latest news, updates, and achievements from our school</p>
                                    </a>
                                    
                                    <!-- Announcements Card -->
                                    <a href="/public/community/announcements" class="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 text-center group cursor-pointer">
                                        <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <i class="fas fa-bullhorn text-white text-xl"></i>
                                        </div>
                                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Announcements</h3>
                                        <p class="text-gray-600 text-sm">Important announcements and notifications for the community</p>
                                    </a>
                                    
                                    <!-- Apply Now Card -->
                                    <a href="/public/apply" class="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 text-center group cursor-pointer">
                                        <div class="w-16 h-16 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <i class="fas fa-graduation-cap text-white text-xl"></i>
                                        </div>
                                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Apply Now</h3>
                                        <p class="text-gray-600 text-sm">Join our school community and start your child's journey</p>
                                    </a>
                                </div>
                            </div>
                            
                            <!-- Bottom decorative line -->
                            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[${primaryColor}] via-[${accentColor}] to-[${secondaryColor}] rounded-b-2xl"></div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('community-section', CommunitySection);
export default CommunitySection; 