import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class CashierInvoiceDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
    this._deleting = false;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setInvoiceData(invoice) {
    this._invoice = invoice || null;
    this.render();
  }

  setupEventListeners() {
    this.addEventListener('confirm', () => this.deleteInvoice());
    this.addEventListener('cancel', () => this.close());
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async deleteInvoice() {
    try {
      if (!this._invoice) return;
      
      this._deleting = true;
      this.render();
      
      const token = localStorage.getItem('token');
      if (!token) {
        Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });
        return;
      }
      
      const id = this._invoice.id;
      const resp = await api.withToken(token).delete(`/cashier/invoices/${id}`);
      
      if (resp.status === 200 || resp.data?.success) {
        Toast.show({ title: 'Deleted', message: 'Invoice deleted successfully', variant: 'success', duration: 2500 });
        this.close();
        this.dispatchEvent(new CustomEvent('invoice-deleted', { detail: { id }, bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to delete invoice');
      }
    } catch (error) {
      Toast.show({ 
        title: 'Error', 
        message: error.response?.data?.message || error.message || 'Failed to delete invoice', 
        variant: 'error', 
        duration: 3000 
      });
    } finally {
      this._deleting = false;
      this.render();
    }
  }

  render() {
    const i = this._invoice || {};
    
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Delete Invoice" variant="danger">
        <div slot="content" class="space-y-4">
          <p class="text-sm text-gray-700">Are you sure you want to delete this invoice?</p>
          <div class="mt-3 p-3 bg-red-50 border border-red-100 rounded text-red-700 text-sm">
            <div><strong>Invoice #:</strong> ${i.invoice_number ?? 'N/A'}</div>
            <div><strong>Student ID:</strong> ${i.student_id ?? 'N/A'}</div>
            <div><strong>Year/Term:</strong> ${i.academic_year ?? 'N/A'} - ${i.term ?? 'N/A'}</div>
            <div><strong>Amount Due:</strong> ${i.amount_due ?? 'N/A'}</div>
            <div><strong>Balance:</strong> ${i.balance ?? 'N/A'}</div>
          </div>
          <p class="text-xs text-red-600 font-medium">This action cannot be undone.</p>
        </div>
        
        <div slot="footer" class="flex justify-end gap-3">
          <ui-button dialog-action="cancel" variant="secondary" disabled="${this._deleting}">
            Cancel
          </ui-button>
          <ui-button dialog-action="confirm" variant="danger" loading="${this._deleting}">
            ${this._deleting ? 'Deleting...' : 'Delete Invoice'}
          </ui-button>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('cashier-invoice-delete-dialog', CashierInvoiceDeleteDialog);
export default CashierInvoiceDeleteDialog;
