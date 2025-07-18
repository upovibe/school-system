import App from '@/core/App.js';
import '@/components/layout/homeLayout/HeroSection.js';
import '@/components/layout/homeLayout/AboutSection.js';
import '@/components/layout/homeLayout/AcademicsSection.js';

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
                
                <!-- About Section Component -->
                <about-section></about-section>
                
                <!-- Academics Section Component -->
                <academics-section></academics-section>
            </div>
        `;
    }
}

customElements.define('app-root-page', RootPage);
export default RootPage; 