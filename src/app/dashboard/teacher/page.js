import App from '@/core/App.js';
import api from '@/services/api.js';

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
  }

  async loadAll() {
    try {
      this.set('loading', true);
      const token = localStorage.getItem('token');
      if (!token) {
        this.set('loading', false);
        return;
      }

      // Fetch in parallel
      const [meResp, classResp] = await Promise.all([
        api.withToken(token).get('/auth/me').catch(() => ({ data: null })),
        api.withToken(token).get('/teachers/my-class').catch(() => ({ data: null })),
      ]);

      if (meResp?.data) this.set('currentUser', meResp.data);
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
    const gradeCounts = this.getGradeCounts();

    const teacherName = user?.name || 'Teacher';
    const className = teacherClass?.class_name || teacherClass?.name || '';
    const classSection = teacherClass?.class_section || teacherClass?.section || '';
    const subjects = Array.isArray(teacherClass?.subjects) ? teacherClass.subjects : [];
    const students = Array.isArray(teacherClass?.students) ? teacherClass.students : [];

    return `
      <div class="space-y-8">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold">Teacher Dashboard</h1>
              <p class="text-blue-100 text-base sm:text-lg">Welcome back, ${teacherName}.</p>
              <p class="text-blue-100 text-sm mt-1">
                <i class="fas fa-calendar-alt mr-1"></i>
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div class="mt-4 sm:mt-0">
              <div class="text-right">
                <div class="text-xl sm:text-2xl font-bold">${subjects.length}</div>
                <div class="text-blue-100 text-xs sm:text-sm">Total Subjects</div>
              </div>
            </div>
          </div>

          ${!loading && (className || classSection) ? `
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
          ` : ''}

          <!-- Summary Cards -->
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
                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-chart-line text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${gradeCounts.total}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Total Grades</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('app-teacher-dashboard-page', TeacherDashboardPage);
export default TeacherDashboardPage; 