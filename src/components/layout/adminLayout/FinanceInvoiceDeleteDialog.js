import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class FinanceInvoiceDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
    this._listenersAttached = false;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
    this.setupListeners();
  }

  setInvoiceData(invoice) {
    this._invoice = invoice || null;
    this.render();
    this.setupListeners();
  }

  setupListeners() {
    if (this._listenersAttached) return;
    this.addEventListener('confirm', () => this.deleteInvoice());
    this.addEventListener('cancel', () => this.close());
    this._listenersAttached = true;
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
        Toast.show({ title: 'Deleted', message: 'Invoice deleted', variant: 'success', duration: 2000 });
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
    const i = this._invoice;
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''}>
        <div slot="title">Delete Invoice</div>
        <div class="space-y-2">
          <p>Are you sure you want to delete this invoice?</p>
          ${i ? `<p class="text-sm text-gray-600">Invoice #${i.invoice_number} for student #${i.student_id}</p>` : ''}
        </div>
        <div slot="footer">
          <button is="ui-button" variant="secondary" data-action="cancel">Cancel</button>
          <button is="ui-button" variant="danger" data-action="confirm">Delete</button>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('finance-invoice-delete-dialog', FinanceInvoiceDeleteDialog);
export default FinanceInvoiceDeleteDialog;



