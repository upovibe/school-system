import App from '@/core/App.js';
import api from '@/services/api.js';

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

    render() {
        const pageData = this.get('pageData');
        const error = this.get('error');

        if (error) {
            return `
                <div class="container mx-auto p-8">
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        ${error}
                    </div>
                </div>
            `;
        }

        if (!pageData) {
            return `
                <div class="container mx-auto p-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-8">Loading...</h1>
                </div>
            `;
        }

        return `
            <div class="container mx-auto p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-8">${pageData.title || 'Page Data'}</h1>
                
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