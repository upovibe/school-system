import App from '@/core/App.js';
import api from '@/services/api.js';
import PageLoader from '@/components/common/PageLoader.js';
import store from '@/core/store.js';

// Load Quill CSS for content display
if (!document.querySelector('link[href*="quill"]')) {
    const link = document.createElement('link');
    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

/**
 * Videos Page Component (/gallery/videos)
 * 
 * This is the videos page of the application.
 * It renders within the global RootLayout and fetches data for the "videos" slug.
 * File-based routing: /gallery/videos → app/public/gallery/videos/page.js
 */
class VideosPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Videos | UPO UI';
        this.loadPageData();
    }

    async loadPageData() {
        // Check if data is already cached in global store
        const globalState = store.getState();
        if (globalState.videosPageData) {
            this.set('pageData', globalState.videosPageData);
            this.render();
            return;
        }

        // If not cached, fetch from API
        await this.fetchPageData();
    }

    async fetchPageData() {
        try {
            const response = await api.get('/pages/slug/videos');
            if (response.data.success) {
                const pageData = response.data.data;
                
                // Cache the data in global store
                store.setState({ videosPageData: pageData });
                
                // Set local state and render
                this.set('pageData', pageData);
                this.render();
            }
        } catch (error) {
            console.error('Error fetching videos page data:', error);
            this.set('error', 'Failed to load videos page data');
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

    // Helper method to get content preview (first 150 characters)
    getContentPreview(content) {
        if (!content) return '';
        
        // Remove HTML tags and get plain text
        const plainText = content.replace(/<[^>]*>/g, '');
        
        // Return first 150 characters with ellipsis if longer
        return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
    }

    // Method to refresh data (clear cache and fetch again)
    async refreshData() {
        // Clear the cache
        store.setState({ videosPageData: null });
        
        // Fetch fresh data
        await this.fetchPageData();
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

        if (!pageData) {
            return `
                <div class="container flex items-center justify-center mx-auto p-8">
                    <page-loader></page-loader>
                </div>
            `;
        }

        return `
            <div class="max-w-7xl mx-auto">
                <!-- Banner Images Section -->
                ${this.getBannerImages(pageData).length > 0 ? `
                    <div class="mb-8">
                        <div class="relative">
                            <!-- Main Banner Image -->
                            <div class="relative w-full h-96">
                                <img src="${this.getImageUrl(this.getBannerImages(pageData)[0])}" 
                                     alt="Videos Banner Image" 
                                     class="w-full h-full object-cover rounded-lg shadow-lg"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-lg">
                                    <div class="text-center">
                                        <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                        <p class="text-gray-500">Banner image not found</p>
                                    </div>
                                </div>
                                <!-- Dark gradient overlay from bottom to top -->
                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-lg"></div>
                            </div>
                        </div>
                        
                        <!-- Additional Banner Images Grid -->
                        ${this.getBannerImages(pageData).length > 1 ? `
                            <div class="mt-6">
                                <h2 class="text-2xl font-semibold text-gray-900 mb-4">Gallery</h2>
                                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    ${this.getBannerImages(pageData).slice(1).map((imagePath, index) => `
                                        <div class="relative group">
                                            <div class="relative w-full h-32">
                                                <img src="${this.getImageUrl(imagePath)}" 
                                                     alt="Videos Gallery Image ${index + 2}" 
                                                     class="w-full h-full object-cover rounded-lg border border-gray-200"
                                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                                <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                                    <div class="text-center">
                                                        <i class="fas fa-image text-gray-400 text-lg mb-1"></i>
                                                        <p class="text-gray-500 text-xs">Image not found</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="bg-white p-6 rounded-md">
                    ${pageData.content ? `
                        <div class="content-section">
                            <div class="content-preview text-lg leading-relaxed">
                                ${pageData.content}
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500 italic">No content available</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
}

customElements.define('app-videos-page', VideosPage);
export default VideosPage; 