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
            <section class="mx-auto py-10">
                    <!-- Main Content Card -->
                    <div class="relative mb-12 group">
                        <!-- Animated background pattern -->
                        <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl overflow-hidden">
                            <div class="absolute inset-0 opacity-30">
                                <div class="absolute top-0 left-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl animate-pulse"></div>
                                <div class="absolute top-1/4 right-0 w-24 h-24 bg-indigo-200 rounded-full blur-2xl animate-bounce"></div>
                                <div class="absolute bottom-0 left-1/3 w-40 h-40 bg-purple-200 rounded-full blur-3xl animate-pulse delay-1000"></div>
                            </div>
                        </div>
                        
                        <!-- Main content container with glass effect -->
                        <div class="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                            <!-- Top banner section with parallax effect -->
                            <div class="relative h-48 lg:h-64 overflow-hidden">
                                <img src="/api/${pageData.banner_image}" 
                                     alt="Community" 
                                     class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                                    <div class="text-center">
                                        <i class="fas fa-users text-blue-400 text-4xl mb-2"></i>
                                        <p class="text-blue-600 font-medium">Community banner</p>
                                    </div>
                                </div>
                                
                                <!-- Animated overlay with community stats -->
                                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <div class="absolute bottom-20 left-4 right-4">
                                    <div class="flex flex-wrap gap-3 text-white">
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
                                        <div class="size-14 min-w-14 min-h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg transform hover:rotate-12 transition-transform duration-300">
                                            <i class="fas fa-heart text-white text-xl animate-pulse"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                ${this.get('communityTitle')}
                                            </h3>
                                            <p class="text-gray-600">${this.get('communitySubtitle')}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex flex-col lg:flex-row gap-4 justify-center items-center">
                                    <!-- Content with enhanced typography -->
                                    <div class="content-preview text-lg leading-relaxed text-gray-700 mb-8 relative z-10">
                                        ${pageData.content}
                                    </div>
                                    <!-- Feature Cards Grid -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    
                                    
                                    
                                    <!-- Bottom decorative line -->
                                    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-b-2xl"></div>
                                </div>
                        </div>
                    </div>
            </section>
        `;
    }
}

customElements.define('community-section', CommunitySection);
export default CommunitySection; 