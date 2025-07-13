import App from '@/core/App.js';

/**
 * Page Settings Page
 * 
 * Simple page that displays page settings content
 */
class PageSettingsPage extends App {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('🔧 PageSettingsPage connectedCallback');
        document.title = 'Page Settings | School System';
    }

    render() {
        console.log('🔧 PageSettingsPage render called');
        return `
            <div class="bg-white rounded-lg shadow-lg p-8 m-4">
                <div class="text-center">
                    <h1 class="text-3xl font-bold text-gray-900 mb-4">Page Settings</h1>
                    <p class="text-lg text-gray-600 mb-4">Page settings content will be displayed here.</p>
                    <div class="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded">
                        <p class="font-medium">Debug Info:</p>
                        <p>This page is working correctly!</p>
                        <p>Current URL: ${window.location.pathname}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-page-settings-page', PageSettingsPage);
export default PageSettingsPage;