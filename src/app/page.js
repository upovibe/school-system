import App from '@/core/App.js';
import '@/components/ui/Box.js';
import '@/components/ui/Carousel.js';

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
            <div class="container mx-auto">
                <h1 class="text-3xl font-bold text-gray-900 mb-8">Welcome to Our School</h1>
                
                                <ui-carousel class="">
                    <ui-carousel-item>
                        <ui-card class="w-full h-64 flex items-center justify-center border border-gray-200 rounded-lg shadow-md" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold; font-size: 1.2rem;">Slide 1</ui-card>
                    </ui-carousel-item>
                    <ui-carousel-item>
                        <ui-card class="w-full h-64 flex items-center justify-center border border-gray-200 rounded-lg shadow-md" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; font-weight: bold; font-size: 1.2rem;">Slide 2</ui-card>
                    </ui-carousel-item>
                    <ui-carousel-item>
                        <ui-card class="w-full h-64 flex items-center justify-center border border-gray-200 rounded-lg shadow-md" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; font-weight: bold; font-size: 1.2rem;">Slide 3</ui-card>
                    </ui-carousel-item>
                </ui-carousel>
                
                <div class="mt-8 text-center">
                    <p class="text-gray-600">Discover our commitment to academic excellence and student success</p>
                </div>
            </div>
        `;
    }
}

customElements.define('app-root-page', RootPage);
export default RootPage; 