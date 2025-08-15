import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

class FinanceInvoiceAddModal extends HTMLElement {
  constructor() {
    super();
    this._students = [];
    this._saving = false;
    this._listenersAttached = false;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setStudents(students) {
    this._students = Array.isArray(students) ? students : [];
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this._listenersAttached) return;
    this.addEventListener('cancel', () => this.close());
    // Auto-fill amount_due when student/year/term changes (debounced)
    const rebindAuto = () => {
      const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const trigger = () => this.autoFillAmountDueDebounced();
      if (studentDd && !studentDd._autoBound) {
        studentDd.addEventListener('change', () => { trigger(); });
        studentDd.addEventListener('value-change', () => { trigger(); });
        studentDd._autoBound = true;
      }
      if (yearInput && !yearInput._autoBound) {
        yearInput.addEventListener('input', () => { trigger(); });
        yearInput.addEventListener('change', () => { trigger(); });
        yearInput._autoBound = true;
      }
      if (termInput && !termInput._autoBound) {
        termInput.addEventListener('input', () => { trigger(); });
        termInput.addEventListener('change', () => { trigger(); });
        termInput._autoBound = true;
      }
    };
    setTimeout(rebindAuto, 0);
    // Capture any change events from the student dropdown to ensure logging triggers
    if (!this._captureBound) {
      this.addEventListener(
        'change',
        async (e) => {
          const dropdown = e.target && e.target.closest && e.target.closest('ui-search-dropdown[name="student_id"]');
          if (!dropdown) return;
          const val = dropdown.value || (e.detail && e.detail.value);
          const id = Number(val);
          if (!id) return;
          try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const resp = await api.withToken(token).get(`/students/${id}`).catch(() => null);
            const student = resp?.data?.data || null;
            const classId = student?.current_class_id || null;
            const infoEl = this.querySelector('#current-class-info');
            // Show student type badge and clear dependent fields
            const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
            const yearInput2 = this.querySelector('ui-input[data-field="academic_year"]');
            const termInput2 = this.querySelector('ui-input[data-field="term"]');
            const missBadge = this.querySelector('#schedule-missing');
            if (amountDueInput) amountDueInput.value = '';
            if (yearInput2) yearInput2.value = '';
            if (termInput2) termInput2.value = '';
            if (missBadge) missBadge.remove();
            this.autoFillAmountDueDebounced();
            if (classId) {
              const cls = await api.withToken(token).get(`/classes/${classId}`).catch(() => null);
              const info = cls?.data?.data;
              if (info && infoEl) {
                const label = `${info.name || 'Class'}${info.section ? ' ' + info.section : ''}`;
                const type = student?.student_type || '';
                infoEl.innerHTML = `Current Class: ${label}${type ? ` <span id=\"current-student-type\" class=\"ml-2 text-[11px] px-2 py-0.5 rounded bg-gray-200\" data-type=\"${type}\">${type}</span>` : ''}`;
              } else if (infoEl) {
                infoEl.textContent = `Current Class ID: ${classId}`;
              }
              // trigger amount-due fetch after class resolved
              this.autoFillAmountDueDebounced();
            } else if (infoEl) {
              infoEl.textContent = '';
            }
          } catch (_) {}
        },
        true
      );
      this._captureBound = true;
    }
    this._listenersAttached = true;
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async saveInvoice() {
    if (this._saving) return;
    this._saving = true;
    try {
      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      const amountPaidInput = this.querySelector('ui-input[data-field="amount_paid"]');
      const issueDateInput = this.querySelector('ui-input[data-field="issue_date"]');
      const dueDateInput = this.querySelector('ui-input[data-field="due_date"]');
      const notesInput = this.querySelector('ui-input[data-field="notes"]');
      const studentTypeEl = this.querySelector('#current-student-type');

      const payload = {
        student_id: studentDropdown ? Number(studentDropdown.value) : null,
        academic_year: yearInput?.value || '',
        term: termInput?.value || '',
        amount_due: amountDueInput?.value ? Number(amountDueInput.value) : 0,
        amount_paid: amountPaidInput?.value ? Number(amountPaidInput.value) : 0,
        issue_date: issueDateInput?.value || undefined,
        due_date: dueDateInput?.value || undefined,
        notes: notesInput?.value || undefined,
        student_type: (studentTypeEl?.dataset?.type) || undefined,
      };

      if (!payload.student_id) return Toast.show({ title: 'Validation', message: 'Select a student', variant: 'error', duration: 3000 });
      if (!payload.academic_year) return Toast.show({ title: 'Validation', message: 'Enter academic year', variant: 'error', duration: 3000 });
      if (!payload.term) return Toast.show({ title: 'Validation', message: 'Enter term', variant: 'error', duration: 3000 });
      if (!payload.amount_due || isNaN(payload.amount_due)) return Toast.show({ title: 'Validation', message: 'Enter amount due', variant: 'error', duration: 3000 });

      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });

      // Frontend duplicate check: one invoice per student/year/term
      try {
        const q = new URLSearchParams({ student_id: String(payload.student_id), academic_year: payload.academic_year, term: payload.term }).toString();
        const dupResp = await api.withToken(token).get(`/finance/invoices?${q}`);
        const list = dupResp?.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          this._saving = false;
          return Toast.show({ title: 'Duplicate', message: 'An invoice already exists for this student, year and term', variant: 'warning', duration: 3500 });
        }
      } catch (_) { /* ignore – backend unique index still protects */ }

      const resp = await api.withToken(token).post('/finance/invoices', payload);
      if (resp.status === 201 || resp.data?.success) {
        Toast.show({ title: 'Success', message: 'Invoice created', variant: 'success', duration: 2500 });
        const id = resp.data?.data?.id;
        const invoice = {
          id,
          invoice_number: resp.data?.data?.invoice_number,
          status: payload.amount_due - payload.amount_paid <= 0 ? 'paid' : 'open',
          balance: (payload.amount_due - (payload.amount_paid || 0)),
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          ...payload,
        };
        this.close();
        this.dispatchEvent(new CustomEvent('invoice-saved', { detail: { invoice }, bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to create invoice');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to create invoice', variant: 'error', duration: 3000 });
    } finally {
      this._saving = false;
    }
  }

  // Validate required fields and toggle Save button
  validateForm() {
    try {
      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      const saveBtn = this.querySelector('#save-invoice-btn');
      const allFilled = !!String(studentDropdown?.value || '').trim() &&
        !!String(yearInput?.value || '').trim() &&
        !!String(termInput?.value || '').trim() &&
        Number(amountDueInput?.value || 0) > 0;
      if (saveBtn) {
        if (allFilled) saveBtn.removeAttribute('disabled');
        else saveBtn.setAttribute('disabled', '');
      }
    } catch (_) { /* noop */ }
  }

  addFormEventListeners() {
    const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
    const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
    const termInput = this.querySelector('ui-input[data-field="term"]');
    const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
    const saveBtn = this.querySelector('#save-invoice-btn');
    if (studentDropdown) studentDropdown.addEventListener('change', () => this.validateForm());
    [yearInput, termInput, amountDueInput].forEach(el => {
      if (!el) return;
      el.addEventListener('input', () => this.validateForm());
      el.addEventListener('change', () => this.validateForm());
    });
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveInvoice());
    this.validateForm();
  }

  autoFillAmountDueDebounced() {
    clearTimeout(this._autoDueTimeout);
    this._autoDueTimeout = setTimeout(() => this.autoFillAmountDue(), 200);
  }

  async autoFillAmountDue() {
    try {
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      if (!amountDueInput) return;
      // Only auto-fill if empty or zero to avoid overriding manual edits
      const current = parseFloat(amountDueInput.value || '0');
      if (current > 0) { return; }

      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const studentId = studentDropdown?.value ? Number(studentDropdown.value) : null;
      const typeBadge = this.querySelector('#current-student-type');
      const overrideType = typeBadge?.dataset?.type || '';
      const academicYear = yearInput?.value || '';
      const term = termInput?.value || '';
      if (!studentId) { return; }

      let classId = null;
      const fromList = (this._students || []).find(s => String(s.id) === String(studentId));
      if (fromList && fromList.current_class_id) {
        classId = fromList.current_class_id;
      }
      if (!classId) {
        const token = localStorage.getItem('token');
        if (!token) { return; }
        // Fallback: fetch the student to get current_class_id
        const resp = await api.withToken(token).get(`/students/${studentId}`).catch(() => null);
        classId = resp?.data?.data?.current_class_id || null;
      }
      if (!classId) { return; }

      // Resolve and show current class inline (no logs)
      try {
        const token2 = localStorage.getItem('token');
        if (token2) {
          const cls = await api.withToken(token2).get(`/classes/${classId}`).catch(() => null);
          const info = cls?.data?.data;
          const infoEl = this.querySelector('#current-class-info');
          if (info && infoEl) {
            const label = `${info.name || 'Class'}${info.section ? ' ' + info.section : ''}`;
            const typeBadge = this.querySelector('#current-student-type');
            const type = typeBadge?.dataset?.type || '';
            infoEl.innerHTML = `Current Class: ${label}${type ? ` <span id="current-student-type" class="ml-2 text-[11px] px-2 py-0.5 rounded bg-gray-200" data-type="${type}">${type}</span>` : ''}`;
          }
        }
      } catch (_) {}

      // Simple backend computation endpoint
      const token = localStorage.getItem('token');
      if (!token) { return; }
      const qs = new URLSearchParams({ student_id: String(studentId) });
      if (academicYear) qs.append('academic_year', academicYear);
      if (term) qs.append('term', term);
      // no manual override; backend derives by student type

      const missBefore = this.querySelector('#schedule-missing');
      if (missBefore) missBefore.remove();

      try {
        const amtResp = await api.withToken(token).get(`/finance/amount-due?${qs.toString()}`);
        const amountDue = amtResp?.data?.data?.amount_due;
        const schedule = amtResp?.data?.data?.schedule || {};
        if (amountDue != null) {
          amountDueInput.value = String(amountDue);
          if (yearInput && !yearInput.value) yearInput.value = schedule.academic_year || '';
          if (termInput && !termInput.value) termInput.value = schedule.term || '';
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          amountDueInput.value = '';
          if (yearInput) yearInput.value = '';
          if (termInput) termInput.value = '';
          const typeBadge = this.querySelector('#current-student-type');
          const parent = typeBadge?.parentElement || this.querySelector('#current-class-info');
          const typeText = (typeBadge?.dataset?.type || 'type');
          if (parent) {
            const existed = this.querySelector('#schedule-missing');
            if (existed) existed.remove();
            parent.insertAdjacentHTML('beforeend', ` <span id="schedule-missing" class="ml-2 text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">No schedule for ${typeText}</span>`);
          }
        }
      }
    } catch (_) {
      // Silent fail; user can still enter manually
    }
  }

  render() {
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">Add Fee Invoice</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <ui-search-dropdown name="student_id" placeholder="Select student" class="w-full">
              ${(this._students || []).map(s => {
                const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || s.username || s.email || `Student #${s.id}`;
                return `<ui-option value="${s.id}">${name}</ui-option>`;
              }).join('')}
            </ui-search-dropdown>
            <div id="current-class-info" class="text-xs text-gray-500 mt-1"></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <ui-input data-field="academic_year" type="text" placeholder="e.g., 2024-2025" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Term *</label>
              <ui-input data-field="term" type="text" placeholder="e.g., Term 1" class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text sm font-medium text-gray-700 mb-1">Amount Due *</label>
              <ui-input data-field="amount_due" type="number" step="0.01" placeholder="e.g., 1500.00" class="w-full" readonly></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Paid (optional)</label>
              <ui-input data-field="amount_paid" type="number" step="0.01" placeholder="0.00" class="w-full"></ui-input>
            </div>           
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <ui-input data-field="issue_date" type="date" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <ui-input data-field="due_date" type="date" class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <ui-input data-field="notes" type="text" placeholder="Optional note" class="w-full"></ui-input>
            </div>
          </div>
        </form>

        <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <div class="flex items-start space-x-2">
            <i class="fas fa-info-circle mt-0.5"></i>
            <div>
              <p class="font-medium">How this works</p>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Student</strong>: select who the invoice is for.</li>
                <li><strong>Academic Year & Term</strong>: align to the billing period.</li>
                <li><strong>Amount Due/Paid</strong>: balance and status compute automatically.</li>
              </ul>
            </div>
          </div>
        </div>
        <div slot="footer" class="flex items-center justify-end gap-2">
          <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
          <ui-button id="save-invoice-btn" color="primary" disabled>Save</ui-button>
        </div>
      </ui-modal>
    `;
    // Attach validation/save wiring
    this.addFormEventListeners();
  }
}

customElements.define('finance-invoice-add-modal', FinanceInvoiceAddModal);
export default FinanceInvoiceAddModal;



