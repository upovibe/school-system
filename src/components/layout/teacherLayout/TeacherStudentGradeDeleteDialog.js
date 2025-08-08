import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class TeacherStudentGradeDeleteDialog extends HTMLElement {
  constructor() { super(); this.gradeData = null; }
  static get observedAttributes() { return ['open']; }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open' && oldValue !== newValue) {
      const dialog = this.querySelector('ui-dialog');
      if (dialog) {
        if (this.hasAttribute('open')) dialog.setAttribute('open', '');
        else dialog.removeAttribute('open');
      } else {
        this.render();
      }
    }
  }
  connectedCallback() { this.render(); this.setup(); }
  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }
  setGradeData(grade) { this.gradeData = grade; this.render(); }

  setup() { this.addEventListener('confirm', () => this.remove()); this.addEventListener('cancel', () => this.close()); }

  async remove() {
    try {
      if (!this.gradeData?.id) { return; }
      const token = localStorage.getItem('token');
      if (!token) { Toast.show({ title: 'Authentication Error', message: 'Please log in', variant: 'error', duration: 3000 }); return; }
      const dialog = this.querySelector('ui-dialog');
      if (dialog) dialog.setAttribute('variant', 'danger');
      const resp = await api.withToken(token).delete(`/teacher/student-grades/${this.gradeData.id}`);
      if (resp.data.success) {
        Toast.show({ title: 'Success', message: 'Grade deleted', variant: 'success', duration: 2000 });
        this.dispatchEvent(new CustomEvent('student-grade-deleted', { detail: { gradeId: this.gradeData.id }, bubbles: true, composed: true }));
        this.close();
      } else {
        Toast.show({ title: 'Error', message: resp.data.message || 'Failed to delete', variant: 'error', duration: 3000 });
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete', variant: 'error', duration: 3000 });
    }
  }

  render() {
    const g = this.gradeData || {};
    const studentName = [g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || '';
    const classLabel = g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '';
    const subjectName = g.subject_name || '';
    const periodName = g.grading_period_name || '';
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Delete Student Grade" variant="danger">
        <div slot="content">
          <div class="space-y-3">
            <p class="text-gray-700">Are you sure you want to delete this grade? This action cannot be undone.</p>
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <div><strong>Student:</strong> ${studentName || '—'}</div>
              <div><strong>Class:</strong> ${classLabel || '—'}</div>
              <div><strong>Subject:</strong> ${subjectName || '—'}</div>
              <div><strong>Grading Period:</strong> ${periodName || '—'}</div>
            </div>
          </div>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('teacher-student-grade-delete-dialog', TeacherStudentGradeDeleteDialog);
export default TeacherStudentGradeDeleteDialog;


