import App from '@/core/App.js';

/**
 * Staff Dashboard Page Component (/dashboard/staff)
 * 
 * Simple staff dashboard with basic content.
 */
class StaffDashboardPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Staff Dashboard | School System';
    }

    render() {
        return `
            <div class="space-y-6">
                <div class="bg-white shadow rounded-lg p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-4">
                        Staff Dashboard
                    </h1>
                    <p class="text-gray-600">
                        Welcome to your staff dashboard. Here you can manage administrative tasks.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Administration</h3>
                        <p class="text-gray-600">Manage administrative tasks and records.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Reports</h3>
                        <p class="text-gray-600">Generate and view various reports.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Support</h3>
                        <p class="text-gray-600">Provide support to teachers and students.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-staff-dashboard-page', StaffDashboardPage);
export default StaffDashboardPage; 