import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class CashierInvoiceDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
    this._deleting = false;
    this._listenersAttached = false;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
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
    this.addEventListener('confirm', () => this.deleteInvoice());
    this.addEventListener('cancel', () => this.close());
    this._listenersAttached = true;
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async deleteInvoice() {
    if (this._deleting || !this._invoice) return;
    this._deleting = true;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });
      }

      const resp = await api.withToken(token).delete(`/cashier/invoices/${this._invoice.id}`);
      
      if (resp.status === 200 || resp.data?.success) {
        Toast.show({ title: 'Success', message: 'Invoice deleted', variant: 'success', duration: 2500 });
        
        this.close();
        this.dispatchEvent(new CustomEvent('invoice-deleted', { 
          detail: { id: this._invoice.id }, 
          bubbles: true, 
          composed: true 
        }));
      } else {
        throw new Error(resp.data?.message || 'Failed to delete invoice');
      }
    } catch (error) {
      Toast.show({ 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to delete invoice', 
        variant: 'error', 
        duration: 3000 
      });
    } finally {
      this._deleting = false;
    }
  }

  render() {
    if (!this._invoice) return '';

    const invoice = this._invoice;
    const studentName = invoice.studentDisplay || `Student #${invoice.student_id}`;
    const amount = parseFloat(invoice.amount_due || 0).toFixed(2);

    return `
      <ui-dialog title="Delete Invoice" size="md">
        <div class="space-y-4">
          <div class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-900 mb-2">Are you sure you want to delete this invoice?</h3>
            <p class="text-sm text-gray-500">
              This action cannot be undone. This will permanently delete the invoice and all associated data.
            </p>
          </div>

          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Invoice Details</h3>
                <div class="mt-2 text-sm text-red-700">
                  <ul class="list-disc pl-5 space-y-1">
                    <li><strong>Invoice #:</strong> ${invoice.invoice_number || 'N/A'}</li>
                    <li><strong>Student:</strong> ${studentName}</li>
                    <li><strong>Academic Year:</strong> ${invoice.academic_year || 'N/A'}</li>
                    <li><strong>Term:</strong> ${invoice.term || 'N/A'}</li>
                    <li><strong>Amount Due:</strong> $${amount}</li>
                    <li><strong>Status:</strong> ${(invoice.status || 'open').toUpperCase()}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Important Considerations</h3>
                <div class="mt-2 text-sm text-yellow-700">
                  <ul class="list-disc pl-5 space-y-1">
                    <li>This will remove all payment records associated with this invoice</li>
                    <li>Financial reports will be affected</li>
                    <li>Student balance calculations will be updated</li>
                    <li>This action is logged for audit purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div slot="footer" class="flex justify-end gap-3">
          <ui-button data-action="cancel" variant="secondary" disabled="${this._deleting}">
            Cancel
          </ui-button>
          <ui-button data-action="confirm" variant="danger" loading="${this._deleting}">
            ${this._deleting ? 'Deleting...' : 'Delete Invoice'}
          </ui-button>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('cashier-invoice-delete-dialog', CashierInvoiceDeleteDialog);
export default CashierInvoiceDeleteDialog;
