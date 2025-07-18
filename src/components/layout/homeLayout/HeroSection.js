import App from '@/core/App.js';
import api from '@/services/api.js';
import store from '@/core/store.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';

/**
 * Hero Section Component
 * 
 * Displays the hero banner with title, subtitle, buttons, and scroll indicator
 */
class HeroSection extends App {
    constructor() {
        super();
        this.heroTitle = '';
        this.heroSubtitle = '';
        this.bannerImages = [];
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadColorSettings();
        this.loadHeroSettings();
        this.loadPageData();
    }

    async loadPageData() {
        // Check if data is already cached in global store
        const globalState = store.getState();
        if (globalState.homePageData) {
            this.set('pageData', globalState.homePageData);
            this.render();
            return;
        }

        // If not cached, fetch from API
        await this.fetchPageData();
    }

    async fetchPageData() {
        try {
            const response = await api.get('/pages/slug/home');
            if (response.data.success) {
                const pageData = response.data.data;
                
                // Cache the data in global store
                store.setState({ homePageData: pageData });
                
                // Set local state and render
                this.set('pageData', pageData);
                this.render();
            }
        } catch (error) {
            console.error('Error fetching page data:', error);
            this.set('error', 'Failed to load page data');
        }
    }

    async loadHeroSettings() {
        try {
            // Fetch hero title and subtitle from settings
            const heroTitleResponse = await api.get('/settings/key/hero_title');
            const heroSubtitleResponse = await api.get('/settings/key/hero_subtitle');
            
            if (heroTitleResponse.data.success) {
                this.set('heroTitle', heroTitleResponse.data.data.setting_value);
            }
            
            if (heroSubtitleResponse.data.success) {
                this.set('heroSubtitle', heroSubtitleResponse.data.data.setting_value);
            }
        } catch (error) {
            console.error('Error fetching hero settings:', error);
        }
    }

    async loadColorSettings() {
        try {
            const colors = await fetchColorSettings();
            
            // Set all color values to state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });

        } catch (error) {
            console.error('Error fetching color settings:', error);
        }
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
        const error = this.get('error');
        const heroTitle = this.get('heroTitle') || 'Welcome to Our School';
        const heroSubtitle = this.get('heroSubtitle') || 'Excellence in Education, Character, and Leadership';
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');
        if (error) {
            return `
                <div class="container mx-auto flex items-center justify-center p-8">
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        ${error}
                    </div>
                </div>
            `;
        }

        if (!pageData) {
            return `
                <div class="container flex items-center justify-center mx-auto p-8">
                    <page-loader></page-loader>
                </div>
            `;
        }

        const bannerImages = this.getBannerImages(pageData);

        if (bannerImages.length === 0) {
            return '';
        }

        return `
            <!-- Hero Banner Section -->
            <div class="mb-8">
                <div class="relative">
                    <!-- Main Hero Banner Image -->
                    <div class="relative w-full h-[500px] lg:h-[70vh] rounded-3xl overflow-hidden">
                        <img src="${this.getImageUrl(bannerImages[0])}" 
                             alt="Hero Banner" 
                             class="w-full h-full object-cover"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="absolute inset-0 hidden items-center justify-center bg-gray-50">
                            <div class="text-center">
                                <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                <p class="text-gray-500">Banner image not found</p>
                            </div>
                        </div>
                        
                        <!-- Dark gradient overlay from bottom to top -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        
                        <!-- Hero Content Overlay -->
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="text-center text-white px-4 lg:px-8 max-w-4xl">
                                <h1 class="text-4xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
                                    ${heroTitle}
                                </h1>
                                <p class="text-lg lg:text-xl mb-10 opacity-95 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
                                    ${heroSubtitle}
                                </p>
                                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a href="/public/about-us" 
                                       class="inline-flex items-center justify-center px-6 py-3 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl">
                                        <i class="fas fa-info-circle mr-2 text-base"></i>
                                        Learn More
                                    </a>
                                    <a href="/public/admissions" 
                                       class="inline-flex items-center justify-center px-6 py-3 border-2 border-[${textColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${textColor}] hover:text-[${secondaryColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl">
                                        <i class="fas fa-graduation-cap mr-2 text-base"></i>
                                        Apply Now
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Mouse Scroll Indicator -->
                        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                            <div class="flex flex-col items-center text-[${textColor}] cursor-pointer group" onclick="window.scrollTo({top: window.innerHeight, behavior: 'smooth'})">
                                <div class="w-6 h-10 border-2 border-[${textColor}] rounded-full flex justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-[${accentColor}]">
                                    <div class="w-1.5 h-3 bg-[${textColor}] rounded-full mt-2 animate-bounce transition-all duration-300 group-hover:bg-[${accentColor}]"></div>
                                </div>
                                <span class="text-sm mt-3 opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 font-medium">Scroll</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Additional Banner Images Grid -->
                ${bannerImages.length > 1 ? `
                    <div class="mt-8">
                        <h2 class="text-3xl font-bold text-[${secondaryColor}] mb-6 text-center">Gallery</h2>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            ${bannerImages.slice(1).map((imagePath, index) => `
                                <div class="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                                    <div class="relative w-full h-40">
                                        <img src="${this.getImageUrl(imagePath)}" 
                                             alt="Gallery Image ${index + 2}" 
                                             class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        <div class="absolute inset-0 hidden items-center justify-center bg-[${primaryColor}] bg-opacity-10 rounded-xl">
                                            <div class="text-center">
                                                <i class="fas fa-image text-[${primaryColor}] text-xl mb-2"></i>
                                                <p class="text-[${secondaryColor}] text-sm font-medium">Image not found</p>
                                            </div>
                                        </div>
                                        <!-- Overlay on hover -->
                                        <div class="absolute inset-0 bg-gradient-to-t from-[${secondaryColor}] via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('hero-section', HeroSection);
export default HeroSection; 