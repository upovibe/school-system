import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';

class TeacherInfoContent extends App {
  constructor() {
    super();
    this.teacherData = null;
    this.isLoading = true;
    this.error = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadTeacherInfo();
  }

  async loadTeacherInfo() {
    try {
      this.set('isLoading', true);
      this.set('error', null);

      const token = localStorage.getItem('token');
      if (!token) {
        this.set('error', 'Authentication required. Please log in again.');
        return;
      }

      const stored = localStorage.getItem('userData');
      let userId = null;
      if (stored) {
        try { userId = JSON.parse(stored)?.id || null; } catch (_) { userId = null; }
      }

      let identity = null;
      if (userId) {
        const resp = await api.withToken(token).get(`/users/${userId}/profile`).catch(() => null);
        identity = resp?.data || null;
      }

      const myClassResp = await api.withToken(token).get('/teachers/my-class').catch(() => ({ data: null }));
      const myClass = myClassResp?.data?.data || null;

      this.set('teacherData', {
        name: identity?.name || identity?.full_name || identity?.username || identity?.email || 'Unknown',
        email: identity?.email || 'N/A',
        status: identity?.status || 'active',
        department: identity?.department || identity?.role || 'N/A',
        specialization: identity?.specialization || identity?.subject_specialization || 'N/A',
        class_name: myClass?.class_name || myClass?.name || null,
        class_section: myClass?.class_section || myClass?.section || null,
        academic_year: myClass?.academic_year || null,
        students: Array.isArray(myClass?.students) ? myClass.students.length : (myClass?.student_count || 0),
      });
    } catch (error) {
      console.error('Error loading teacher info:', error);
      this.set('error', 'Failed to load teacher information. Please try again.');
    } finally {
      this.set('isLoading', false);
    }
  }

  render() {
    const loading = this.get('isLoading');
    const error = this.get('error');
    const t = this.get('teacherData');

    if (loading) {
      return `
        <div class="space-y-6">
          <div class="bg-white shadow rounded-lg p-6 animate-pulse">
            <div class="h-6 bg-gray-200 w-1/3 rounded mb-4"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="h-4 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      `;
    }

    if (error) {
      return `
        <div class="space-y-6">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <div class="flex-shrink-0"><i class="fas fa-exclamation-triangle text-red-400"></i></div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error</h3>
                <div class="mt-2 text-sm text-red-700"><p>${error}</p></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (!t) {
      return `
        <div class="space-y-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex">
              <div class="flex-shrink-0"><i class="fas fa-exclamation-triangle text-yellow-400"></i></div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">No Teacher Information</h3>
                <div class="mt-2 text-sm text-yellow-700"><p>No teacher information found for your account.</p></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="space-y-6">
        <!-- Teacher Header -->
        <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <i class="fas fa-chalkboard-teacher text-2xl"></i>
              </div>
              <div>
                <h2 class="text-2xl font-bold">Teacher Profile</h2>
                <p class="text-indigo-100">Your teaching information and class details</p>
              </div>
            </div>
            <div class="text-right">
              <ui-badge variant="${t.status === 'active' ? 'success' : 'warning'}" class="text-sm">
                <i class="fas fa-circle mr-1"></i>${t.status}
              </ui-badge>
              ${t.class_name ? `<p class="text-indigo-100 text-sm mt-1">Class: ${t.class_name}-${t.class_section}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Teacher Details -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
            <div class="flex items-center space-x-3">
              <i class="fas fa-user-tie text-white text-xl"></i>
              <h3 class="text-lg font-semibold text-white">Teacher Details</h3>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 uppercase">Full Name</p>
                <p class="font-semibold text-gray-900">${t.name}</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 uppercase">Email</p>
                <p class="font-semibold text-gray-900">${t.email}</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 uppercase">Department/Role</p>
                <p class="font-semibold text-gray-900">${t.department}</p>
              </div>
            </div>
            <div class="space-y-4">
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 uppercase">Specialization</p>
                <p class="font-semibold text-gray-900">${t.specialization}</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 uppercase">Assigned Class</p>
                <p class="font-semibold text-gray-900">${t.class_name ? `${t.class_name}-${t.class_section}` : 'N/A'}</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 uppercase">Students</p>
                <p class="font-semibold text-gray-900">${t.students || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('teacher-info-content', TeacherInfoContent);
export default TeacherInfoContent;


