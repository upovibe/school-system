import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class TeacherStudentGradeAddModal extends HTMLElement {
  constructor() {
    super();
    this.prefill = { filters: {}, classes: [], subjects: [], periods: [], students: [] };
    this.policy = null;
  }

  static get observedAttributes() { return ['open']; }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open' && oldValue !== newValue) {
      const modal = this.querySelector('ui-modal');
      if (modal) {
        if (this.hasAttribute('open')) modal.setAttribute('open', '');
        else modal.removeAttribute('open');
      } else {
        this.render();
      }
    }
  }

  connectedCallback() { this.render(); this.setup(); }
  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); this.dispatchEvent(new CustomEvent('modal-closed', { bubbles: true, composed: true })); }

  setFilterPrefill(filters, lists) {
    this.prefill = { filters: filters || {}, classes: lists.classes || [], subjects: lists.subjects || [], periods: lists.periods || [], students: lists.students || [] };
    this.render();
    // Ensure read-only fields show names immediately
    this.updateDisplayFields();
    // Load grading policy if subject is present
    if (this.prefill.filters.subject_id) {
      this.loadPolicyForSubject(this.prefill.filters.subject_id);
    }
  }

  async loadPolicyForSubject(subjectId) {
    try {
      const token = localStorage.getItem('token');
      if (!token || !subjectId) return;
      const resp = await api.withToken(token).get('/grading-policies/by-subject', { subject_id: subjectId });
      this.policy = resp?.data?.data || null;
      this.applyMaxConstraints();
    } catch (_) { this.policy = null; this.applyMaxConstraints(); }
  }

  applyMaxConstraints() {
    const assignInput = this.querySelector('ui-input[data-field="assignment_total"]');
    const examInput = this.querySelector('ui-input[data-field="exam_total"]');
    const assignLabel = this.querySelector('[data-label="assignment"]');
    const examLabel = this.querySelector('[data-label="exam"]');
    const assignMax = this.policy?.assignment_max_score ?? null;
    const examMax = this.policy?.exam_max_score ?? null;
    if (assignInput) {
      if (assignMax != null) assignInput.setAttribute('max', String(assignMax)); else assignInput.removeAttribute('max');
      assignInput.setAttribute('min', '0');
      const val = Number(assignInput.value || 0);
      if (assignMax != null && val > assignMax) assignInput.value = String(assignMax);
      assignInput.addEventListener('input', () => {
        const v = Number(assignInput.value || 0);
        if (v < 0) assignInput.value = '0';
        if (assignMax != null && v > assignMax) assignInput.value = String(assignMax);
      });
    }
    if (examInput) {
      if (examMax != null) examInput.setAttribute('max', String(examMax)); else examInput.removeAttribute('max');
      examInput.setAttribute('min', '0');
      const val = Number(examInput.value || 0);
      if (examMax != null && val > examMax) examInput.value = String(examMax);
      examInput.addEventListener('input', () => {
        const v = Number(examInput.value || 0);
        if (v < 0) examInput.value = '0';
        if (examMax != null && v > examMax) examInput.value = String(examMax);
      });
    }
    if (assignLabel) assignLabel.textContent = `Assignment Total${assignMax != null ? ` (Max: ${assignMax})` : ' (No policy set)'}`;
    if (examLabel) examLabel.textContent = `Exam Total${examMax != null ? ` (Max: ${examMax})` : ' (No policy set)'}`;
  }

  setup() {
    this.addEventListener('confirm', () => this.save());
    this.addEventListener('cancel', () => this.close());
  }



  updateDisplayFields() {
    // Class display (read-only)
    const classInput = this.querySelector('ui-input[data-field="class_display"]');
    if (classInput) {
      const cls = (this.prefill.classes || [])[0];
      classInput.value = cls ? `${cls.name}${cls.section ? ' - ' + cls.section : ''}` : '';
    }
    // Student display
    const studentInput = this.querySelector('ui-input[data-field="student_display"]');
    if (studentInput) {
      const id = this.prefill?.filters?.student_id;
      const found = (this.prefill.students || []).find(s => String(s.id) === String(id));
      studentInput.value = found ? `${found.first_name} ${found.last_name} (${found.student_id})` : (id || '');
    }
    // Subject display
    const subjectInput = this.querySelector('ui-input[data-field="subject_display"]');
    if (subjectInput) {
      const id = this.prefill?.filters?.subject_id;
      const found = (this.prefill.subjects || []).find(s => String(s.id) === String(id));
      subjectInput.value = found ? `${found.name}` : (id || '');
    }
    // Period display
    const periodInput = this.querySelector('ui-input[data-field="period_display"]');
    if (periodInput) {
      const id = this.prefill?.filters?.grading_period_id;
      const found = (this.prefill.periods || []).find(p => String(p.id) === String(id));
      periodInput.value = found ? `${found.name}` : (id || '');
    }
  }

  async save() {
    try {
      const studentId = Number(this.prefill?.filters?.student_id || 0);
      const subjectId = Number(this.prefill?.filters?.subject_id || 0);
      const periodId = Number(this.prefill?.filters?.grading_period_id || 0);
      const classId = Number(this.prefill?.filters?.class_id || 0);
      const assignInput = this.querySelector('ui-input[data-field="assignment_total"]');
      const examInput = this.querySelector('ui-input[data-field="exam_total"]');
      const remarksTa = this.querySelector('ui-textarea[data-field="remarks"]');

      const assignVal = Number(assignInput?.value || 0);
      const examVal = Number(examInput?.value || 0);
      const assignMax = this.policy?.assignment_max_score ?? null;
      const examMax = this.policy?.exam_max_score ?? null;
      if (assignMax != null && assignVal > assignMax) {
        Toast.show({ title: 'Validation Error', message: `Assignment total cannot exceed ${assignMax}`, variant: 'error', duration: 3000 });
        return;
      }
      if (examMax != null && examVal > examMax) {
        Toast.show({ title: 'Validation Error', message: `Exam total cannot exceed ${examMax}`, variant: 'error', duration: 3000 });
        return;
      }

      const payload = {
        student_id: studentId,
        subject_id: subjectId,
        grading_period_id: periodId,
        assignment_total: assignVal,
        exam_total: examVal,
        remarks: remarksTa?.getValue() || ''
      };

      if (!payload.student_id || !classId || !payload.subject_id || !payload.grading_period_id) {
        Toast.show({ title: 'Validation Error', message: 'Please fill all required fields', variant: 'error', duration: 3000 });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) { Toast.show({ title: 'Authentication Error', message: 'Please log in', variant: 'error', duration: 3000 }); return; }

      const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
      if (confirmBtn) { confirmBtn.setAttribute('loading', ''); confirmBtn.textContent = 'Creating...'; }

      const resp = await api.withToken(token).post('/teacher/student-grades', payload);
      if (resp.data.success) {
        const id = resp.data?.data?.id;
        let full = null;
        try {
          const showResp = await api.withToken(token).get(`/student-grades/${id}`);
          full = showResp?.data?.data || null;
        } catch (_) { /* ignore */ }
        Toast.show({ title: 'Success', message: 'Grade created successfully', variant: 'success', duration: 3000 });
        const enriched = full || { id, ...payload, class_id: classId };
        this.dispatchEvent(new CustomEvent('student-grade-saved', { detail: { grade: enriched }, bubbles: true, composed: true }));
        this.close();
      } else {
        Toast.show({ title: 'Error', message: resp.data.message || 'Failed to create grade', variant: 'error', duration: 3000 });
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to create grade', variant: 'error', duration: 3000 });
    } finally {
      const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
      if (confirmBtn) { confirmBtn.removeAttribute('loading'); confirmBtn.textContent = 'Create Grade'; }
    }
  }

  render() {
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">Add Student Grade</div>
        <form class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <ui-input data-field="class_display" type="text" readonly disabled class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <ui-input data-field="student_display" type="text" readonly disabled class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <ui-input data-field="subject_display" type="text" readonly disabled class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Grading Period</label>
              <ui-input data-field="period_display" type="text" readonly disabled class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" data-label="assignment">Assignment Total</label>
              <ui-input data-field="assignment_total" type="number" min="0" placeholder="e.g., 35" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" data-label="exam">Exam Total</label>
              <ui-input data-field="exam_total" type="number" min="0" placeholder="e.g., 55" class="w-full"></ui-input>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <ui-textarea data-field="remarks" rows="3" placeholder="Optional remarks..." class="w-full"></ui-textarea>
          </div>
        </form>
        <ui-button slot="confirm" variant="primary">Create Grade</ui-button>
        <ui-button slot="cancel" variant="secondary">Cancel</ui-button>
      </ui-modal>
    `;
    setTimeout(() => {
      this.updateDisplayFields();
      if (this.prefill?.filters?.subject_id) this.loadPolicyForSubject(this.prefill.filters.subject_id);
      // Ensure labels reflect current policy
      this.applyMaxConstraints();
    }, 0);
  }
}

customElements.define('teacher-student-grade-add-modal', TeacherStudentGradeAddModal);
export default TeacherStudentGradeAddModal;


