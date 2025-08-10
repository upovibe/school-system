import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class CashierInvoiceAddModal extends HTMLElement {
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
    this.addEventListener('confirm', () => this.saveInvoice());
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
        const dupResp = await api.withToken(token).get(`/cashier/invoices?${q}`);
        const list = dupResp?.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          this._saving = false;
          return Toast.show({ title: 'Duplicate', message: 'An invoice already exists for this student, year and term', variant: 'warning', duration: 3500 });
        }
      } catch (_) { /* ignore – backend unique index still protects */ }

      const resp = await api.withToken(token).post('/cashier/invoices', payload);
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
        if (!token) return;
        try {
          const resp = await api.withToken(token).get(`/students/${studentId}`);
          const student = resp?.data?.data;
          classId = student?.current_class_id || null;
        } catch (_) {
          return;
        }
      }
      if (!classId) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Try to find a fee schedule for this student/class/year/term
        const scheduleResp = await api.withToken(token).get(`/cashier/schedules`, {
          params: {
            student_id: studentId,
            class_id: classId,
            academic_year: academicYear,
            term: term,
            student_type: overrideType || undefined
          }
        });
        const schedules = scheduleResp?.data?.data || [];
        if (schedules.length > 0) {
          const schedule = schedules[0];
          const amount = parseFloat(schedule.amount || 0);
          if (amount > 0) {
            amountDueInput.value = amount.toFixed(2);
            Toast.show({ title: 'Auto-filled', message: `Amount due: ${amount.toFixed(2)} from fee schedule`, variant: 'info', duration: 2000 });
            return;
          }
        }
      } catch (_) {
        // Ignore errors - just means no schedule found
      }

      // If no schedule found, try to derive from class fee structure
      try {
        const classResp = await api.withToken(token).get(`/classes/${classId}`);
        const classInfo = classResp?.data?.data;
        if (classInfo && classInfo.fee_amount) {
          const amount = parseFloat(classInfo.fee_amount);
          if (amount > 0) {
            amountDueInput.value = amount.toFixed(2);
            Toast.show({ title: 'Auto-filled', message: `Amount due: ${amount.toFixed(2)} from class fee`, variant: 'info', duration: 2000 });
            return;
          }
        }
      } catch (_) {
        // Ignore errors
      }
    } catch (error) {
      console.error('Error auto-filling amount due:', error);
    }
  }

  render() {
    const students = this._students || [];
    const studentOptions = students.map(s => {
      const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || s.username || s.email || `Student #${s.id}`;
      return `<ui-option value="${s.id}">${name}</ui-option>`;
    }).join('');

    return `
      <ui-modal title="Create Fee Invoice" size="lg">
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <ui-search-dropdown name="student_id" placeholder="Select student" class="w-full" required>
                ${studentOptions}
              </ui-search-dropdown>
              <div id="current-class-info" class="text-xs text-gray-500 mt-1"></div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <ui-input data-field="invoice_number" placeholder="Auto-generated" class="w-full" readonly></ui-input>
              <div class="text-xs text-gray-500 mt-1">Will be auto-generated if left empty</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <ui-input data-field="academic_year" placeholder="e.g., 2024/2025" class="w-full" required></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Term *</label>
              <ui-input data-field="term" placeholder="e.g., Term 1" class="w-full" required></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Student Type</label>
              <ui-input data-field="student_type" placeholder="e.g., Day, Boarding" class="w-full"></ui-input>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Due *</label>
              <ui-input data-field="amount_due" type="number" step="0.01" placeholder="0.00" class="w-full" required></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
              <ui-input data-field="amount_paid" type="number" step="0.01" placeholder="0.00" class="w-full" value="0"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Balance</label>
              <ui-input data-field="balance" type="number" step="0.01" placeholder="0.00" class="w-full" readonly></ui-input>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <ui-input data-field="issue_date" type="date" class="w-full" value="${new Date().toISOString().slice(0, 10)}"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <ui-input data-field="due_date" type="date" class="w-full"></ui-input>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <ui-input data-field="notes" placeholder="Additional notes..." class="w-full"></ui-input>
          </div>
        </div>

        <div slot="footer" class="flex justify-end gap-2">
          <ui-button data-action="cancel" variant="secondary">Cancel</ui-button>
          <ui-button data-action="confirm" variant="primary" loading="${this._saving}">
            ${this._saving ? 'Creating...' : 'Create Invoice'}
          </ui-button>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('cashier-invoice-add-modal', CashierInvoiceAddModal);
export default CashierInvoiceAddModal;
