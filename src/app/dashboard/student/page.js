import App from '@/core/App.js';
import api from '@/services/api.js';

/**
 * Student Dashboard Page Component (/dashboard/student)
 * 
 * Enhanced student dashboard with header, date, and academic year display.
 */
class StudentDashboardPage extends App {
    constructor() {
        super();
        this.loading = true;
        this.currentUser = null;
        this.classData = null;
        
        // Initialize state properly
        this.set('loading', true);
        this.set('currentUser', null);
        this.set('classData', null);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Student Dashboard | School System';
        this.loadUserData();
        this.loadClassData();
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

    async loadClassData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/students/current-class');
            
            if (response.data && response.data.success) {
                this.set('classData', response.data.data);
            }
        } catch (error) {
            console.error('❌ Error loading class data:', error);
        }
    }

    render() {
        const loading = this.get('loading');
        const currentUser = this.get('currentUser');
        const classData = this.get('classData');
        const userName = currentUser?.name || 'Student';
        const classInfo = classData?.class || {};

        return `
            <div class="space-y-8">
                <!-- Enhanced Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <h1 class="text-2xl sm:text-3xl font-bold">Student Dashboard</h1>
                            <p class="text-blue-100 text-base sm:text-lg">Welcome back, ${userName}! Here's your academic overview.</p>
                            <p class="text-blue-100 text-sm mt-1">
                                <i class="fas fa-calendar-alt mr-1"></i>
                                ${new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${classData?.subjects?.length || 0}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Subjects</div>
                            </div>
                        </div>
                    </div>
                    
                    ${classInfo.name ? `
                        <!-- Class Information -->
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-12 flex items-center justify-center bg-blue-500 rounded-lg mr-4 flex-shrink-0">
                                    <i class="fas fa-graduation-cap text-white text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-lg font-semibold">${classInfo.name} ${classInfo.section}</div>
                                    <div class="text-blue-100 text-sm">Academic Year: ${classInfo.academic_year}</div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <i class="fas fa-exclamation-triangle text-yellow-300 mr-3"></i>
                                <div>
                                    <div class="text-lg font-semibold">No Class Assigned</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Please contact your administrator</div>
                                </div>
                            </div>
                        </div>
                    `}
                </div>

                ${loading ? `
                    <!-- Loading Skeleton -->
                    <div class="space-y-6">
                        <div class="bg-white shadow rounded-lg p-6 animate-pulse">
                            <div class="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div class="bg-white shadow rounded-lg p-6">
                                <div class="animate-pulse">
                                    <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div class="h-8 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                            <div class="bg-white shadow rounded-lg p-6">
                                <div class="animate-pulse">
                                    <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div class="h-8 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                            <div class="bg-white shadow rounded-lg p-6">
                                <div class="animate-pulse">
                                    <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div class="h-8 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                            <div class="bg-white shadow rounded-lg p-6">
                                <div class="animate-pulse">
                                    <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div class="h-8 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <!-- Quick Actions -->
                    <div class="bg-white shadow rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <a href="/dashboard/student/class" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                                <i class="fas fa-chalkboard text-xl mb-2 block"></i>
                                <div class="font-medium">My Class</div>
                                <div class="text-xs opacity-90">View subjects & teachers</div>
                            </a>
                            <a href="/dashboard/student/assignments" class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                                <i class="fas fa-tasks text-xl mb-2 block"></i>
                                <div class="font-medium">My Assignments</div>
                                <div class="text-xs opacity-90">Submit & track work</div>
                            </a>
                            <a href="/dashboard/student/grades" class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                                <i class="fas fa-chart-line text-xl mb-2 block"></i>
                                <div class="font-medium">My Grades</div>
                                <div class="text-xs opacity-90">View performance</div>
                            </a>
                            <a href="/dashboard/profile" class="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                                <i class="fas fa-user text-xl mb-2 block"></i>
                                <div class="font-medium">My Profile</div>
                                <div class="text-xs opacity-90">Update information</div>
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