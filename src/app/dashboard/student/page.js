import App from '@/core/App.js';
import api from '@/services/api.js';

/**
 * Student Dashboard Page Component (/dashboard/student)
 * 
 * Enhanced student dashboard with gamification elements and academic rewards.
 */
class StudentDashboardPage extends App {
    constructor() {
        super();
        this.loading = true;
        this.currentUser = null;
        this.classData = null;
        this.gradesData = null;
        this.assignmentsData = null;
        
        // Initialize state properly
        this.set('loading', true);
        this.set('currentUser', null);
        this.set('classData', null);
        this.set('gradesData', null);
        this.set('assignmentsData', null);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Student Dashboard | School System';
        this.loadUserData();
        this.loadClassData();
        this.loadGradesData();
        this.loadAssignmentsData();
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

    async loadGradesData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/student/my-grades');
            this.set('gradesData', response.data?.data || []);
        } catch (error) {
            console.error('❌ Error loading grades data:', error);
        }
    }

    async loadAssignmentsData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await api.withToken(token).get('/students/my-assignments');
            this.set('assignmentsData', response.data?.data || []);
        } catch (error) {
            console.error('❌ Error loading assignments data:', error);
        }
    }

    calculateGradeStats() {
        const grades = this.get('gradesData') || [];
        
        const stats = {
            total: grades.length,
            a_plus: 0,
            a: 0,
            b_plus: 0,
            b: 0,
            c_plus: 0,
            c: 0,
            d: 0,
            f: 0,
            average_percentage: 0
        };

        let totalPercentage = 0;
        let validGrades = 0;

        grades.forEach(grade => {
            const letterGrade = grade.final_letter_grade?.toUpperCase();
            if (letterGrade === 'A+') stats.a_plus++;
            else if (letterGrade === 'A') stats.a++;
            else if (letterGrade === 'B+') stats.b_plus++;
            else if (letterGrade === 'B') stats.b++;
            else if (letterGrade === 'C+') stats.c_plus++;
            else if (letterGrade === 'C') stats.c++;
            else if (letterGrade === 'D') stats.d++;
            else if (letterGrade === 'F') stats.f++;

            if (grade.final_percentage) {
                totalPercentage += parseFloat(grade.final_percentage);
                validGrades++;
            }
        });

        stats.average_percentage = validGrades > 0 ? (totalPercentage / validGrades) : 0;
        return stats;
    }

    calculateAssignmentStats() {
        const assignments = this.get('assignmentsData') || [];
        
        // Filter to only show published assignments (matching assignments page logic)
        const publishedAssignments = assignments.filter(a => a.status === 'published' && !a.deleted_at);
        
        const stats = {
            total: publishedAssignments.length,
            pending: publishedAssignments.filter(a => (a.submission_status === 'not_submitted' || a.submission_status === 'late')).length,
            submitted: publishedAssignments.filter(a => a.submission_status === 'submitted').length,
            graded: publishedAssignments.filter(a => a.submission_status === 'graded').length
        };
        
        return stats;
    }

    getAchievements() {
        const gradeStats = this.calculateGradeStats();
        const assignmentStats = this.calculateAssignmentStats();
        const achievements = [];

        // Grade-based achievements
        if (gradeStats.a_plus > 0) {
            achievements.push({
                icon: 'fas fa-crown',
                title: 'Straight A+ Student',
                description: `You have ${gradeStats.a_plus} A+ grades!`,
                color: 'bg-yellow-500',
                progress: Math.min(100, (gradeStats.a_plus / Math.max(1, gradeStats.total)) * 100)
            });
        }

        if (gradeStats.average_percentage >= 90) {
            achievements.push({
                icon: 'fas fa-star',
                title: 'Academic Excellence',
                description: `Average: ${gradeStats.average_percentage.toFixed(1)}%`,
                color: 'bg-green-500',
                progress: 100
            });
        }

        if (gradeStats.total >= 5) {
            achievements.push({
                icon: 'fas fa-graduation-cap',
                title: 'Dedicated Learner',
                description: `${gradeStats.total} grades recorded`,
                color: 'bg-blue-500',
                progress: Math.min(100, (gradeStats.total / 10) * 100)
            });
        }

        // Assignment-based achievements
        if (assignmentStats.graded > 0) {
            achievements.push({
                icon: 'fas fa-check-circle',
                title: 'Assignment Master',
                description: `${assignmentStats.graded} assignments graded`,
                color: 'bg-purple-500',
                progress: Math.min(100, (assignmentStats.graded / Math.max(1, assignmentStats.total)) * 100)
            });
        }

        if (assignmentStats.pending === 0 && assignmentStats.total > 0) {
            achievements.push({
                icon: 'fas fa-rocket',
                title: 'On-Time Champion',
                description: 'All assignments submitted on time!',
                color: 'bg-green-500',
                progress: 100
            });
        }

        return achievements;
    }

    getLevelAndXP() {
        const gradeStats = this.calculateGradeStats();
        const assignmentStats = this.calculateAssignmentStats();
        
        // Calculate XP based on grades and assignments
        let xp = 0;
        xp += (gradeStats.a_plus * 100); // A+ = 100 XP
        xp += (gradeStats.a * 80);       // A = 80 XP
        xp += (gradeStats.b_plus * 60);  // B+ = 60 XP
        xp += (gradeStats.b * 50);       // B = 50 XP
        xp += (gradeStats.c_plus * 30);  // C+ = 30 XP
        xp += (gradeStats.c * 20);       // C = 20 XP
        xp += (assignmentStats.graded * 10); // Each graded assignment = 10 XP
        xp += (assignmentStats.submitted * 5); // Each submitted assignment = 5 XP
        
        // Calculate level (every 500 XP = 1 level)
        const level = Math.floor(xp / 500) + 1;
        const xpForNextLevel = level * 500;
        const currentLevelXP = xp % 500;
        const progressToNextLevel = (currentLevelXP / 500) * 100;
        
        return {
            level,
            xp,
            xpForNextLevel,
            currentLevelXP,
            progressToNextLevel
        };
    }

    render() {
        const loading = this.get('loading');
        const currentUser = this.get('currentUser');
        const classData = this.get('classData');
        const userName = currentUser?.name || 'Student';
        const classInfo = classData?.class || {};
        const gradeStats = this.calculateGradeStats();
        const assignmentStats = this.calculateAssignmentStats();
        const achievements = this.getAchievements();
        const levelData = this.getLevelAndXP();

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
                    
                    ${loading ? `
                        <!-- Class Information Skeleton -->
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg h-14 w-full border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-12 bg-white bg-opacity-30 rounded-lg mr-4 flex-shrink-0 animate-pulse"></div>
                                <div class="min-w-0 flex-1">
                                    <div class="h-6 bg-white bg-opacity-30 rounded mb-2 animate-pulse"></div>
                                    <div class="h-4 bg-white bg-opacity-30 rounded w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ` : classInfo.name ? `
                        <!-- Class Information -->
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg h-14 w-full border border-white border-opacity-20">
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
                    ` : ''}
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
                    <!-- Gamification Section -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Level & XP Card -->
                        <div class="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-500">
                            <div class="flex items-center mb-4">
                                <div class="p-3 rounded-full bg-yellow-100 text-yellow-600 size-10 min-w-10 flex items-center justify-center">
                                    <i class="fas fa-trophy text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Student Level</p>
                                    <p class="text-2xl font-bold text-gray-900">Level ${levelData.level}</p>
                                </div>
                            </div>
                            <div class="mb-4">
                                <div class="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>XP Progress</span>
                                    <span>${levelData.currentLevelXP} / 500 XP</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-yellow-500 h-2 rounded-full" style="width: ${levelData.progressToNextLevel}%"></div>
                                </div>
                            </div>
                            <div class="text-sm text-gray-600">
                                <i class="fas fa-star mr-1"></i>
                                Total XP: ${levelData.xp}
                            </div>
                        </div>

                        <!-- Academic Performance Card -->
                        <div class="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
                            <div class="flex items-center mb-4">
                                <div class="p-3 rounded-full bg-green-100 text-green-600 size-10 min-w-10 flex items-center justify-center">
                                    <i class="fas fa-chart-line text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Academic Performance</p>
                                    <p class="text-2xl font-bold text-gray-900">${gradeStats.average_percentage.toFixed(1)}%</p>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">A Grades</span>
                                    <span class="font-medium text-green-600">${gradeStats.a_plus + gradeStats.a}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">B Grades</span>
                                    <span class="font-medium text-blue-600">${gradeStats.b_plus + gradeStats.b}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">C Grades</span>
                                    <span class="font-medium text-yellow-600">${gradeStats.c_plus + gradeStats.c}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Assignment Progress Card -->
                        <div class="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                            <div class="flex items-center mb-4">
                                <div class="p-3 rounded-full bg-blue-100 text-blue-600 size-10 min-w-10 flex items-center justify-center">
                                    <i class="fas fa-tasks text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Assignment Progress</p>
                                    <p class="text-2xl font-bold text-gray-900">${assignmentStats.graded}/${assignmentStats.total}</p>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Pending</span>
                                    <span class="font-medium text-orange-600">${assignmentStats.pending}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Submitted</span>
                                    <span class="font-medium text-blue-600">${assignmentStats.submitted}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Graded</span>
                                    <span class="font-medium text-purple-600">${assignmentStats.graded}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Achievements Section -->
                    ${achievements.length > 0 ? `
                        <div class="bg-white shadow rounded-lg p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                <i class="fas fa-medal mr-2 text-yellow-500"></i>
                                Your Achievements
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${achievements.map(achievement => `
                                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                                        <div class="flex items-center mb-3">
                                            <div class="w-10 h-10 ${achievement.color} rounded-lg flex items-center justify-center mr-3">
                                                <i class="${achievement.icon} text-white"></i>
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-gray-900">${achievement.title}</h4>
                                                <p class="text-sm text-gray-600">${achievement.description}</p>
                                            </div>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="${achievement.color.replace('bg-', 'bg-')} h-2 rounded-full" style="width: ${achievement.progress}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

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