import App from '@/core/App.js';

/**
 * Parent Dashboard Page Component (/dashboard/parent)
 * 
 * Simple parent dashboard with basic content.
 */
class ParentDashboardPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Parent Dashboard | School System';
    }

    render() {
        return `
            <div class="space-y-6">
                <div class="bg-white shadow rounded-lg p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-4">
                        Parent Dashboard
                    </h1>
                    <p class="text-gray-600">
                        Welcome to your parent dashboard. Here you can monitor your child's academic progress.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">My Children</h3>
                        <p class="text-gray-600">View information about your children's academic progress.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Grades</h3>
                        <p class="text-gray-600">Monitor your children's grades and performance.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Attendance</h3>
                        <p class="text-gray-600">Track your children's attendance records.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-parent-dashboard-page', ParentDashboardPage);
export default ParentDashboardPage; 