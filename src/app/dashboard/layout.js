import App from '@/core/App.js';
import '@/components/ui/Toast.js';

/**
 * Dashboard Layout Component
 * 
 * This layout provides a consistent structure for all dashboard pages.
 * It includes a header, sidebar navigation, and main content area.
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

    handleLogout() {
        // Show logout toast
        Toast.show({
            title: 'Logout Successful',
            message: 'You have been logged out successfully',
            variant: 'info',
            duration: 2000
        });

        // Clear user data
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        
        // Redirect after toast
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 2000);
    }

    render() {
        const userRole = this.currentUser?.role || 'User';
        const userName = this.currentUser?.name || 'User';
        
        return `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <header class="bg-white shadow-sm border-b border-gray-200">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center py-4">
                            <div class="flex items-center">
                                <h1 class="text-xl font-semibold text-gray-900">
                                    School Management System
                                </h1>
                            </div>
                            <div class="flex items-center space-x-4">
                                <span class="text-sm text-gray-600">
                                    Welcome, ${userName} (${userRole})
                                </span>
                                <button 
                                    onclick="this.closest('app-dashboard-layout').handleLogout()"
                                    class="text-sm text-red-600 hover:text-red-800 transition-colors">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    ${this.pageContent}
                </main>
            </div>
        `;
    }
}

customElements.define('app-dashboard-layout', DashboardLayout);
export default DashboardLayout; 