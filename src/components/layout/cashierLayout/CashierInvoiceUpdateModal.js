import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class CashierInvoiceUpdateModal extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
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

  setInvoiceData(invoice) {
    this._invoice = invoice;
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this._listenersAttached) return;
    this.addEventListener('confirm', () => this.updateInvoice());
    this.addEventListener('cancel', () => this.close());
    
    // Auto-calculate balance when amount_due or amount_paid changes
    const rebindBalance = () => {
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      const amountPaidInput = this.querySelector('ui-input[data-field="amount_paid"]');
      const balanceInput = this.querySelector('ui-input[data-field="balance"]');
      
      const calculateBalance = () => {
        if (balanceInput) {
          const due = parseFloat(amountDueInput?.value || 0);
          const paid = parseFloat(amountPaidInput?.value || 0);
          const balance = due - paid;
          balanceInput.value = balance.toFixed(2);
        }
      };

      if (amountDueInput && !amountDueInput._balanceBound) {
        amountDueInput.addEventListener('input', calculateBalance);
        amountDueInput.addEventListener('change', calculateBalance);
        amountDueInput._balanceBound = true;
      }
      if (amountPaidInput && !amountPaidInput._balanceBound) {
        amountPaidInput.addEventListener('input', calculateBalance);
        amountPaidInput.addEventListener('change', calculateBalance);
        amountPaidInput._balanceBound = true;
      }
    };
    setTimeout(rebindBalance, 0);
    
    this._listenersAttached = true;
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async updateInvoice() {
    if (this._saving || !this._invoice) return;
    this._saving = true;
    
    try {
      const amountDueInput = this.querySelector('ui-input[data-field="amount_due"]');
      const amountPaidInput = this.querySelector('ui-input[data-field="amount_paid"]');
      const issueDateInput = this.querySelector('ui-input[data-field="issue_date"]');
      const dueDateInput = this.querySelector('ui-input[data-field="due_date"]');
      const notesInput = this.querySelector('ui-input[data-field="notes"]');

      const payload = {
        amount_due: amountDueInput?.value ? Number(amountDueInput.value) : 0,
        amount_paid: amountPaidInput?.value ? Number(amountPaidInput.value) : 0,
        issue_date: issueDateInput?.value || undefined,
        due_date: dueDateInput?.value || undefined,
        notes: notesInput?.value || undefined,
      };

      if (!payload.amount_due || isNaN(payload.amount_due)) {
        return Toast.show({ title: 'Validation', message: 'Enter valid amount due', variant: 'error', duration: 3000 });
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });
      }

      const resp = await api.withToken(token)
        .put(`/cashier/invoices/${this._invoice.id}`, payload);
      
      if (resp.status === 200 || resp.data?.success) {
        Toast.show({ title: 'Success', message: 'Invoice updated', variant: 'success', duration: 2500 });
        
        const updatedInvoice = {
          ...this._invoice,
          ...payload,
          balance: (payload.amount_due - (payload.amount_paid || 0)),
          status: payload.amount_due - (payload.amount_paid || 0) <= 0 ? 'paid' : 'open',
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };
        
        this.close();
        this.dispatchEvent(new CustomEvent('invoice-updated', { 
          detail: { invoice: updatedInvoice }, 
          bubbles: true, 
          composed: true 
        }));
      } else {
        throw new Error(resp.data?.message || 'Failed to update invoice');
      }
    } catch (error) {
      Toast.show({ 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to update invoice', 
        variant: 'error', 
        duration: 3000 
      });
    } finally {
      this._saving = false;
    }
  }

  render() {
    if (!this._invoice) return '';

    const students = this._students || [];
    const studentOptions = students.map(s => {
      const name = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || s.username || s.email || `Student #${s.id}`;
      const selected = String(s.id) === String(this._invoice.student_id) ? 'selected' : '';
      return `<ui-option value="${s.id}" ${selected}>${name}</ui-option>`;
    }).join('');

    const invoice = this._invoice;
    const balance = (parseFloat(invoice.amount_due || 0) - parseFloat(invoice.amount_paid || 0)).toFixed(2);

    return `
      <ui-modal title="Update Fee Invoice" size="lg">
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <ui-search-dropdown name="student_id" placeholder="Select student" class="w-full" value="${invoice.student_id || ''}" readonly>
                ${studentOptions}
              </ui-search-dropdown>
              <div class="text-xs text-gray-500 mt-1">Student cannot be changed</div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <ui-input data-field="invoice_number" value="${invoice.invoice_number || ''}" class="w-full" readonly></ui-input>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <ui-input data-field="academic_year" value="${invoice.academic_year || ''}" class="w-full" readonly></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <ui-input data-field="term" value="${invoice.term || ''}" class="w-full" readonly></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Student Type</label>
              <ui-input data-field="student_type" value="${invoice.student_type || ''}" class="w-full" readonly></ui-input>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Due *</label>
              <ui-input data-field="amount_due" type="number" step="0.01" value="${invoice.amount_due || 0}" class="w-full" required></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
              <ui-input data-field="amount_paid" type="number" step="0.01" value="${invoice.amount_paid || 0}" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Balance</label>
              <ui-input data-field="balance" type="number" step="0.01" value="${balance}" class="w-full" readonly></ui-input>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <ui-input data-field="issue_date" type="date" value="${invoice.issue_date || ''}" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <ui-input data-field="due_date" type="date" value="${invoice.due_date || ''}" class="w-full"></ui-input>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <ui-input data-field="notes" value="${invoice.notes || ''}" placeholder="Additional notes..." class="w-full"></ui-input>
          </div>

          <div class="bg-gray-50 p-3 rounded-md">
            <div class="text-sm text-gray-600">
              <div><strong>Status:</strong> <span class="capitalize">${invoice.status || 'open'}</span></div>
              <div><strong>Created:</strong> ${invoice.created_at || 'N/A'}</div>
              <div><strong>Last Updated:</strong> ${invoice.updated_at || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div slot="footer" class="flex justify-end gap-2">
          <ui-button data-action="cancel" variant="secondary">Cancel</ui-button>
          <ui-button data-action="confirm" variant="primary" loading="${this._saving}">
            ${this._saving ? 'Updating...' : 'Update Invoice'}
          </ui-button>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('cashier-invoice-update-modal', CashierInvoiceUpdateModal);
export default CashierInvoiceUpdateModal;
