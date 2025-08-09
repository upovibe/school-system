import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class FinanceInvoiceUpdateModal extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
    this._students = [];
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
    this.fillForm();
  }

  setInvoiceData(invoice) {
    this._invoice = invoice || null;
    this.fillForm();
  }

  fillForm() {
    const inv = this._invoice;
    if (!inv) return;
    const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
    const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
    const termInput = this.querySelector('ui-input[data-field="term"]');
    const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
    const amountPaidInput = this.querySelector('ui-input[data-field="amount_paid"]');
    const issueDateInput = this.querySelector('ui-input[data-field="issue_date"]');
    const dueDateInput = this.querySelector('ui-input[data-field="due_date"]');
    const notesInput = this.querySelector('ui-input[data-field="notes"]');
    if (studentDropdown && inv.student_id != null) studentDropdown.value = String(inv.student_id);
    if (yearInput) yearInput.value = inv.academic_year || '';
    if (termInput) termInput.value = inv.term || '';
    if (amountDueInput) amountDueInput.value = inv.amount_due;
    if (amountPaidInput) amountPaidInput.value = inv.amount_paid;
    if (issueDateInput) issueDateInput.value = inv.issue_date || '';
    if (dueDateInput) dueDateInput.value = inv.due_date || '';
    if (notesInput) notesInput.value = inv.notes || '';
  }

  setupEventListeners() {
    this.addEventListener('confirm', () => this.updateInvoice());
    this.addEventListener('cancel', () => this.close());
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async updateInvoice() {
    try {
      if (!this._invoice) return;
      const studentDropdown = this.querySelector('ui-search-dropdown[name="student_id"]');
      const yearInput = this.querySelector('ui-input[data-field="academic_year"]');
      const termInput = this.querySelector('ui-input[data-field="term"]');
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      const amountPaidInput = this.querySelector('ui-input[data-field="amount_paid"]');
      const issueDateInput = this.querySelector('ui-input[data-field="issue_date"]');
      const dueDateInput = this.querySelector('ui-input[data-field="due_date"]');
      const notesInput = this.querySelector('ui-input[data-field="notes"]');

      const payload = {
        student_id: studentDropdown?.value ? Number(studentDropdown.value) : undefined,
        academic_year: yearInput?.value || '',
        term: termInput?.value || '',
        amount_due: amountDueInput?.value ? Number(amountDueInput.value) : 0,
        amount_paid: amountPaidInput?.value ? Number(amountPaidInput.value) : 0,
        issue_date: issueDateInput?.value || undefined,
        due_date: dueDateInput?.value || undefined,
        notes: notesInput?.value || undefined,
      };

      if (!payload.academic_year) return Toast.show({ title: 'Validation', message: 'Enter academic year', variant: 'error', duration: 3000 });
      if (!payload.term) return Toast.show({ title: 'Validation', message: 'Enter term', variant: 'error', duration: 3000 });
      if (!payload.amount_due || isNaN(payload.amount_due)) return Toast.show({ title: 'Validation', message: 'Enter amount due', variant: 'error', duration: 3000 });

      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });

      const resp = await api.withToken(token).put(`/finance/invoices/${this._invoice.id}`, payload);
      if (resp.status === 200 || resp.data?.success) {
        Toast.show({ title: 'Success', message: 'Invoice updated', variant: 'success', duration: 2500 });
        this.close();
        const amountDue = payload.amount_due;
        const amountPaid = payload.amount_paid;
        const updated = {
          ...this._invoice,
          ...payload,
          balance: (amountDue - (amountPaid || 0)),
          status: (amountDue - (amountPaid || 0)) <= 0 ? 'paid' : 'open',
          updated_at: new Date().toISOString().slice(0,19).replace('T',' ')
        };
        this.dispatchEvent(new CustomEvent('invoice-updated', { detail: { invoice: updated }, bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to update invoice');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update invoice', variant: 'error', duration: 3000 });
    }
  }

  render() {
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">Update Fee Invoice</div>
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
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
                <li>Changing amounts will recompute <strong>balance</strong> and <strong>status</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      </ui-modal>
    `;
    setTimeout(() => this.fillForm(), 0);
  }
}

customElements.define('finance-invoice-update-modal', FinanceInvoiceUpdateModal);
export default FinanceInvoiceUpdateModal;



