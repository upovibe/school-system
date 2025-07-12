import App from '@/core/App.js';
import '@/components/ui/Box.js';
import '@/components/layout/CounterLayout.js';

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
            <div class="flex justify-center items-center">
                <counter-layout></counter-layout>
            </div>
        `;
    }
}

customElements.define('app-root-page', RootPage);
export default RootPage; 