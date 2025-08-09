import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class FinanceInvoiceDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
    this.setup();
  }

  setInvoiceData(invoice) {
    this._invoice = invoice || null;
    this.render();
    this.setup();
  }

  setup() {
    const dialog = this.querySelector('ui-dialog');
    if (!dialog) return;
    dialog.addEventListener('confirm', () => this.deleteInvoice());
    dialog.addEventListener('cancel', () => this.close());
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async deleteInvoice() {
    try {
      if (!this._invoice) return;
      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });
      const id = this._invoice.id;
      const resp = await api.withToken(token).delete(`/finance/invoices/${id}`);
      if (resp.status === 200 || resp.data?.success) {
        Toast.show({ title: 'Deleted', message: 'Invoice deleted', variant: 'success', duration: 2500 });
        this.close();
        this.dispatchEvent(new CustomEvent('invoice-deleted', { detail: { id }, bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to delete invoice');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete invoice', variant: 'error', duration: 3000 });
    }
  }

  render() {
    const i = this._invoice || {};
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Delete Invoice" variant="danger">
        <div slot="content">
          <p class="text-sm text-gray-700">Are you sure you want to delete this invoice?</p>
          <div class="mt-3 p-3 bg-red-50 border border-red-100 rounded text-red-700 text-sm">
            <div><strong>Invoice #:</strong> ${i.invoice_number ?? ''}</div>
            <div><strong>Student ID:</strong> ${i.student_id ?? ''}</div>
            <div><strong>Year/Term:</strong> ${i.academic_year ?? ''} - ${i.term ?? ''}</div>
            <div><strong>Amount Due:</strong> ${i.amount_due ?? ''}</div>
            <div><strong>Balance:</strong> ${i.balance ?? ''}</div>
          </div>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('finance-invoice-delete-dialog', FinanceInvoiceDeleteDialog);
export default FinanceInvoiceDeleteDialog;



