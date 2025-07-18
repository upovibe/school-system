import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/layout/Header.js';
import '@/components/layout/Footer.js';

/**
 * Root Layout Component
 * 
 * This layout wraps all pages in the app directory
 * Similar to Next.js layout.js
 * 
 * Features:
 * - Common header/footer
 * - Global app structure
 * - Layout configuration per page
 */
class RootLayout extends App {
    constructor() {
        super();
        // Make API service available on this instance
        this.api = api;
    }

    connectedCallback() {
        super.connectedCallback();
        // Make API service available globally
        window.api = api;
    }

    render() {
        return `
            <div class="flex flex-col min-h-screen bg-gray-50">
                <app-header></app-header>
                
                <main class="flex-grow p-5 container mx-auto">
                    <!-- Page content will be injected here -->
                </main>
                
                <app-footer></app-footer>
            </div>
        `;
    }
    
    // Set page content
    setPageContent(htmlContent) {
        const outlet = this.querySelector('main');
        if (outlet) {
            outlet.innerHTML = htmlContent;
        } else {
            console.error('Main content outlet not found in root layout.');
        }
    }
    
    // Configure layout options
    configure(options = {}) {
        Object.entries(options).forEach(([key, value]) => {
            this.set(key, value);
        });
    }
}

customElements.define('root-layout', RootLayout);
export default RootLayout; 