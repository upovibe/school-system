import App from '@/core/App.js';

/**
 * Student Dashboard Page Component (/dashboard/student)
 * 
 * Simple student dashboard with basic content.
 */
class StudentDashboardPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Student Dashboard | School System';
    }

    render() {
        return `
            <div class="space-y-6">
                <div class="bg-white shadow rounded-lg p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-4">
                        Student Dashboard
                    </h1>
                    <p class="text-gray-600">
                        Welcome to your student dashboard. Here you can view your academic information.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">My Courses</h3>
                        <p class="text-gray-600">View your enrolled courses and schedules.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Grades</h3>
                        <p class="text-gray-600">Check your academic performance and grades.</p>
                    </div>

                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Assignments</h3>
                        <p class="text-gray-600">View and submit your assignments.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-student-dashboard-page', StudentDashboardPage);
export default StudentDashboardPage; 