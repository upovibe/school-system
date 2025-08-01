import App from '@/core/App.js';
import api from '@/services/api.js';

/**
 * Student Dashboard Page Component (/dashboard/student)
 * 
 * Simple student dashboard matching admin page structure.
 */
class StudentDashboardPage extends App {
    constructor() {
        super();
        this.loading = true;
        this.currentUser = null;
        
        // Initialize state properly
        this.set('loading', true);
        this.set('currentUser', null);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Student Dashboard | School System';
        this.loadUserData();
        this.simulateLoading();
    }

    async simulateLoading() {
        // Simulate API loading time
        setTimeout(() => {
            this.set('loading', false);
        }, 1000);
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            // Get current user data
            const userResponse = await api.withToken(token).get('/auth/me');
            this.set('currentUser', userResponse.data);
            
        } catch (error) {
            console.error('❌ Error loading user data:', error);
        }
    }

    render() {
        const loading = this.get('loading');
        const currentUser = this.get('currentUser');
        const userName = currentUser?.name || 'Student';

        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white shadow rounded-lg p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">
                        Student Dashboard
                    </h1>
                    <p class="text-gray-600">
                        Welcome <span class="font-semibold text-blue-600">${userName}</span> as a Student. Here you can view your academic information and manage your profile.
                    </p>
                </div>

                ${loading ? `
                    <!-- Loading Skeleton -->
                    <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            <div class="ml-4 flex-1">
                                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <!-- User Info Card -->
                    <div class="bg-white shadow rounded-lg p-6">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-user-graduate text-blue-600 text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Student Information</p>
                                <p class="text-2xl font-bold text-gray-900">${userName}</p>
                                <p class="text-sm text-gray-500">${currentUser?.email || 'student@school.com'}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <a href="/dashboard/student/class" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center transition-colors">
                                <i class="fas fa-chalkboard mr-2"></i>My Class
                            </a>
                            <a href="/dashboard/student/assignments" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-center transition-colors">
                                <i class="fas fa-tasks mr-2"></i>My Assignments
                            </a>
                            <a href="/dashboard/student/grades" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-center transition-colors">
                                <i class="fas fa-chart-line mr-2"></i>My Grades
                            </a>
                            <a href="/dashboard/profile" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-center transition-colors">
                                <i class="fas fa-user mr-2"></i>My Profile
                            </a>
                        </div>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('app-student-dashboard-page', StudentDashboardPage);
export default StudentDashboardPage; 