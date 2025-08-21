import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Button.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/layout/teacherLayout/TeacherStudentGradeAddModal.js';
import '@/components/layout/teacherLayout/TeacherStudentGradeUpdateModal.js';
import '@/components/layout/teacherLayout/TeacherStudentGradeViewModal.js';
import '@/components/layout/teacherLayout/TeacherStudentGradeDeleteDialog.js';
import '@/components/layout/teacherLayout/DataSkeleton.js';
import api from '@/services/api.js';

/**
 * Teacher Student Grades Management Page
 * - Teachers do not select class; it is locked to their assigned class
 * - Filters: Subject, Grading Period, Student (within teacher's class)
 */
class TeacherStudentGradesPage extends App {
  constructor() {
    super();
    this.grades = [];
    this.loading = false;
    this.teacherClass = null;
    this.subjects = [];
    this.periods = [];
    this.students = [];

    this.showAddModal = false;
    this.showUpdateModal = false;
    this.showViewModal = false;
    this.showDeleteDialog = false;
    this.updateGradeData = null;
    this.viewGradeData = null;
    this.deleteGradeData = null;
  }

  formatNumber(value) {
    if (value === null || value === undefined || value === '') return '—';
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toFixed(2);
  }

  formatPercentage(value) {
    if (value === null || value === undefined || value === '') return '—';
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toFixed(2) + '%';
  }

  // Compute basic grade counts for header summary
  getGradeCounts() {
    const grades = this.get('grades') || [];
    const counts = {
      total: grades.length,
      a_plus: 0,
      a: 0,
      b_plus: 0,
      b: 0,
      c_plus: 0,
      c: 0,
      d: 0,
      f: 0,
    };

    grades.forEach((g) => {
      const letter = (g.final_letter_grade || '').toUpperCase();
      if (letter === 'A+') counts.a_plus += 1;
      else if (letter === 'A') counts.a += 1;
      else if (letter === 'B+') counts.b_plus += 1;
      else if (letter === 'B') counts.b += 1;
      else if (letter === 'C+') counts.c_plus += 1;
      else if (letter === 'C') counts.c += 1;
      else if (letter === 'D') counts.d += 1;
      else if (letter === 'F') counts.f += 1;
    });

    return counts;
  }

  // Header section matching student grades header styling
  renderHeader() {
    const counts = this.getGradeCounts();
    return `
      <div class="space-y-8">
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">My Class Grades</h1>
                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-teacher-grades-info" title="About My Class Grades">
                  <i class="fas fa-question-circle text-lg"></i>
                </button>
              </div>
              <p class="text-blue-100 text-base sm:text-lg">Track and manage your class academic performance</p>
            </div>
            <div class="mt-4 sm:mt-0">
              <div class="text-right">
                <div class="text-xl sm:text-2xl font-bold">${counts.total}</div>
                <div class="text-blue-100 text-xs sm:text-sm">Total Grades</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-star text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${counts.a_plus + counts.a}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">A Grades</div>
                </div>
              </div>
            </div>

            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-star-half-alt text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${counts.b_plus + counts.b}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">B Grades</div>
                </div>
              </div>
            </div>

            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-circle text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${counts.c_plus + counts.c}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">C Grades</div>
                </div>
              </div>
            </div>

            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-red-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-exclamation-triangle text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${counts.d + counts.f}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">D/F Grades</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = 'My Class Grades | School System';
    this.addEventListener('click', this.handleHeaderActions.bind(this));
    
    // Initialize state
    this.set('filters', { subject_id: '', grading_period_id: '', student_id: '' });
    this.set('grades', []);
    this.set('loading', false);
    
    this.bootstrap();

    this.addEventListener('table-view', this.onView.bind(this));
    this.addEventListener('table-edit', this.onEdit.bind(this));
    this.addEventListener('table-delete', this.onDelete.bind(this));
    this.addEventListener('table-add', this.onAdd.bind(this));
    this.addEventListener('table-custom-action', this.onCustomAction.bind(this));

    this.addEventListener('modal-close', () => this.closeAllModals());
    this.addEventListener('modal-closed', () => this.closeAllModals());

    this.addEventListener('student-grade-deleted', (event) => {
      const deletedId = event.detail.gradeId;
      const current = this.get('grades') || [];
      this.set('grades', current.filter(g => g.id !== deletedId));
      this.render();
      this.set('showDeleteDialog', false);
    });

    this.addEventListener('student-grade-saved', (event) => {
      const newItem = event.detail.grade;
      if (newItem) {
        const current = this.get('grades') || [];
        this.set('grades', [newItem, ...current]);
        this.render();
        this.set('showAddModal', false);
      } else {
        this.loadGrades();
      }
    });

    this.addEventListener('student-grade-updated', (event) => {
      const updated = event.detail.grade;
      if (updated) {
        const current = this.get('grades') || [];
        const mapped = current.map(g => g.id === updated.id ? updated : g);
        this.set('grades', mapped);
        this.render();
        this.set('showUpdateModal', false);
      } else {
        this.loadGrades();
      }
    });

    // Filter changes - auto-load when both subject and period are selected
    this.addEventListener('change', (e) => {
      const dd = e.target.closest('ui-search-dropdown');
      if (!dd) return;
      this.closeAllModals();
      const name = dd.getAttribute('name');
      if (!name) return;
      const next = { ...this.get('filters'), [name]: dd.value };
      this.set('filters', next);
      
      // Auto-load grades when both filters are selected
      if (next.subject_id && next.grading_period_id) {
        this.loadGrades();
      } else {
        // Clear grades if either filter is missing
        this.set('grades', []);
        this.render();
      }
    });

    // Clear filters
    this.addEventListener('click', (e) => {
      const clearBtn = e.target.closest('[data-action="clear-filters"]');
      if (clearBtn) {
        e.preventDefault();
        this.closeAllModals();
        const defaults = { subject_id: '', grading_period_id: '' };
        this.set('filters', defaults);
        this.set('grades', []);
        this.render();
      }
    });
  }

  handleHeaderActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');
    if (action === 'show-teacher-grades-info') {
      this.showTeacherGradesInfo();
    }
  }

  showTeacherGradesInfo() {
    const dialog = document.createElement('ui-dialog');
    dialog.setAttribute('open', '');
    dialog.innerHTML = `
      <div slot="header" class="flex items-center">
        <i class="fas fa-chart-line text-blue-500 mr-2"></i>
        <span class="font-semibold">About My Class Grades</span>
      </div>
      <div slot="content" class="space-y-4">
        <p class="text-gray-700">Record and review grades for your class. Select a subject and grading period to view all students. Grades load automatically when both filters are selected.</p>
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between"><span class="text-sm font-medium">Subject</span><span class="text-sm text-gray-600">Select one of your subjects</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Grading Period</span><span class="text-sm text-gray-600">Choose the term/period</span></div>
        </div>
      </div>
      <div slot="footer" class="flex justify-end">
        <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  getCustomActions() {
    return [
      {
        name: 'add-grade',
        label: 'Add',
        icon: 'fas fa-plus',
        variant: 'primary',
        size: 'sm',
        showField: 'can_add'
      },
      {
        name: 'edit-grade',
        label: 'Edit',
        icon: 'fas fa-edit',
        variant: 'secondary',
        size: 'sm',
        showField: 'can_edit'
      }
    ];
  }

  async bootstrap() {
    try {
      this.set('loading', true);
      const token = localStorage.getItem('token');
      if (!token) {
        Toast.show({ title: 'Authentication Error', message: 'Please log in to view data', variant: 'error', duration: 3000 });
        return;
      }

      // Get teacher class + students
      const myClassResp = await api.withToken(token).get('/teachers/my-class');
      if (!myClassResp.data?.success || !myClassResp.data?.data) {
        this.teacherClass = null;
        this.students = [];
        return;
      }
      this.teacherClass = myClassResp.data.data; // contains class_id, students, etc.
      this.students = this.teacherClass.students || [];

      // Subjects for this class (from teacher scoped endpoint)
      const subjectsFromMyClass = Array.isArray(this.teacherClass.subjects) ? this.teacherClass.subjects : [];
      this.subjects = subjectsFromMyClass;

      // Grading periods (teacher-friendly endpoint) - FETCH FIRST
      try {
        const periodsResp = await api.withToken(token).get('/teachers/grading-periods');
        this.periods = periodsResp.data?.data || [];
      } catch (e) { 
        this.periods = []; 
      }

      // Default subject: pick the first subject assigned to the class if none selected
      const existingFilters = this.get('filters') || { subject_id: '', grading_period_id: '', student_id: '' };
      if (!existingFilters.subject_id && this.subjects && this.subjects.length > 0) {
        this.set('filters', { ...existingFilters, subject_id: String(this.subjects[0].id) });
      }

      // Default: preselect the first existing grading period - NOW THIS WILL WORK
      if (!existingFilters.grading_period_id && (this.periods || []).length > 0) {
        const firstPeriodId = String(this.periods[0].id);
        const next = { ...this.get('filters'), grading_period_id: firstPeriodId };
        this.set('filters', next);
      }

      // Initial load if we have class
      if (this.teacherClass?.class_id) {
        await this.loadGrades();
      }
    } catch (e) {
      Toast.show({ title: 'Error', message: e.response?.data?.message || 'Failed to load data', variant: 'error', duration: 3000 });
    } finally {
      this.set('loading', false);
    }
  }

  async loadGrades() {
    try {
      this.set('loading', true);
      const token = localStorage.getItem('token');
      if (!token) { 
        return; 
      }
      if (!this.teacherClass?.class_id) {
        this.set('grades', []);
        this.render();
        this.set('loading', false);
        return;
      }

      const filters = this.get('filters') || { subject_id: '', grading_period_id: '' };
      const { subject_id, grading_period_id } = filters;
      // Require both subject and grading period selection for teacher view
      if (!subject_id || !grading_period_id) {
        this.set('grades', []);
        this.render();
        this.set('loading', false);
        return;
      }

      // Fetch existing grades for teacher's class
      const params = { subject_id };
      if (grading_period_id) params.grading_period_id = grading_period_id;
      const response = await api.withToken(token).get('/teacher/student-grades', params);
      const existing = response.data?.data || [];

      // Merge with class roster to show placeholders for not-yet-graded
      const selectedSubject = (this.subjects || []).find(s => String(s.id) === String(subject_id));
      const selectedPeriod = (this.periods || []).find(p => String(p.id) === String(grading_period_id));
      const byStudent = new Map(existing.map(g => [String(g.student_id), { ...g, is_new: false }]));
      const merged = (this.students || []).map(stu => {
        const key = String(stu.id);
        if (byStudent.has(key)) return byStudent.get(key);
        return {
          id: null,
          student_id: stu.id,
          student_first_name: stu.first_name,
          student_last_name: stu.last_name,
          student_number: stu.student_id,
          class_id: this.teacherClass.class_id,
          class_name: this.teacherClass.class_name || '',
          class_section: this.teacherClass.class_section || '',
          subject_id: subject_id,
          subject_name: selectedSubject?.name || '',
          grading_period_id: grading_period_id || '',
          grading_period_name: selectedPeriod?.name || '',
          assignment_total: null,
          exam_total: null,
          final_percentage: null,
          final_letter_grade: null,
          is_new: true,
          created_at: null,
          updated_at: null
        };
      });

      this.set('grades', merged);
      this.render();
      this.set('loading', false);
    } catch (error) {
      this.set('loading', false);
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load grades', variant: 'error', duration: 3000 });
    }
  }

  onView(event) {
    const { detail } = event;
    const item = (this.get('grades') || []).find(g => g.id === detail.row.id);
    if (item) {
      this.closeAllModals();
      this.set('viewGradeData', item);
      this.set('showViewModal', true);
      setTimeout(() => {
        const modal = this.querySelector('teacher-student-grade-view-modal');
        if (modal) { modal.setGradeData(item); modal.open?.(); }
      }, 0);
    }
  }

  onEdit(event) {
    const { detail } = event;
    const item = (this.get('grades') || []).find(g => g.id === detail.row.id);
    if (item) {
      this.closeAllModals();
      this.set('updateGradeData', item);
      this.set('showUpdateModal', true);
      setTimeout(() => {
        const modal = this.querySelector('teacher-student-grade-update-modal');
        if (modal) { modal.setGradeData(item); modal.open?.(); }
      }, 0);
    }
  }

  onDelete(event) {
    const { detail } = event;
    const item = (this.get('grades') || []).find(g => g.id === detail.row.id);
    if (item) {
      this.closeAllModals();
      this.set('deleteGradeData', item);
      this.set('showDeleteDialog', true);
      setTimeout(() => {
        const dialog = this.querySelector('teacher-student-grade-delete-dialog');
        if (dialog) { dialog.setGradeData(item); dialog.open?.(); }
      }, 0);
    }
  }

  onAdd() {
    this.closeAllModals();
    this.set('showAddModal', true);
    setTimeout(() => {
      const modal = this.querySelector('teacher-student-grade-add-modal');
      if (modal) {
        const filters = this.get('filters') || { subject_id: '', grading_period_id: '' };
        const filterData = { subject_id: filters.subject_id, grading_period_id: filters.grading_period_id, class_id: this.teacherClass?.class_id };
        modal.setFilterPrefill(filterData, { subjects: this.subjects, periods: this.periods, classes: [{ id: this.teacherClass?.class_id, name: this.teacherClass?.class_name, section: this.teacherClass?.class_section }], students: this.students });
        modal.open?.();
      }
    }, 0);
  }

  onCustomAction(event) {
    const { actionName, action, row } = event.detail;
    const act = actionName || action;
    if (act === 'add-grade') {
      const gradeData = this.get('grades')?.find(g => g.student_id === row.student_id);
      if (gradeData) {
        this.closeAllModals();
        this.set('showAddModal', true);
        setTimeout(() => {
          const modal = this.querySelector('teacher-student-grade-add-modal');
          if (modal) {
            const filters = this.get('filters') || {};
            const filterData = { subject_id: filters.subject_id, grading_period_id: filters.grading_period_id, class_id: this.teacherClass?.class_id };
            modal.setFilterPrefill(filterData, { subjects: this.subjects, periods: this.periods, classes: [{ id: this.teacherClass?.class_id, name: this.teacherClass?.class_name, section: this.teacherClass?.class_section }], students: this.students });
            modal.open?.();
          }
        }, 0);
      }
    }
    if (act === 'edit-grade') {
      const existing = this.get('grades')?.find(g => g.student_id === row.student_id && !g.is_new);
      if (existing) {
        this.closeAllModals();
        this.set('updateGradeData', existing);
        this.set('showUpdateModal', true);
        setTimeout(() => {
          const modal = this.querySelector('teacher-student-grade-update-modal');
          if (modal) { modal.setGradeData(existing); modal.open?.(); }
        }, 0);
      }
    }
  }

  // removed updateTableData; table data is derived in render()

  renderFilters() {
    const subjectOptions = (this.subjects || []).map(s => `<ui-option value="${s.id}">${s.name}</ui-option>`).join('');
    const periodOptions = (this.periods || []).map(p => `<ui-option value="${p.id}">${p.name}</ui-option>`).join('');

    const filters = this.get('filters') || { subject_id: '', grading_period_id: '' };
    const { subject_id, grading_period_id } = filters;
    return `
      <div class="bg-gray-100 rounded-md p-3 border border-gray-300 my-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Subject</label>
            <ui-search-dropdown name="subject_id" placeholder="Select subject" class="w-full" value="${subject_id || ''}">
              ${subjectOptions}
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Grading Period</label>
            <ui-search-dropdown name="grading_period_id" placeholder="Select period" class="w-full" value="${grading_period_id || ''}">
              ${periodOptions}
            </ui-search-dropdown>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-3 ml-auto">
          <ui-button type="button" data-action="clear-filters" variant="secondary" size="sm">
            <i class="fas fa-times mr-1"></i> Clear Filters
          </ui-button>
        </div>
      </div>
    `;
  }

  render() {
    const grades = this.get('grades');
    const loading = this.get('loading');
    const showAddModal = this.get('showAddModal');
    const showUpdateModal = this.get('showUpdateModal');
    const showViewModal = this.get('showViewModal');
    const showDeleteDialog = this.get('showDeleteDialog');

    // Show skeleton loading during initial page load (check this FIRST)
    if (loading) {
      return `<data-skeleton></data-skeleton>`;
    }

    const filters = this.get('filters') || { subject_id: '', grading_period_id: '' };
    const periodSelected = Boolean(filters.grading_period_id && String(filters.grading_period_id).length > 0);
    const tableData = (grades || []).map((g, index) => {
      const hasGrades = g.assignment_total !== null || g.exam_total !== null;
      const canAdd = periodSelected && (g.is_new === true || !g.id) && !hasGrades;
      const canEdit = periodSelected ? (!g.is_new && hasGrades) : Boolean(g.id);
      return ({
        id: g.id || `new_${g.student_id}_${index}`,
        index: index + 1,
        student: ([g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || g.student_number || ''),
        class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
        subject: g.subject_name || g.subject_code || '',
        period: g.grading_period_name || '',
        assign_total: this.formatNumber(g.assignment_total),
        exam_total: this.formatNumber(g.exam_total),
        final_pct: this.formatPercentage(g.final_percentage),
        final_grade: g.final_letter_grade || (g.is_new ? 'Not Graded' : ''),
        updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : (g.is_new ? 'Pending' : ''),
        // Flags for custom actions
        student_id: g.student_id,
        is_new: g.is_new,
        has_grades: hasGrades,
        can_add: canAdd,
        can_edit: canEdit
      });
    });

    const tableColumns = [
      { key: 'index', label: 'No.' },
      { key: 'student', label: 'Student' },
      { key: 'class', label: 'Class' },
      { key: 'subject', label: 'Subject' },
      { key: 'period', label: 'Period' },
      { key: 'assign_total', label: 'Assignment Score Total' },
      { key: 'exam_total', label: 'Exam Score Total' },
      { key: 'final_pct', label: 'Final Total Score %' },
      { key: 'final_grade', label: 'Letter' },
      { key: 'updated', label: 'Updated' }
    ];

    const canAdd = Boolean(this.teacherClass?.class_id && filters.subject_id && filters.grading_period_id);

    return `
      ${this.renderHeader()}
      
      <!-- Filters Section -->
      <div class="mb-6">
        ${this.renderFilters()}
      </div>
      
      <!-- Table Section -->
      <div class="bg-white rounded-lg shadow-lg p-4">
        <div class="mb-8">
          <ui-table 
            title="My Class Student Grades"
            data='${JSON.stringify(tableData)}'
            columns='${JSON.stringify(tableColumns)}'
            sortable
            searchable
            search-placeholder="Search grades..."
            pagination
            page-size="50"
            action
            refresh
            print
            bordered
            striped
            custom-actions='${JSON.stringify(this.getCustomActions())}'
            class="w-full">
          </ui-table>
        </div>
      </div>

      <teacher-student-grade-add-modal ${showAddModal ? 'open' : ''}></teacher-student-grade-add-modal>
      <teacher-student-grade-update-modal ${showUpdateModal ? 'open' : ''}></teacher-student-grade-update-modal>
      <teacher-student-grade-view-modal ${showViewModal ? 'open' : ''}></teacher-student-grade-view-modal>
      <teacher-student-grade-delete-dialog ${showDeleteDialog ? 'open' : ''}></teacher-student-grade-delete-dialog>
    `;
  }

  closeAllModals() {
    this.set('showAddModal', false);
    this.set('showUpdateModal', false);
    this.set('showViewModal', false);
    this.set('showDeleteDialog', false);
    this.set('updateGradeData', null);
    this.set('viewGradeData', null);
    this.set('deleteGradeData', null);
  }
}

customElements.define('app-teacher-student-grades-page', TeacherStudentGradesPage);
export default TeacherStudentGradesPage;
