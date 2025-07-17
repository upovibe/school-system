import App from '@/core/App.js';
import api from '@/services/api.js';
import PageLoader from '@/components/common/PageLoader.js';

/**
 * Root Page Component (/)
 * 
 * This is the home page of the application.
 * It now renders within the global RootLayout.
 */
class RootPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Home | UPO UI';
        this.fetchPageData();
    }

    async fetchPageData() {
        try {
            const response = await api.get('/pages/slug/home');
            if (response.data.success) {
                this.set('pageData', response.data.data);
                this.render();
            }
        } catch (error) {
            console.error('Error fetching page data:', error);
            this.set('error', 'Failed to load page data');
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
                                     alt="Banner Image" 
                                     class="w-full h-full object-cover rounded-lg shadow-lg"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-lg">
                                    <div class="text-center">
                                        <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                        <p class="text-gray-500">Banner image not found</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Banner Content Overlay -->
                            <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <div class="text-center text-white">
                                    <h1 class="text-4xl md:text-6xl font-bold mb-4">${pageData.title || 'Welcome'}</h1>
                                    ${pageData.content ? `
                                        <p class="text-lg md:text-xl max-w-2xl mx-auto px-4">
                                            ${this.getContentPreview(pageData.content)}
                                        </p>
                                    ` : ''}
                                </div>
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
                                                     alt="Gallery Image ${index + 2}" 
                                                     class="w-full h-full object-cover rounded-lg border border-gray-200"
                                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                                <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                                    <div class="text-center">
                                                        <i class="fas fa-image text-gray-400 text-lg mb-1"></i>
                                                        <p class="text-gray-500 text-xs">Image not found</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onclick="window.open('${this.getImageUrl(imagePath)}', '_blank')" 
                                                        class="bg-white bg-opacity-90 text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
                                                    <i class="fas fa-external-link-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="mb-6">
                        <h2 class="text-xl font-semibold mb-4">Page Information</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h3 class="font-medium text-gray-700">Title</h3>
                                <p class="text-lg font-semibold text-gray-900">${pageData.title || 'N/A'}</p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h3 class="font-medium text-gray-700">Slug</h3>
                                <p class="text-lg font-semibold text-gray-900">${pageData.slug || 'N/A'}</p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h3 class="font-medium text-gray-700">Status</h3>
                                <p class="text-lg font-semibold text-gray-900">${pageData.status || 'N/A'}</p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h3 class="font-medium text-gray-700">Created At</h3>
                                <p class="text-lg font-semibold text-gray-900">${pageData.created_at || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    
                    ${pageData.content ? `
                        <div class="mb-6">
                            <h2 class="text-xl font-semibold mb-4">Content</h2>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="prose max-w-none">${pageData.content}</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${pageData.banner_images && pageData.banner_images.length > 0 ? `
                        <div class="mb-6">
                            <h2 class="text-xl font-semibold mb-4">Banner Images (${pageData.banner_images.length})</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${pageData.banner_images.map((image, index) => `
                                    <div class="bg-gray-50 rounded-lg p-4">
                                        <img src="/api/${image}" alt="Banner ${index + 1}" class="w-full h-32 object-cover rounded mb-2">
                                        <p class="text-sm text-gray-600">Banner ${index + 1}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="mt-8">
                    <h2 class="text-xl font-semibold mb-4">Raw Data</h2>
                    <pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">${JSON.stringify(pageData, null, 2)}</pre>
                </div>
            </div>
        `;
    }
}

customElements.define('app-root-page', RootPage);
export default RootPage; 