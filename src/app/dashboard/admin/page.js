import App from '@/core/App.js';

/**
 * Admin Dashboard Page Component (/dashboard/admin)
 * 
 * Simple admin dashboard with basic content.
 */
class AdminDashboardPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Admin Dashboard | School System';
    }

    render() {
        return `
            <div class="space-y-6">
                <div class="bg-white shadow rounded-lg p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-4">
                        Admin Dashboard
                    </h1>
                    <p class="text-gray-600">
                        Welcome to the admin dashboard. Here you can manage the school system.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Students</h3>
                        <p class="text-gray-600">Manage student records and information.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Teachers</h3>
                        <p class="text-gray-600">Manage teacher accounts and assignments.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Classes</h3>
                        <p class="text-gray-600">Manage class schedules and subjects.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-admin-dashboard-page', AdminDashboardPage);
export default AdminDashboardPage; 