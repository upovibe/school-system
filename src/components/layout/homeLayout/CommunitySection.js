import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import PageLoader from '@/components/common/PageLoader.js';

// Load Quill CSS for content display
if (!document.querySelector('link[href*="quill"]')) {
    const link = document.createElement('link');
    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

/**
 * Community Section Component
 * 
 * Displays community information with a unique card-based layout
 */
class CommunitySection extends App {
    constructor() {
        super();
        this.pageData = null;
        this.communityTitle = '';
        this.communitySubtitle = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadCommunitySettings();
        this.loadPageData();
    }

    async loadCommunitySettings() {
        try {
            // Fetch community title and subtitle from settings
            const communityTitleResponse = await api.get('/settings/key/community_title');
            const communitySubtitleResponse = await api.get('/settings/key/community_subtitle');
            
            if (communityTitleResponse.data.success) {
                this.set('communityTitle', communityTitleResponse.data.data.setting_value);
            }
            
            if (communitySubtitleResponse.data.success) {
                this.set('communitySubtitle', communitySubtitleResponse.data.data.setting_value);
            }
        } catch (error) {
            console.error('Error fetching community settings:', error);
        }
    }

    async loadPageData() {
        try {
            await this.fetchPageData();
        } catch (error) {
            console.error('Error loading community data:', error);
        }
    }

    async fetchPageData() {
        try {
            const response = await api.get('/pages/slug/community');
            if (response.data.success) {
                const pageData = response.data.data;
                
                // Set local state and render
                this.set('pageData', pageData);
                this.render();
            }
        } catch (error) {
            console.error('Error fetching community data:', error);
            this.set('error', 'Failed to load community data');
        }
    }

    render() {
        const pageData = this.get('pageData');
        const error = this.get('error');

        if (error) {
            return `
                <div class="container mx-auto flex items-center justify-center p-8">
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        ${error}
                    </div>
                </div>
            `;
        }

        // Don't show loading if pageData is null - just return empty
        // This prevents duplicate loading spinners
        if (!pageData) {
            return '';
        }

        // Only render if there's content
        if (!pageData.content || pageData.content.trim() === '') {
            return '';
        }

        return `
            <!-- Community Section -->
            <section class="py-10">
                <div class="mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-16">
                        <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            ${this.get('communityTitle')}
                        </h2>
                        <p class="text-lg text-gray-600 mb-4 max-w-3xl mx-auto">
                            ${this.get('communitySubtitle')}
                        </p>
                        <div class="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full"></div>
                    </div>
                    
                    <!-- Main Content Card -->
                    <div class="relative mb-12">
                        <!-- Main content container -->
                        <div class="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                            <!-- Top banner section with image -->
                            <div class="relative h-48 lg:h-64">
                                <img src="/api/${pageData.banner_image}" 
                                     alt="Community" 
                                     class="w-full h-full object-cover"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                                    <div class="text-center">
                                        <i class="fas fa-users text-blue-400 text-4xl mb-2"></i>
                                        <p class="text-blue-600 font-medium">Community banner</p>
                                    </div>
                                </div>
                                
                                <!-- Overlay with community stats -->
                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                <div class="absolute bottom-4 left-4 right-4">
                                    <div class="flex flex-wrap gap-4 text-white">
                                        <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                            <div class="text-2xl font-bold">500+</div>
                                            <div class="text-sm opacity-90">Students</div>
                                        </div>
                                        <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                            <div class="text-2xl font-bold">50+</div>
                                            <div class="text-sm opacity-90">Teachers</div>
                                        </div>
                                        <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                            <div class="text-2xl font-bold">1000+</div>
                                            <div class="text-sm opacity-90">Families</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Content section with floating card design -->
                            <div class="relative -mt-8 mx-4 mb-8">
                                <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                    <div class="flex items-center mb-6">
                                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                                            <i class="fas fa-heart text-white text-xl"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-2xl font-bold text-gray-900">Our Community Spirit</h3>
                                            <p class="text-gray-600">Building connections that last a lifetime</p>
                                        </div>
                                    </div>
                                    
                                    <div class="content-preview text-lg leading-relaxed text-gray-700 mb-6">
                                        ${pageData.content}
                                    </div>
                                    
                                    <div class="flex flex-col sm:flex-row gap-4">
                                        <a href="/public/community" 
                                           class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl group">
                                            <i class="fas fa-users mr-2"></i>
                                            Explore Community
                                            <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                        </a>
                                        <a href="/public/contact" 
                                           class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1 group">
                                            <i class="fas fa-envelope mr-2"></i>
                                            Get in Touch
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Feature Cards Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <!-- Events Card -->
                        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 text-center group">
                            <div class="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                <i class="fas fa-calendar-alt text-white text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">Events</h3>
                            <p class="text-gray-600 text-sm mb-4">Stay updated with school events, celebrations, and activities</p>
                            <a href="/public/community/events" class="text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:underline">
                                View Events <i class="fas fa-arrow-right ml-1"></i>
                            </a>
                        </div>
                        
                        <!-- News Card -->
                        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 text-center group">
                            <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                <i class="fas fa-newspaper text-white text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">News</h3>
                            <p class="text-gray-600 text-sm mb-4">Latest news, updates, and achievements from our school</p>
                            <a href="/public/community/news" class="text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:underline">
                                Read News <i class="fas fa-arrow-right ml-1"></i>
                            </a>
                        </div>
                        
                        <!-- Announcements Card -->
                        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 text-center group">
                            <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                <i class="fas fa-bullhorn text-white text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">Announcements</h3>
                            <p class="text-gray-600 text-sm mb-4">Important announcements and notifications for the community</p>
                            <a href="/public/community/announcements" class="text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:underline">
                                View Announcements <i class="fas fa-arrow-right ml-1"></i>
                            </a>
                        </div>
                        
                        <!-- Parent Portal Card -->
                        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 text-center group">
                            <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                <i class="fas fa-user-friends text-white text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">Parent Portal</h3>
                            <p class="text-gray-600 text-sm mb-4">Access your child's progress and stay connected</p>
                            <a href="/auth/login" class="text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:underline">
                                Login <i class="fas fa-arrow-right ml-1"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('community-section', CommunitySection);
export default CommunitySection; 