import App from '@/core/App.js';

/**
 * Teacher Dashboard Page Component (/dashboard/teacher)
 * 
 * Simple teacher dashboard with basic content.
 */
class TeacherDashboardPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Teacher Dashboard | School System';
    }

    render() {
        return `
            <div class="space-y-6">
                <div class="bg-white shadow rounded-lg p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-4">
                        Teacher Dashboard
                    </h1>
                    <p class="text-gray-600">
                        Welcome to your teacher dashboard. Here you can manage your classes and students.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">My Classes</h3>
                        <p class="text-gray-600">Manage your assigned classes and schedules.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Students</h3>
                        <p class="text-gray-600">View and manage your student roster.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Grades</h3>
                        <p class="text-gray-600">Enter and manage student grades.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-teacher-dashboard-page', TeacherDashboardPage);
export default TeacherDashboardPage; 