import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Button.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class CashierPaymentAddModal extends HTMLElement {
  constructor() {
    super();
    this._invoices = [];
    this._students = [];
    this._saving = false;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() { this.render(); this.setup(); }

  setData({ invoices = [], students = [] } = {}) {
    this._invoices = Array.isArray(invoices) ? invoices : [];
    this._students = Array.isArray(students) ? students : [];
    this.render();
    this.setup();
  }

  setup() {
    this.addEventListener('cancel', () => this.close());
    this.addEventListener('confirm', () => this.save());
    
    // Set current date as default and minimum for paid_on field
    setTimeout(() => {
      const dateInput = this.querySelector('ui-input[data-field="paid_on"]');
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('value', today);
        dateInput.setAttribute('min', today);
      }
    }, 0);

    const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
    if (invoiceDd && !invoiceDd._bound) {
      invoiceDd.addEventListener('change', () => this.updateInvoiceInfo());
      invoiceDd.addEventListener('value-change', () => this.updateInvoiceInfo());
      invoiceDd._bound = true;
    }
    setTimeout(() => this.updateInvoiceInfo(), 0);
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  invoiceDisplay(inv) {
    if (!inv) return '';
    const student = (this._students || []).find(s => String(s.id) === String(inv.student_id));
    const name = student ? (student.name || [student.first_name, student.last_name].filter(Boolean).join(' ') || student.full_name || student.username || student.email) : `Student #${inv.student_id}`;
    return `${inv.invoice_number || ('#' + inv.id)} — ${name}`;
  }

  updateInvoiceInfo() {
    const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
    const infoEl = this.querySelector('#invoice-info');
    if (!invoiceDd || !infoEl) return;
    const inv = (this._invoices || []).find(i => String(i.id) === String(invoiceDd.value));
    if (!inv) { infoEl.innerHTML = ''; return; }
    const bal = Number(inv.balance || (inv.amount_due - (inv.amount_paid || 0))).toFixed(2);
    infoEl.innerHTML = `
      <div class="text-xs text-gray-600 mt-1">
        Amount Due: <span class="font-medium">${Number(inv.amount_due).toFixed(2)}</span>
        • Paid: <span class="font-medium">${Number(inv.amount_paid).toFixed(2)}</span>
        • Balance: <span class="font-semibold ${Number(bal)>0?'text-red-600':'text-green-600'}">${bal}</span>
      </div>
    `;
  }

  async save() {
    if (this._saving) return;
    this._saving = true;
    try {
      const invoiceDd = this.querySelector('ui-search-dropdown[name="invoice_id"]');
      const amountInput = this.querySelector('ui-input[data-field="amount"]');
      const methodDd = this.querySelector('ui-search-dropdown[name="method"]');
      const refInput = this.querySelector('ui-input[data-field="reference"]');
      const dateInput = this.querySelector('ui-input[data-field="paid_on"]');
      const notesInput = this.querySelector('ui-input[data-field="notes"]');

      const payload = {
        invoice_id: invoiceDd?.value ? Number(invoiceDd.value) : null,
        amount: amountInput?.value ? Number(amountInput.value) : 0,
        method: methodDd?.value || undefined,
        reference: refInput?.value || undefined,
        paid_on: dateInput?.value || undefined,
        notes: notesInput?.value || undefined,
      };

      if (!payload.invoice_id) return Toast.show({ title: 'Validation', message: 'Select invoice', variant: 'error', duration: 3000 });
      if (!payload.amount || isNaN(payload.amount) || payload.amount <= 0) return Toast.show({ title: 'Validation', message: 'Enter valid amount', variant: 'error', duration: 3000 });

      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });

      const resp = await api.withToken(token).post('/cashier/payments', payload);
      if (resp.status === 201 || resp.data?.success) {
        Toast.show({ title: 'Success', message: 'Payment recorded', variant: 'success', duration: 2000 });
        this.close();
        this.dispatchEvent(new CustomEvent('payment-saved', { bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to record payment');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to record payment', variant: 'error', duration: 3000 });
    } finally {
      this._saving = false;
    }
  }



  render() {
    const openInvoices = (this._invoices || []).filter(i => String(i.status).toLowerCase() !== 'paid' && Number(i.balance || (i.amount_due - (i.amount_paid || 0))) > 0);
    const today = new Date().toISOString().split('T')[0];
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Add Payment">
        <div slot="content">
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Invoice *</label>
            <ui-search-dropdown name="invoice_id" placeholder="Select invoice" class="w-full">
              ${openInvoices.map(i => `<ui-option value="${i.id}">${this.invoiceDisplay(i)}</ui-option>`).join('')}
            </ui-search-dropdown>
            <div id="invoice-info"></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <ui-input data-field="amount" type="number" step="0.01" placeholder="0.00" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Paid On *</label>
              <ui-input data-field="paid_on" type="date" value="${today}" min="${today}" class="w-full"></ui-input>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Method *</label>
            <ui-search-dropdown name="method" placeholder="Select method" class="w-full">
              <ui-option value="Cash">Cash</ui-option>
              <ui-option value="Bank">Bank</ui-option>
              <ui-option value="Mobile Money">Mobile Money</ui-option>
              <ui-option value="Cheque">Cheque</ui-option>
            </ui-search-dropdown>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
            <ui-input data-field="reference" type="text" placeholder="Optional reference" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <ui-input data-field="notes" type="text" placeholder="Optional note" class="w-full"></ui-input>
          </div>
        </form>

        <div class="mt-4 p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
          <div class="flex items-start space-x-2">
            <i class="fas fa-info-circle mt-0.5"></i>
            <div>
              <p class="font-medium">How to make a payment</p>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Invoice</strong>: Select the invoice this payment is for. The system will show the current balance.</li>
                <li><strong>Amount</strong>: Enter the payment amount. This will automatically update the invoice balance.</li>
                <li><strong>Method</strong>: Choose how the payment was made (cash, bank transfer, etc.).</li>
                <li><strong>Paid On</strong>: The payment date defaults to today and cannot be backdated.</li>
                <li><strong>Notes</strong>: Add any additional details about this payment.</li>
              </ul>
            </div>
          </div>
        </div>

      </ui-dialog>
          `;
    }
}

customElements.define('cashier-payment-add-modal', CashierPaymentAddModal);
export default CashierPaymentAddModal;


