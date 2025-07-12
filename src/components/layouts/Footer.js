import App from '@/core/App.js';

/**
 * App Footer Component
 * 
 * A simple, consistent footer for all pages.
 */
class Footer extends App {
    render() {
        return `
            <footer class="bg-white border-t">
                <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div class="text-center text-sm text-gray-500">
                        <p>&copy; ${new Date().getFullYear()} UPO UI. All Rights Reserved.</p>
                        <p class="mt-1">
                            Powered by Vanilla JS, with no build step.
                        </p>
                    </div>
                </div>
            </footer>
        `;
    }
}

customElements.define('app-footer', Footer);
export default Footer; 