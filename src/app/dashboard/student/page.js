import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';

/**
 * Student Dashboard Page Component (/dashboard/student)
 * 
 * Enhanced student dashboard with dummy data and loading states.
 */
class StudentDashboardPage extends App {
    constructor() {
        super();
        this.dashboardData = {
            upcomingAssignments: [
                { title: 'Mathematics Problem Set', subject: 'Mathematics', dueDate: '2024-01-15', daysLeft: 3 },
                { title: 'English Essay - Shakespeare', subject: 'English Literature', dueDate: '2024-01-10', daysLeft: -2 },
                { title: 'Physics Lab Report', subject: 'Physics', dueDate: '2024-01-20', daysLeft: 8 }
            ],
            recentGrades: [
                { subject: 'Mathematics', grade: 'A-', assignment: 'Algebra Quiz', date: '2024-01-05' },
                { subject: 'English Literature', grade: 'A-', assignment: 'Shakespeare Essay', date: '2024-01-08' },
                { subject: 'Physics', grade: 'B+', assignment: 'Lab Report', date: '2024-01-06' }
            ],
            classSchedule: [
                { time: '08:00 AM', subject: 'Mathematics', teacher: 'Mr. Johnson', room: 'Room 101' },
                { time: '09:30 AM', subject: 'English Literature', teacher: 'Mrs. Williams', room: 'Room 102' },
                { time: '11:00 AM', subject: 'Physics', teacher: 'Dr. Smith', room: 'Lab 201' },
                { time: '01:00 PM', subject: 'World History', teacher: 'Mr. Davis', room: 'Room 103' },
                { time: '02:30 PM', subject: 'French', teacher: 'Mme. Dubois', room: 'Room 104' }
            ],
            stats: {
                totalAssignments: 18,
                pendingAssignments: 4,
                completedAssignments: 14,
                averageGrade: 'A-',
                attendanceRate: 95
            }
        };
        this.loading = true;
        this.currentUser = null;
        
        // Initialize state properly
        this.set('dashboardData', this.dashboardData);
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
        }, 1500);
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

    getDaysLeftText(daysLeft) {
        if (daysLeft < 0) return `Overdue by ${Math.abs(daysLeft)} days`;
        if (daysLeft === 0) return 'Due today';
        if (daysLeft === 1) return 'Due tomorrow';
        return `Due in ${daysLeft} days`;
    }

    getGradeColor(grade) {
        const gradeColors = {
            'A+': 'text-green-600 bg-green-100',
            'A': 'text-green-600 bg-green-100',
            'A-': 'text-green-500 bg-green-50',
            'B+': 'text-blue-600 bg-blue-100',
            'B': 'text-blue-500 bg-blue-50',
            'B-': 'text-blue-400 bg-blue-50',
            'C+': 'text-yellow-600 bg-yellow-100',
            'C': 'text-yellow-500 bg-yellow-50',
            'C-': 'text-yellow-400 bg-yellow-50',
            'D+': 'text-orange-600 bg-orange-100',
            'D': 'text-orange-500 bg-orange-50',
            'F': 'text-red-600 bg-red-100'
        };
        return gradeColors[grade] || 'text-gray-600 bg-gray-100';
    }

    render() {
        const dashboardData = this.get('dashboardData') || this.dashboardData;
        const loading = this.get('loading');
        const currentUser = this.get('currentUser');
        const { upcomingAssignments, recentGrades, classSchedule, stats } = dashboardData;
        const userName = currentUser?.name || 'Student';

        return `
            <div class="space-y-6">
                <!-- Welcome Header -->
                <div class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <i class="fas fa-user-graduate text-2xl"></i>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold">Welcome Back, ${userName}!</h1>
                                <p class="text-blue-100">Here's your academic overview for today</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold">${new Date().toLocaleDateString()}</div>
                            <div class="text-blue-100 text-sm">Current Date</div>
                        </div>
                    </div>
                </div>

                ${loading ? `
                    <!-- Loading Skeleton -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-white rounded-xl shadow-lg p-4 animate-pulse">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div class="w-8 h-8 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div class="bg-white rounded-xl shadow-lg p-4 animate-pulse">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div class="w-8 h-8 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div class="bg-white rounded-xl shadow-lg p-4 animate-pulse">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div class="w-8 h-8 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div class="bg-white rounded-xl shadow-lg p-4 animate-pulse">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div class="w-8 h-8 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <!-- Quick Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm text-gray-600">Total Assignments</p>
                                    <p class="text-2xl font-bold text-blue-600">${stats.totalAssignments}</p>
                                </div>
                                <i class="fas fa-tasks text-blue-500 text-2xl"></i>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-500">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm text-gray-600">Pending</p>
                                    <p class="text-2xl font-bold text-yellow-600">${stats.pendingAssignments}</p>
                                </div>
                                <i class="fas fa-clock text-yellow-500 text-2xl"></i>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm text-gray-600">Average Grade</p>
                                    <p class="text-2xl font-bold ${this.getGradeColor(stats.averageGrade)}">${stats.averageGrade}</p>
                                </div>
                                <i class="fas fa-star text-green-500 text-2xl"></i>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-500">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm text-gray-600">Attendance</p>
                                    <p class="text-2xl font-bold text-purple-600">${stats.attendanceRate}%</p>
                                </div>
                                <i class="fas fa-calendar-check text-purple-500 text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Main Content Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Upcoming Assignments -->
                        <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div class="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-exclamation-triangle text-white text-xl"></i>
                                    <h2 class="text-lg font-semibold text-white">Upcoming Assignments</h2>
                                </div>
                            </div>
                            <div class="p-6">
                                ${upcomingAssignments.map(assignment => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3 last:mb-0">
                                        <div class="flex-1">
                                            <h4 class="font-medium text-gray-900">${assignment.title}</h4>
                                            <p class="text-sm text-gray-600">${assignment.subject}</p>
                                            <p class="text-xs text-gray-500">${this.getDaysLeftText(assignment.daysLeft)}</p>
                                        </div>
                                        <div class="text-right">
                                            <ui-badge variant="${assignment.daysLeft < 0 ? 'error' : assignment.daysLeft <= 1 ? 'warning' : 'info'}">
                                                ${assignment.daysLeft < 0 ? 'Overdue' : assignment.daysLeft <= 1 ? 'Urgent' : 'Pending'}
                                            </ui-badge>
                                        </div>
                                    </div>
                                `).join('')}
                                <div class="mt-4">
                                    <ui-button variant="primary" size="sm" href="/dashboard/student/assignments">
                                        <i class="fas fa-eye mr-2"></i>View All Assignments
                                    </ui-button>
                                </div>
                            </div>
                        </div>

                        <!-- Recent Grades -->
                        <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div class="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-chart-line text-white text-xl"></i>
                                    <h2 class="text-lg font-semibold text-white">Recent Grades</h2>
                                </div>
                            </div>
                            <div class="p-6">
                                ${recentGrades.map(grade => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3 last:mb-0">
                                        <div class="flex-1">
                                            <h4 class="font-medium text-gray-900">${grade.subject}</h4>
                                            <p class="text-sm text-gray-600">${grade.assignment}</p>
                                            <p class="text-xs text-gray-500">${new Date(grade.date).toLocaleDateString()}</p>
                                        </div>
                                        <div class="text-right">
                                            <span class="inline-block px-2 py-1 rounded-full text-sm font-semibold ${this.getGradeColor(grade.grade)}">
                                                ${grade.grade}
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                                <div class="mt-4">
                                    <ui-button variant="secondary" size="sm" href="/dashboard/student/grades">
                                        <i class="fas fa-chart-bar mr-2"></i>View All Grades
                                    </ui-button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Today's Schedule -->
                    <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div class="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-calendar-alt text-white text-xl"></i>
                                <h2 class="text-lg font-semibold text-white">Today's Schedule</h2>
                            </div>
                        </div>
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${classSchedule.map((classItem, index) => `
                                    <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                            <span class="text-white font-bold text-sm">${index + 1}</span>
                                        </div>
                                        <div class="flex-1">
                                            <h4 class="font-medium text-gray-900">${classItem.subject}</h4>
                                            <p class="text-sm text-gray-600">${classItem.teacher}</p>
                                            <p class="text-xs text-gray-500">${classItem.time} • ${classItem.room}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <ui-button variant="primary" href="/dashboard/student/class" class="w-full">
                                <i class="fas fa-chalkboard mr-2"></i>My Class
                            </ui-button>
                            <ui-button variant="secondary" href="/dashboard/student/assignments" class="w-full">
                                <i class="fas fa-tasks mr-2"></i>My Assignments
                            </ui-button>
                            <ui-button variant="secondary" href="/dashboard/student/grades" class="w-full">
                                <i class="fas fa-chart-line mr-2"></i>My Grades
                            </ui-button>
                            <ui-button variant="secondary" href="/dashboard/profile" class="w-full">
                                <i class="fas fa-user mr-2"></i>My Profile
                            </ui-button>
                        </div>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('app-student-dashboard-page', StudentDashboardPage);
export default StudentDashboardPage; 