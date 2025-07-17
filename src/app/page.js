import App from '@/core/App.js';
import '@/components/ui/Box.js';
import '@/components/ui/ImageCarousel.js';
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
            <div class="container mx-auto p-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-8">Welcome to Our School</h1>
                
                <div class="max-w-6xl mx-auto space-y-12">
                    <!-- Main Image Carousel -->
                    <div>
                        <h2 class="text-2xl font-semibold text-gray-800 mb-6">School Highlights</h2>
                        <ui-image-carousel autoplay interval="4000" height="500px">
                            <ui-image-carousel-item 
                                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=500&fit=crop" 
                                alt="School Campus"
                                title="Excellence in Education"
                                description="Providing quality education and fostering academic excellence">
                            </ui-image-carousel-item>
                            
                            <ui-image-carousel-item 
                                src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=500&fit=crop" 
                                alt="Students Learning"
                                title="Modern Learning Environment"
                                description="State-of-the-art facilities for enhanced learning experiences">
                            </ui-image-carousel-item>
                            
                            <ui-image-carousel-item 
                                src="https://images.unsplash.com/photo-1523050854058-8df90110c9e1?w=1200&h=500&fit=crop" 
                                alt="School Activities"
                                title="Holistic Development"
                                description="Nurturing students' academic, social, and personal growth">
                            </ui-image-carousel-item>
                            
                            <ui-image-carousel-item 
                                src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&h=500&fit=crop" 
                                alt="Library"
                                title="Knowledge Hub"
                                description="Extensive library resources and research facilities">
                            </ui-image-carousel-item>
                        </ui-image-carousel>
                    </div>

                    <div class="mb-8">
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">Live Example</h2>
                        <ui-box class="p-4 shadow rounded-lg border border-gray-200 flex justify-center items-center">
                            <ui-carousel>
                                <ui-carousel-item>
                                    <ui-card class="size-40 flex items-center justify-center border border-gray-200 rounded-lg shodow-md">Slide 1</ui-card>
                                </ui-carousel-item>
                                <ui-carousel-item>
                                    <ui-card class="size-40 flex items-center justify-center border border-gray-200 rounded-lg shodow-md">Slide 2</ui-card>
                                </ui-carousel-item>
                                <ui-carousel-item>
                                    <ui-card class="size-40 flex items-center justify-center border border-gray-200 rounded-lg shodow-md">Slide 3</ui-card>
                                </ui-carousel-item>
                            </ui-carousel>
                        </ui-box>
                    </div>
                </div>
                
                <div class="mt-8 text-center">
                    <p class="text-gray-600">Discover our commitment to academic excellence and student success</p>
                </div>
            </div>
        `;
    }
}

customElements.define('app-root-page', RootPage);
export default RootPage; 