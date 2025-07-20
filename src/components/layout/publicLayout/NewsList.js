import App from '@/core/App.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/layout/skeletonLoaders/NewsListSkeleton.js';

/**
 * News List Component
 * 
 * Displays a list of news articles with filtering by status
 */
class NewsList extends App {
    constructor() {
        super();
        this.set('news', []);
        this.set('loading', true);
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadColorsFromSettings();
        this.loadNewsData();
    }

    async loadColorsFromSettings() {
        try {
            // Fetch colors from API
            const colors = await fetchColorSettings();
            
            // Set colors in component state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });
        } catch (error) {
            console.error('Error loading color settings:', error);
        }
    }

    async loadNewsData() {
        try {
            const response = await fetch('/api/news/active');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('news', data.data);
                } else {
                    this.set('news', []);
                }
            } else {
                console.error('Failed to fetch news:', response.statusText);
                this.set('news', []);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            this.set('news', []);
        }
        
        // Set loading to false
        this.set('loading', false);
        
        // Render with the loaded data
        this.render();
        

    }



    openNewsPage(slugOrId) {
        // Navigate to the news page using SPA router
        const newsUrl = `/public/community/news/${slugOrId}`;
        if (window.router) {
            window.router.navigate(newsUrl);
        } else {
            // Fallback to regular navigation if router is not available
            window.location.href = newsUrl;
        }
    }



    // Helper function to format date
    formatDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            // Handle different date formats from API
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    }

    // Helper function to get content preview
    getContentPreview(content) {
        if (!content) return 'No content available';
        
        // Remove HTML tags and get plain text
        const plainText = content.replace(/<[^>]*>/g, '');
        
        // Return first 100 characters with ellipsis if longer
        return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
    }

    render() {
        const loading = this.get('loading');
        const news = this.get('news') || [];
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');

        return `
            <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                <div class="p-5 lg:p-8">
                    <div class="flex items-center gap-2 mb-6">
                        <i class="fas fa-newspaper text-[${primaryColor}] text-xl"></i>
                        <h3 class="text-xl font-semibold text-[${secondaryColor}]">All News</h3>
                    </div>
                    
                    <!-- Tabs Component -->
                    <ui-tabs class="w-full" id="news-tabs">
                        <ui-tab-list class="mb-6">
                            <ui-tab value="all">All</ui-tab>
                        </ui-tab-list>
                        
                        <!-- News List Container -->
                        <div class="max-h-96 overflow-y-auto mx-auto py-1 rounded-xl mt-5 space-y-4" id="news-list">
                            ${loading ? `<news-list-skeleton></news-list-skeleton>` : news.length > 0 ? news.map(newsItem => {
                                return `
                                    <div class="bg-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[${primaryColor}] news-card cursor-pointer hover:bg-gray-100" 
                                         data-news='${JSON.stringify(newsItem).replace(/'/g, "&apos;")}'
                                         onclick="this.closest('news-list').openNewsPage('${newsItem.slug || newsItem.id}')">
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1 min-w-0">
                                                <h4 class="font-semibold text-[${secondaryColor}] mb-1 truncate capitalize" title="${newsItem.title || 'Untitled News'}">${newsItem.title || 'Untitled News'}</h4>
                                                <div class="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                    <span class="flex items-center gap-1">
                                                        <i class="fas fa-calendar text-[${primaryColor}]"></i>
                                                        ${this.formatDate(newsItem.created_at)}
                                                    </span>
                                                    <span class="flex items-center gap-1">
                                                        <i class="fas fa-link text-[${primaryColor}]"></i>
                                                        ${newsItem.slug || 'N/A'}
                                                    </span>
                                                </div>
                                                <p class="text-sm text-gray-600 line-clamp-2">
                                                    ${this.getContentPreview(newsItem.content)}
                                                </p>
                                            </div>

                                        </div>
                                    </div>
                                `;
                            }).join('') : `
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-newspaper text-2xl mb-2"></i>
                                    <p>No news available</p>
                                </div>
                            `}
                        </div>
                    </ui-tabs>
                </div>
            </div>
        `;
    }
}

customElements.define('news-list', NewsList);
export default NewsList; 