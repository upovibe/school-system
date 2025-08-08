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
    this.filters = { subject_id: '', grading_period_id: '', student_id: '' };
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

  connectedCallback() {
    super.connectedCallback();
    document.title = 'My Class Grades | School System';
    this.bootstrap();

    this.addEventListener('table-view', this.onView.bind(this));
    this.addEventListener('table-edit', this.onEdit.bind(this));
    this.addEventListener('table-delete', this.onDelete.bind(this));
    this.addEventListener('table-add', this.onAdd.bind(this));

    this.addEventListener('modal-close', () => this.closeAllModals());
    this.addEventListener('modal-closed', () => this.closeAllModals());

    this.addEventListener('student-grade-deleted', (event) => {
      const deletedId = event.detail.gradeId;
      const current = this.get('grades') || [];
      this.set('grades', current.filter(g => g.id !== deletedId));
      this.updateTableData();
      this.set('showDeleteDialog', false);
    });

    this.addEventListener('student-grade-saved', (event) => {
      const newItem = event.detail.grade;
      if (newItem) {
        const current = this.get('grades') || [];
        this.set('grades', [newItem, ...current]);
        this.updateTableData();
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
        this.updateTableData();
        this.set('showUpdateModal', false);
      } else {
        this.loadGrades();
      }
    });

    // Filter changes
    this.addEventListener('change', (e) => {
      const dd = e.target.closest('ui-search-dropdown');
      if (!dd) return;
      this.closeAllModals();
      const name = dd.getAttribute('name');
      if (!name) return;
      const next = { ...this.get('filters'), [name]: dd.value };
      this.set('filters', next);
      this.loadGrades();
    });

    // Apply / Clear
    this.addEventListener('click', (e) => {
      const applyBtn = e.target.closest('[data-action="apply-filters"]');
      if (applyBtn) { e.preventDefault(); this.closeAllModals(); this.loadGrades(); return; }
      const clearBtn = e.target.closest('[data-action="clear-filters"]');
      if (clearBtn) {
        e.preventDefault();
        this.closeAllModals();
        const defaults = { subject_id: '', grading_period_id: '', student_id: '' };
        this.set('filters', defaults);
        this.set('grades', []);
        this.updateTableData();
        this.render();
      }
    });
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

      // Grading periods (teacher-friendly endpoint)
      try {
        const periodsResp = await api.withToken(token).get('/teachers/grading-periods');
        this.periods = periodsResp.data?.data || [];
      } catch (_) { this.periods = []; }

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
      if (!token) { return; }
      if (!this.teacherClass?.class_id) {
        this.set('grades', []);
        this.updateTableData();
        this.set('loading', false);
        return;
      }

      const { subject_id, grading_period_id, student_id } = this.get('filters');
      const params = { class_id: this.teacherClass.class_id };
      if (student_id) params.student_id = student_id;
      if (subject_id) params.subject_id = subject_id;
      if (grading_period_id) params.grading_period_id = grading_period_id;

      const response = await api.withToken(token).get('/teacher/student-grades', params);
      this.set('grades', response.data?.data || []);
      this.updateTableData();
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
        const filters = { subject_id: this.filters.subject_id, grading_period_id: this.filters.grading_period_id, student_id: this.filters.student_id, class_id: this.teacherClass?.class_id };
        modal.setFilterPrefill(filters, { subjects: this.subjects, periods: this.periods, classes: [{ id: this.teacherClass?.class_id, name: this.teacherClass?.class_name, section: this.teacherClass?.class_section }], students: this.students });
        modal.open?.();
      }
    }, 0);
  }

  updateTableData() {
    const grades = this.get('grades') || [];
    const tableData = grades.map((g, index) => ({
      id: g.id,
      index: index + 1,
      student: ([g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || g.student_number || ''),
      class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
      subject: g.subject_name || g.subject_code || '',
      period: g.grading_period_name || '',
      assign_total: this.formatNumber(g.assignment_total),
      exam_total: this.formatNumber(g.exam_total),
      final_pct: this.formatNumber(g.final_percentage),
      final_grade: g.final_letter_grade,
      updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : ''
    }));

    const tableComponent = this.querySelector('ui-table');
    if (tableComponent) {
      tableComponent.setAttribute('data', JSON.stringify(tableData));
    }
  }

  renderFilters() {
    const subjectOptions = (this.subjects || []).map(s => `<ui-option value="${s.id}">${s.name}</ui-option>`).join('');
    const periodOptions = (this.periods || []).map(p => `<ui-option value="${p.id}">${p.name}</ui-option>`).join('');
    const studentOptions = (this.students || []).map(s => `<ui-option value="${s.id}">${s.first_name} ${s.last_name} (${s.student_id})</ui-option>`).join('');

    const filters = this.get('filters') || { subject_id: '', grading_period_id: '', student_id: '' };
    const { subject_id, grading_period_id, student_id } = filters;
    return `
      <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Subject</label>
            <ui-search-dropdown name="subject_id" placeholder="All subjects" class="w-full" value="${subject_id || ''}">
              ${subjectOptions}
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Grading Period</label>
            <ui-search-dropdown name="grading_period_id" placeholder="All periods" class="w-full" value="${grading_period_id || ''}">
              ${periodOptions}
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Student</label>
            <ui-search-dropdown name="student_id" placeholder="All students (optional)" class="w-full" value="${student_id || ''}">
              ${studentOptions}
            </ui-search-dropdown>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-3">
          <ui-button type="button" data-action="apply-filters" variant="primary" size="sm">
            <i class="fas fa-filter mr-1"></i> Apply Filters
          </ui-button>
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

    const tableData = (grades || []).map((g, index) => ({
      id: g.id,
      index: index + 1,
      student: ([g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || g.student_number || ''),
      class: g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '',
      subject: g.subject_name || '',
      period: g.grading_period_name || '',
      assign_total: this.formatNumber(g.assignment_total),
      exam_total: this.formatNumber(g.exam_total),
      final_pct: this.formatNumber(g.final_percentage),
      final_grade: g.final_letter_grade,
      updated: g.updated_at ? new Date(g.updated_at).toLocaleDateString() : ''
    }));

    const tableColumns = [
      { key: 'index', label: 'No.' },
      { key: 'student', label: 'Student' },
      { key: 'class', label: 'Class' },
      { key: 'subject', label: 'Subject' },
      { key: 'period', label: 'Period' },
      { key: 'assign_total', label: 'Assign. Total' },
      { key: 'exam_total', label: 'Exam Total' },
      { key: 'final_pct', label: 'Final %' },
      { key: 'final_grade', label: 'Letter' },
      { key: 'updated', label: 'Updated' }
    ];

    const canAdd = Boolean(this.teacherClass?.class_id && this.filters.subject_id && this.filters.grading_period_id && this.filters.student_id);

    return `
      ${this.renderFilters()}
      <div class="bg-white rounded-lg shadow-lg p-4">
        ${loading ? `
          <div class="space-y-4">
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
          </div>
        ` : `
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
              ${canAdd ? 'addable' : ''}
              refresh
              print
              bordered
              striped
              class="w-full">
            </ui-table>
          </div>
        `}
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
