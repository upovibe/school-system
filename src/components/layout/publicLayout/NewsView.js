import App from '@/core/App.js';
import Toast from '@/components/ui/Toast.js';
import '@/components/layout/publicLayout/NewsList.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/common/PageLoader.js';
import '@/components/ui/ContentDisplay.js';

/**
 * News View Component
 * 
 * Displays detailed information for a specific news article
 * Can be used in individual news pages or modals
 */
class NewsView extends App {
    constructor() {
        super();
        // Initialize with loading state
        this.set('loading', true);
        this.set('colorsLoaded', false);
        this.set('news', null);
        this.set('error', null);
    }

    // Method to copy news URL to clipboard and show toast
    copyNewsUrl() {
        const news = this.get('news');
        const newsTitle = news?.title ? news.title.charAt(0).toUpperCase() + news.title.slice(1) : 'News';
        
        navigator.clipboard.writeText(window.location.href).then(() => {
            Toast.show({ 
                message: `${newsTitle} copied to clipboard!`, 
                variant: 'success', 
                duration: 3000 
            });
        });
    }

    async connectedCallback() {
        super.connectedCallback();
        
        // Load colors from settings
        await this.loadColorsFromSettings();
        
        // Check if slug attribute is provided and load data
        const slug = this.getAttribute('slug');
        if (slug) {
            this.loadNewsData(slug);
        }
    }

    async loadColorsFromSettings() {
        try {
            // Fetch colors from API
            const colors = await fetchColorSettings();
            
            // Set colors in component state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            // Mark colors as loaded
            this.set('colorsLoaded', true);
        } catch (error) {
            this.set('colorsLoaded', true);
        }
    }

    // Watch for slug attribute changes
    static get observedAttributes() {
        return ['slug'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'slug' && newValue && newValue !== oldValue) {
            this.loadNewsData(newValue);
        }
    }

    // Method to load news data (can be called externally)
    async loadNewsData(slug) {
        try {
            if (!slug) {
                this.set('error', 'News not found');
                this.set('loading', false);
                return;
            }

            // Fetch news data by slug
            const apiUrl = `/api/news/slug/${slug}`;
            
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('news', data.data);
                } else {
                    this.set('error', 'News not found');
                }
            } else {
                this.set('error', 'Failed to load news');
            }
        } catch (error) {
            this.set('error', 'Error loading news');
        }
        
        this.set('loading', false);
    }

    // Helper method to get proper image URL
    getImageUrl(imagePath) {
        if (!imagePath) return '';
        
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



    // Helper function to format date
    formatDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    render() {
        const loading = this.get('loading');
        const colorsLoaded = this.get('colorsLoaded');
        const error = this.get('error');
        const news = this.get('news');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondaryColor');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        
        // Show loading if either colors or news data is still loading
        if (loading || !colorsLoaded) {
            return `<page-loader></page-loader>`;
        }

        if (!loading && (error || !news)) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">News Not Found</h1>
                        <p class="text-gray-600 mb-6">The news article you're looking for doesn't exist or has been removed.</p>
                        <a href="/public/community/news" 
                           class="inline-flex items-center gap-2 px-6 py-3 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-colors">
                            <i class="fas fa-arrow-left"></i>
                            Back to News
                        </a>
                    </div>
                </div>
            `;
        }



        return `
            <!-- Breadcrumb -->
            <ui-breadcrumb separator="chevron" color="primary">
                <ui-breadcrumb-item href="/">Home</ui-breadcrumb-item>
                <ui-breadcrumb-item href="/public/community">Community</ui-breadcrumb-item>
                <ui-breadcrumb-item href="/public/community/news">News</ui-breadcrumb-item>
                <ui-breadcrumb-item>${news.title ? news.title.charAt(0).toUpperCase() + news.title.slice(1) : 'News Details'}</ui-breadcrumb-item>
            </ui-breadcrumb>

            <!-- News Banner - Always show (placeholder if no image) -->
            <div class="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg my-6">
                ${news.banner_image ? `
                    <img src="/api/${news.banner_image}" 
                         alt="${news.title}" 
                         class="w-full h-full object-cover"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                ` : ''}
                <div class="absolute inset-0 ${news.banner_image ? 'hidden' : 'flex'} items-center justify-center bg-gray-100">
                    <div class="text-center">
                        <i class="fas fa-newspaper text-gray-400 text-6xl mb-4"></i>
                        <h2 class="text-2xl font-bold text-gray-700 mb-2">${news.title ? news.title.charAt(0).toUpperCase() + news.title.slice(1) : 'News'}</h2>
                        <p class="text-lg text-gray-600">${this.formatDate(news.created_at)}</p>
                    </div>
                </div>
                
                <!-- Share/Copy buttons - Absolute positioned at top-right corner -->
                <div class="absolute top-4 right-4 z-10 flex gap-3">
                    <i onclick="navigator.share ? navigator.share({title: '${news.title}', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)" 
                       class="fas fa-share size-8 text-white hover:text-gray-200 cursor-pointer transition-colors bg-black bg-opacity-50 rounded-lg p-1.5 backdrop-blur-sm"></i>
                    <i onclick="this.closest('app-news-view').copyNewsUrl()" 
                       class="fas fa-copy size-8 text-white hover:text-gray-200 cursor-pointer transition-colors bg-black bg-opacity-50 rounded-lg p-1.5 backdrop-blur-sm"></i>
                </div>
                
                <!-- Dark gradient overlay for images -->
                ${news.banner_image ? `
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                ` : ''}
            </div>

            <!-- Two Container Layout Under Banner -->
            <div class="mx-auto px-4">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <!-- Left Container -->
                    <div class="space-y-6">
                        <!-- Title -->
                        <div>
                            <h1 class="text-3xl font-bold text-[${secondaryColor}] mb-2">${news.title ? news.title.charAt(0).toUpperCase() + news.title.slice(1) : 'Untitled News'}</h1>
                            ${news.subtitle ? `<p class="text-lg text-gray-600">${news.subtitle}</p>` : ''}
                        </div>

                        <!-- Content -->
                        ${news.content ? `
                            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <content-display 
                                    content="${news.content.replace(/"/g, '&quot;')}"
                                    no-styles>
                                </content-display>
                            </div>
                        ` : ''}

                        <!-- Dates and Slug -->
                        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div class="space-y-4">
                                <!-- Created Date -->
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-[${primaryColor}] bg-opacity-10 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-calendar text-[${primaryColor}]"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">Published Date</p>
                                        <p class="font-semibold text-[${secondaryColor}]">${this.formatDate(news.created_at)}</p>
                                    </div>
                                </div>

                                <!-- Updated Date -->
                                ${news.updated_at && news.updated_at !== news.created_at ? `
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-[${accentColor}] bg-opacity-10 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-edit text-[${accentColor}]"></i>
                                        </div>
                                        <div>
                                            <p class="text-sm text-gray-600">Last Updated</p>
                                            <p class="font-semibold text-[${secondaryColor}]">${this.formatDate(news.updated_at)}</p>
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Slug -->
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-[${darkColor}] bg-opacity-10 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-link text-[${darkColor}]"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">URL Slug</p>
                                        <p class="font-semibold text-[${secondaryColor}]">${news.slug || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Container -->
                    <div class="space-y-6">
                        <!-- News List -->
                        <news-list></news-list>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-news-view', NewsView);
export default NewsView; 