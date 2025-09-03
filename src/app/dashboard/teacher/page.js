import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';

/**
 * Teacher Dashboard Page Component (/dashboard/teacher)
 * 
 * Enhanced teacher dashboard with gradient header and summary cards (no gamification).
 */
class TeacherDashboardPage extends App {
  constructor() {
    super();
    this.set('loading', true);
    this.set('currentUser', null);
    this.set('teacherClass', null);
    this.set('assignments', []);
    this.set('grades', []);
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = 'Teacher Dashboard | School System';
    this.loadAll();
    this.addEventListener('click', this.handleHeaderActions.bind(this));
  }

  handleHeaderActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');
    if (action === 'show-teacher-dashboard-info') {
      this.showTeacherDashboardInfo();
    }
  }

  showTeacherDashboardInfo() {
    const dialog = document.createElement('ui-dialog');
    dialog.setAttribute('open', '');
    dialog.innerHTML = `
      <div slot="header" class="flex items-center">
        <i class="fas fa-chalkboard-teacher text-blue-500 mr-2"></i>
        <span class="font-semibold">About Teacher Dashboard</span>
      </div>
      <div slot="content" class="space-y-4">
        <p class="text-gray-700">Overview of your class assignment, assignments you created, and quick actions.</p>
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between"><span class="text-sm font-medium">Class Card</span><span class="text-sm text-gray-600">Shows your assigned class and student count</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Summary Cards</span><span class="text-sm text-gray-600">Published/Draft/Archived assignment counts</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Quick Actions</span><span class="text-sm text-gray-600">Navigate to class, assignments, and grades</span></div>
        </div>
      </div>
      <div slot="footer" class="flex justify-end">
        <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  async loadAll() {
    try {
      this.set('loading', true);
      const token = localStorage.getItem('token');
      if (!token) {
        this.set('loading', false);
        return;
      }

      // Resolve current user using profile endpoint like Profile page
      let userId = null;
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        try { userId = JSON.parse(storedUser)?.id || null; } catch (_) { userId = null; }
      }
      if (userId) {
        const profileResp = await api.withToken(token).get(`/users/${userId}/profile`).catch(() => null);
        if (profileResp?.data) {
          this.set('currentUser', profileResp.data);
        } else if (storedUser) {
          try { this.set('currentUser', JSON.parse(storedUser)); } catch (_) {}
        }
      }

      // Fetch teacher class
      const classResp = await api.withToken(token).get('/teachers/my-class').catch(() => ({ data: null }));
      if (classResp?.data?.success) this.set('teacherClass', classResp.data.data);

      // Assignments
      const assignmentsResp = await api.withToken(token).get('/teachers/my-class-assignments').catch(() => ({ data: { data: [] } }));
      this.set('assignments', assignmentsResp?.data?.data || []);

      // Grades (teacher-scoped)
      const gradesResp = await api.withToken(token).get('/teacher/student-grades').catch(() => ({ data: { data: [] } }));
      this.set('grades', gradesResp?.data?.data || []);
    } finally {
      this.set('loading', false);
      this.render();
    }
  }

  calculateAssignmentStats() {
    const list = this.get('assignments') || [];
    return {
      total: list.length,
      published: list.filter(a => a.status === 'published' && !a.deleted_at).length,
      draft: list.filter(a => a.status === 'draft' && !a.deleted_at).length,
      archived: list.filter(a => a.status === 'archived' && !a.deleted_at).length,
    };
  }

  getGradeCounts() {
    const grades = this.get('grades') || [];
    const counts = { total: grades.length, a_plus: 0, a: 0, b_plus: 0, b: 0, c_plus: 0, c: 0, d: 0, f: 0 };
    grades.forEach(g => {
      const L = (g.final_letter_grade || '').toUpperCase();
      if (L === 'A+') counts.a_plus++; else if (L === 'A') counts.a++;
      else if (L === 'B+') counts.b_plus++; else if (L === 'B') counts.b++;
      else if (L === 'C+') counts.c_plus++; else if (L === 'C') counts.c++;
      else if (L === 'D') counts.d++; else if (L === 'F') counts.f++;
    });
    return counts;
  }

  render() {
    const loading = this.get('loading');
    const user = this.get('currentUser');
    const teacherClass = this.get('teacherClass');
    const assignments = this.calculateAssignmentStats();

    const teacherName = (user && (
      user.name ||
      user.full_name ||
      (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
      user.username ||
      user.email ||
      user.displayName
    )) || null;
    const className = teacherClass?.class_name || teacherClass?.name || '';
    const classSection = teacherClass?.class_section || teacherClass?.section || '';
    const students = Array.isArray(teacherClass?.students) ? teacherClass.students : [];

    return `
      <div class="space-y-8">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">Teacher Dashboard</h1>
                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-teacher-dashboard-info" title="About Teacher Dashboard">
                  <i class="fas fa-question-circle text-lg"></i>
                </button>
              </div>
              <p class="text-blue-100 text-base sm:text-lg"></p>
                Welcome back, ${(loading || !teacherName) ? '<span class="inline-block h-4 bg-white/30 rounded animate-pulse w-32"></span>' : teacherName}.
              </p>
              <p class="text-blue-100 text-sm mt-1">
                <i class="fas fa-calendar-alt mr-1"></i>
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
          </div>

          ${loading ? `
            <ui-skeleton class="h-14 w-full"></ui-skeleton>
          ` : ((className || classSection) ? `
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-12 flex items-center justify-center bg-blue-500 rounded-lg mr-4 flex-shrink-0">
                  <i class="fas fa-chalkboard-teacher text-white text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-lg font-semibold">${className} ${classSection}</div>
                  <div class="text-blue-100 text-sm">Students: ${students.length}</div>
                </div>
              </div>
            </div>
          ` : '')}

          <!-- Summary Cards -->
          ${loading ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-users text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${students.length}</div>
                    <div class="text-blue-100 text-xs sm:text-sm">Students</div>
                  </div>
                </div>
              </div>

              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-tasks text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${assignments.published}</div>
                    <div class="text-blue-100 text-xs sm:text-sm">Published Assignments</div>
                  </div>
                </div>
              </div>

              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-amber-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-edit text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${assignments.draft}</div>
                    <div class="text-blue-100 text-xs sm:text-sm">Draft Assignments</div>
                  </div>
                </div>
              </div>

              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-archive text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${assignments.archived}</div>
                    <div class="text-blue-100 text-xs sm:text-sm">Archived Assignments</div>
                  </div>
                </div>
              </div>
            </div>
          `}
        </div>

        <!-- Quick Actions -->
        ${loading ? `
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
            </div>
          </div>
        ` : `
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/dashboard/teacher/class" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-chalkboard text-xl mb-2 block"></i>
                <div class="font-medium">My Class</div>
                <div class="text-xs opacity-90">View students & subjects</div>
              </a>
              <a href="/dashboard/teacher/assignments" class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-tasks text-xl mb-2 block"></i>
                <div class="font-medium">My Assignments</div>
                <div class="text-xs opacity-90">Create & manage</div>
              </a>
              <a href="/dashboard/teacher/student-grades" class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-chart-line text-xl mb-2 block"></i>
                <div class="font-medium">My Class Grades</div>
                <div class="text-xs opacity-90">View & update</div>
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

customElements.define('app-teacher-dashboard-page', TeacherDashboardPage);
export default TeacherDashboardPage; 