import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';

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
        this.financeData = null;
        
        // Initialize state properly
        this.set('loading', true);
        this.set('currentUser', null);
        this.set('classData', null);
        this.set('gradesData', null);
        this.set('assignmentsData', null);
        this.set('financeData', null);
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Student Dashboard | School System';
        this.loadAll();
        // Add event listeners for help buttons
        this.addEventListener('click', this.handleButtonClick.bind(this));
        this.addEventListener('click', this.handleHeaderActions.bind(this));
    }

     handleButtonClick(event) {
         const button = event.target.closest('button[data-action]');
         if (!button) return;
         
         const action = button.getAttribute('data-action');
         
                 switch (action) {
            case 'show-level-info':
                this.showLevelInfo();
                break;
            case 'show-academic-info':
                this.showAcademicInfo();
                break;
            case 'show-finance-info':
                this.showFinanceInfo();
                break;
        }
    }

    async loadAll() {
        try {
            this.set('loading', true);
            const token = localStorage.getItem('token');
            if (!token) {
                this.set('loading', false);
                return;
            }

            const stored = localStorage.getItem('userData');
            let userId = null;
            if (stored) {
                try { userId = JSON.parse(stored)?.id || null; } catch (_) { userId = null; }
            }

            const requests = [];
            if (userId) {
                requests.push(api.withToken(token).get(`/users/${userId}/profile`).catch(() => null));
            } else {
                requests.push(Promise.resolve(null));
            }
            requests.push(api.withToken(token).get('/students/current-class').catch(() => null));
            requests.push(api.withToken(token).get('/student/my-grades').catch(() => ({ data: { data: [] } })));
            requests.push(api.withToken(token).get('/students/my-assignments').catch(() => ({ data: { data: [] } })));
            requests.push(api.withToken(token).get('/student/finance/summary').catch(() => ({ data: { data: null } })));

            const [userResp, classResp, gradesResp, assignmentsResp, financeResp] = await Promise.all(requests);

            if (userResp?.data) {
                this.set('currentUser', userResp.data);
            } else if (stored) {
                try { this.set('currentUser', JSON.parse(stored)); } catch (_) {}
            }

            if (classResp?.data?.success) {
                this.set('classData', classResp.data.data);
            } else {
                this.set('classData', null);
            }

            this.set('gradesData', gradesResp?.data?.data || []);
            this.set('assignmentsData', assignmentsResp?.data?.data || []);
            this.set('financeData', financeResp?.data?.data || null);
        } finally {
            this.set('loading', false);
        }
    }

    handleHeaderActions(event) {
        const btn = event.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        if (action === 'show-student-dashboard-info') {
            this.showStudentDashboardInfo();
        }
    }

    showStudentDashboardInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-user-graduate text-blue-500 mr-2"></i>
                <span class="font-semibold">About Student Dashboard</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">Overview of your class info, grades, assignments, achievements and level.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between"><span class="text-sm font-medium">Class Info</span><span class="text-sm text-gray-600">Your class, section, academic year</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Performance</span><span class="text-sm text-gray-600">Average grade and subject counts</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Assignments</span><span class="text-sm text-gray-600">Pending, submitted, graded</span></div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Align with profile page: get ID from localStorage and fetch profile
            const stored = localStorage.getItem('userData');
            let userId = null;
            if (stored) {
                try { userId = JSON.parse(stored)?.id || null; } catch (_) { userId = null; }
            }
            if (userId) {
                const resp = await api.withToken(token).get(`/users/${userId}/profile`).catch(() => null);
                if (resp?.data) {
                    this.set('currentUser', resp.data);
                } else if (stored) {
                    try { this.set('currentUser', JSON.parse(stored)); } catch (_) {}
                }
            }
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

    calculateFinanceStats() {
        const financeData = this.get('financeData');
        
        if (!financeData?.summary) {
            return {
                total_invoiced: 0,
                total_paid: 0,
                total_outstanding: 0,
                payment_rate: 0,
                total_invoices: 0,
                paid_invoices: 0,
                outstanding_invoices: 0
            };
        }

        const summary = financeData.summary;
        
        return {
            total_invoiced: summary.total_invoiced || 0,
            total_paid: summary.total_paid || 0,
            total_outstanding: summary.total_outstanding || 0,
            payment_rate: summary.total_invoiced > 0 ? 
                ((summary.total_paid / summary.total_invoiced) * 100) : 0,
            total_invoices: summary.total_invoices || 0,
            paid_invoices: summary.paid_invoices || 0,
            outstanding_invoices: summary.outstanding_invoices || 0
        };
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

     showLevelInfo() {
         const dialog = document.createElement('ui-dialog');
         dialog.setAttribute('open', '');
         dialog.innerHTML = `
             <div slot="header" class="flex items-center">
                 <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                 <span class="font-semibold">My Level System</span>
             </div>
             <div slot="content" class="space-y-4">
                 <div>
                     <h4 class="font-semibold text-gray-900 mb-2">How Your Level is Calculated</h4>
                     <p class="text-gray-600 mb-3">Your level is based on your academic performance and assignment completion. Here's how it works:</p>
                     
                     <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">A+ Grades:</span>
                             <span class="text-sm text-green-600">100 XP each</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">A Grades:</span>
                             <span class="text-sm text-green-600">80 XP each</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">B+ Grades:</span>
                             <span class="text-sm text-blue-600">60 XP each</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">B Grades:</span>
                             <span class="text-sm text-blue-600">50 XP each</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">C+ Grades:</span>
                             <span class="text-sm text-yellow-600">30 XP each</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">C Grades:</span>
                             <span class="text-sm text-yellow-600">20 XP each</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">Graded Assignments:</span>
                             <span class="text-sm text-purple-600">10 XP each</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">Submitted Assignments:</span>
                             <span class="text-sm text-blue-600">5 XP each</span>
                         </div>
                     </div>
                     
                     <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                         <p class="text-sm text-yellow-800">
                             <i class="fas fa-lightbulb mr-1"></i>
                             <strong>Level Up:</strong> Every 500 XP = 1 level increase
                         </p>
                     </div>
                 </div>
             </div>
             <div slot="footer" class="flex justify-end">
                 <ui-button variant="primary" onclick="this.closest('ui-dialog').close()">Got it!</ui-button>
             </div>
         `;
         document.body.appendChild(dialog);
     }

     showAcademicInfo() {
         const dialog = document.createElement('ui-dialog');
         dialog.setAttribute('open', '');
         dialog.innerHTML = `
             <div slot="header" class="flex items-center">
                 <i class="fas fa-chart-line text-green-500 mr-2"></i>
                 <span class="font-semibold">Academic Performance</span>
             </div>
             <div slot="content" class="space-y-4">
                 <div>
                     <h4 class="font-semibold text-gray-900 mb-2">How Your Performance is Calculated</h4>
                     <p class="text-gray-600 mb-3">Your academic performance is based on your grades across all subjects. Here's what each section means:</p>
                     
                     <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">Average Percentage:</span>
                             <span class="text-sm text-gray-600">Overall grade average</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">A Grades:</span>
                             <span class="text-sm text-green-600">A+ and A grades combined</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">B Grades:</span>
                             <span class="text-sm text-blue-600">B+ and B grades combined</span>
                         </div>
                         <div class="flex justify-between">
                             <span class="text-sm font-medium">C Grades:</span>
                             <span class="text-sm text-yellow-600">C+ and C grades combined</span>
                         </div>
                     </div>
                     
                     <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                         <p class="text-sm text-green-800">
                             <i class="fas fa-star mr-1"></i>
                             <strong>Tip:</strong> Focus on maintaining high grades to improve your overall performance score!
                         </p>
                     </div>
                 </div>
             </div>
             <div slot="footer" class="flex justify-end">
                 <ui-button variant="primary" onclick="this.closest('ui-dialog').close()">Got it!</ui-button>
             </div>
         `;
         document.body.appendChild(dialog);
    }

    showFinanceInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-credit-card text-emerald-500 mr-2"></i>
                <span class="font-semibold">Financial Status</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Understanding Your Financial Metrics</h4>
                    <p class="text-gray-600 mb-3">Your financial status shows your payment progress and outstanding balances. Here's what each metric means:</p>
                    
                    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div class="flex justify-between">
                            <span class="text-sm font-medium">Payment Rate:</span>
                            <span class="text-sm text-gray-600">Percentage of total fees paid</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm font-medium">Total Paid:</span>
                            <span class="text-sm text-green-600">Amount you've paid so far</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm font-medium">Outstanding:</span>
                            <span class="text-sm text-red-600">Amount still owed</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm font-medium">Paid Invoices:</span>
                            <span class="text-sm text-green-600">Number of fully paid invoices</span>
                        </div>
                    </div>
                    
                    <div class="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p class="text-sm text-emerald-800">
                            <i class="fas fa-lightbulb mr-1"></i>
                            <strong>Tip:</strong> Keep your payment rate high by paying invoices on time to maintain good financial standing!
                        </p>
                    </div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button variant="primary" onclick="this.closest('ui-dialog').close()">Got it!</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    render() {
        const loading = this.get('loading');
        const currentUser = this.get('currentUser');
        const classData = this.get('classData');
        const userName = (currentUser && (
            currentUser.name ||
            currentUser.full_name ||
            (currentUser.first_name && currentUser.last_name ? `${currentUser.first_name} ${currentUser.last_name}` : null) ||
            currentUser.username ||
            currentUser.email ||
            currentUser.displayName
        )) || null;
        const classInfo = classData?.class || {};
        const gradeStats = this.calculateGradeStats();
        const assignmentStats = this.calculateAssignmentStats();
        const financeStats = this.calculateFinanceStats();
        const achievements = this.getAchievements();
        const levelData = this.getLevelAndXP();

        return `
            <div class="space-y-8">
                <!-- Enhanced Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Student Dashboard</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-student-dashboard-info" title="About Student Dashboard">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-student-dashboard-page').loadAll()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">
                                Welcome back, ${(loading || !userName) ? '<span class="inline-block h-4 bg-white/30 rounded animate-pulse w-32"></span>' : userName}! Here's your academic overview.
                            </p>
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

                ${!loading ? `
                    <!-- Gamification Section -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
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
                                 <button class="ml-auto text-gray-400 hover:text-gray-600 transition-colors" data-action="show-level-info">
                                     <i class="fas fa-question-circle text-lg"></i>
                                 </button>
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
                                 <button class="ml-auto text-gray-400 hover:text-gray-600 transition-colors" data-action="show-academic-info">
                                     <i class="fas fa-question-circle text-lg"></i>
                                 </button>
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

                        <!-- Financial Status Card -->
                        <div class="bg-white shadow rounded-lg p-6 border-l-4 border-emerald-500">
                            <div class="flex items-center mb-4">
                                <div class="p-3 rounded-full bg-emerald-100 text-emerald-600 size-10 min-w-10 flex items-center justify-center">
                                    <i class="fas fa-credit-card text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Financial Status</p>
                                    <p class="text-2xl font-bold text-gray-900">${financeStats.payment_rate.toFixed(1)}%</p>
                                </div>
                                <button class="ml-auto text-gray-400 hover:text-gray-600 transition-colors" data-action="show-finance-info">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Total Paid</span>
                                    <span class="font-medium text-green-600">₵${financeStats.total_paid.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Outstanding</span>
                                    <span class="font-medium text-red-600">₵${financeStats.total_outstanding.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Paid Invoices</span>
                                    <span class="font-medium text-emerald-600">${financeStats.paid_invoices}/${financeStats.total_invoices}</span>
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
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                            <a href="/dashboard/student/finance" class="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                                <i class="fas fa-credit-card text-xl mb-2 block"></i>
                                <div class="font-medium">My Payments</div>
                                <div class="text-xs opacity-90">View fee records</div>
                            </a>
                            <a href="/dashboard/profile" class="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                                <i class="fas fa-user text-xl mb-2 block"></i>
                                <div class="font-medium">My Profile</div>
                                <div class="text-xs opacity-90">Update information</div>
                            </a>
                        </div>
                    </div>
                 ` : `
                    <div class="space-y-6">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                            <ui-skeleton class="h-40 w-full"></ui-skeleton>
                            <ui-skeleton class="h-40 w-full"></ui-skeleton>
                            <ui-skeleton class="h-40 w-full"></ui-skeleton>
                            <ui-skeleton class="h-40 w-full"></ui-skeleton>
                        </div>
                        <ui-skeleton class="h-64 w-full"></ui-skeleton>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <ui-skeleton class="h-28 w-full"></ui-skeleton>
                            <ui-skeleton class="h-28 w-full"></ui-skeleton>
                            <ui-skeleton class="h-28 w-full"></ui-skeleton>
                            <ui-skeleton class="h-28 w-full"></ui-skeleton>
                        </div>
                    </div>
                 `}
            </div>
        `;
    }
}

customElements.define('app-student-dashboard-page', StudentDashboardPage);
export default StudentDashboardPage; 