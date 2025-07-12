import App from '@/core/App.js';
import '@/components/ui/Toast.js';
import '@/components/layouts/Dashboard.js';

/**
 * Dashboard Layout Component
 * 
 * This layout now uses the comprehensive dashboard component with sidebar and header.
 * It provides a consistent structure for all dashboard pages with role-based navigation.
 */
class DashboardLayout extends App {
    constructor() {
        super();
        this.pageContent = '';
        this.currentUser = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Dashboard | School System';
        this.loadUserData();
    }

    loadUserData() {
        // Get user data from localStorage or session
        const userData = localStorage.getItem('userData');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    /**
     * Set the page content to be rendered within this layout
     * @param {string} content - HTML content to render
     */
    setPageContent(content) {
        this.pageContent = content;
        this.innerHTML = this.render();
    }

    render() {
        return `
            <app-dashboard>
                ${this.pageContent}
            </app-dashboard>
        `;
    }
}

customElements.define('app-dashboard-layout', DashboardLayout);
export default DashboardLayout; 