import App from '@/core/App.js';
import '@/components/layout/homeLayout/HeroSection.js';

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
    }

    render() {
        return `
            <div class="mx-auto">
                <!-- Hero Section Component -->
                <hero-section></hero-section>
            </div>
        `;
    }
}

customElements.define('app-root-page', RootPage);
export default RootPage; 