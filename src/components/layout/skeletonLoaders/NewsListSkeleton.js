import App from '@/core/App.js';

/**
 * News List Skeleton Loader Component
 * 
 * Displays skeleton loading animation for news list
 */
class NewsListSkeleton extends App {
    constructor() {
        super();
    }

    render() {
        return `
            <div class="space-y-4">
                ${Array.from({ length: 5 }, (_, index) => `
                    <div class="bg-gray-50 rounded-xl p-4 shadow-sm border-l-4 border-gray-200">
                        <div class="flex items-start justify-between">
                            <div class="flex-1 min-w-0">
                                <!-- Title skeleton -->
                                <div class="h-5 bg-gray-200 rounded mb-2 w-3/4 animate-pulse"></div>
                                
                                <!-- Date and slug skeleton -->
                                <div class="flex items-center gap-4 mb-2">
                                    <div class="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                    <div class="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                </div>
                                
                                <!-- Content preview skeleton -->
                                <div class="space-y-1">
                                    <div class="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                                    <div class="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                            
                            <!-- Status badge skeleton -->
                            <div class="ml-4 flex-shrink-0">
                                <div class="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

customElements.define('news-list-skeleton', NewsListSkeleton);
export default NewsListSkeleton; 