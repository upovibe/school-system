/**
 * Data Skeleton Component
 * Shows loading skeleton for data pages
 */
class DataSkeleton extends HTMLElement {
    constructor() {
        super();
        this.render();
    }

    render() {
        this.innerHTML = `
            <div class="space-y-6">
                <!-- Header skeleton -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="animate-pulse">
                        <div class="h-8 bg-white bg-opacity-20 rounded w-1/3 mb-4"></div>
                        <div class="h-4 bg-white bg-opacity-20 rounded w-1/2 mb-2"></div>
                        <div class="h-4 bg-white bg-opacity-20 rounded w-2/3"></div>
                    </div>
                    
                    <!-- Summary cards skeleton -->
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mt-6">
                        ${Array(4).fill(0).map(() => `
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="animate-pulse">
                                    <div class="size-10 bg-white bg-opacity-20 rounded-lg mr-3 sm:mr-4 mb-3"></div>
                                    <div class="h-6 bg-white bg-opacity-20 rounded w-1/2 mb-2"></div>
                                    <div class="h-3 bg-white bg-opacity-20 rounded w-3/4"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Table skeleton -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="animate-pulse">
                        <div class="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                        <div class="h-4 bg-gray-200 rounded w-96 mb-6"></div>
                        <div class="space-y-4">
                            ${Array(8).fill(0).map(() => `
                                <div class="h-16 bg-gray-200 rounded w-full"></div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('data-skeleton', DataSkeleton);
export default DataSkeleton;
