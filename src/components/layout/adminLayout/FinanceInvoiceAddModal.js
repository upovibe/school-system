import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
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
    this.addEventListener('confirm', () => this.saveInvoice());
    this.addEventListener('cancel', () => this.close());
    // Auto-fill amount_due when student/year/term changes (debounced)
    const rebindAuto = () => {
      const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const trigger = () => this.autoFillAmountDueDebounced();
      if (studentDd && !studentDd._autoBound) {
        studentDd.addEventListener('change', trigger);
        studentDd._autoBound = true;
      }
      if (yearInput && !yearInput._autoBound) {
        yearInput.addEventListener('input', trigger);
        yearInput.addEventListener('change', trigger);
        yearInput._autoBound = true;
      }
      if (termInput && !termInput._autoBound) {
        termInput.addEventListener('input', trigger);
        termInput.addEventListener('change', trigger);
        termInput._autoBound = true;
      }
    };
    setTimeout(rebindAuto, 0);
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

      const payload = {
        student_id: studentDropdown ? Number(studentDropdown.value) : null,
        academic_year: yearInput?.value || '',
        term: termInput?.value || '',
        amount_due: amountDueInput?.value ? Number(amountDueInput.value) : 0,
        amount_paid: amountPaidInput?.value ? Number(amountPaidInput.value) : 0,
        issue_date: issueDateInput?.value || undefined,
        due_date: dueDateInput?.value || undefined,
        notes: notesInput?.value || undefined,
      };

      if (!payload.student_id) return Toast.show({ title: 'Validation', message: 'Select a student', variant: 'error', duration: 3000 });
      if (!payload.academic_year) return Toast.show({ title: 'Validation', message: 'Enter academic year', variant: 'error', duration: 3000 });
      if (!payload.term) return Toast.show({ title: 'Validation', message: 'Enter term', variant: 'error', duration: 3000 });
      if (!payload.amount_due || isNaN(payload.amount_due)) return Toast.show({ title: 'Validation', message: 'Enter amount due', variant: 'error', duration: 3000 });

      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });

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
      if (current > 0) return;

      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const studentId = studentDropdown?.value ? Number(studentDropdown.value) : null;
      const academicYear = yearInput?.value || '';
      const term = termInput?.value || '';
      if (!studentId || !academicYear || !term) return;

      let classId = null;
      const fromList = (this._students || []).find(s => String(s.id) === String(studentId));
      if (fromList && fromList.current_class_id) {
        classId = fromList.current_class_id;
      }
      if (!classId) {
        const token = localStorage.getItem('token');
        if (!token) return;
        // Fallback: fetch the student to get current_class_id
        const resp = await api.withToken(token).get(`/students/${studentId}`);
        classId = resp?.data?.data?.current_class_id || null;
      }
      if (!classId) return;

      // Fetch schedule by composite to derive total_fee
      const token = localStorage.getItem('token');
      if (!token) return;
      const qs = new URLSearchParams({ class_id: String(classId), academic_year: academicYear, term: term }).toString();
      const schedResp = await api.withToken(token).get(`/finance/schedules?${qs}`);
      const schedules = schedResp?.data?.data || [];
      if (schedules.length > 0 && schedules[0].total_fee != null) {
        amountDueInput.value = String(schedules[0].total_fee);
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <ui-search-dropdown name="student_id" placeholder="Select student" class="w-full">
              ${(this._students || []).map(s => {
                const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || s.username || s.email || `Student #${s.id}`;
                return `<ui-option value="${s.id}">${name}</ui-option>`;
              }).join('')}
            </ui-search-dropdown>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <ui-input data-field="academic_year" type="text" placeholder="e.g., 2024-2025" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <ui-input data-field="term" type="text" placeholder="e.g., Term 1" class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Due</label>
              <ui-input data-field="amount_due" type="number" step="0.01" placeholder="e.g., 1500.00" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Paid (optional)</label>
              <ui-input data-field="amount_paid" type="number" step="0.01" placeholder="0.00" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <ui-input data-field="issue_date" type="date" class="w-full"></ui-input>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <ui-input data-field="due_date" type="date" class="w-full"></ui-input>
            </div>
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
      </ui-modal>
    `;
  }
}

customElements.define('finance-invoice-add-modal', FinanceInvoiceAddModal);
export default FinanceInvoiceAddModal;



