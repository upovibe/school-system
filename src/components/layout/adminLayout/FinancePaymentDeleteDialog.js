import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class FinancePaymentDeleteDialog extends HTMLElement {
  constructor() { super(); this._payment = null; }
  static get observedAttributes() { return ['open']; }
  connectedCallback() { this.render(); this.setup(); }
  setPaymentData(payment) { this._payment = payment || null; this.render(); this.setup(); }

  setup() {
    this.addEventListener('confirm', () => this.delete());
    this.addEventListener('cancel', () => this.close());
  }
  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  async delete() {
    try {
      if (!this._payment) return;
      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });
      const resp = await api.withToken(token).delete(`/finance/payments/${this._payment.id}`);
      if (resp.status === 200 || resp.data?.success) {
        Toast.show({ title: 'Deleted', message: 'Payment deleted', variant: 'success', duration: 2000 });
        this.close();
        this.dispatchEvent(new CustomEvent('payment-deleted', { detail: { id: this._payment.id }, bubbles: true, composed: true }));
      } else {
        throw new Error(resp.data?.message || 'Failed to delete payment');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete payment', variant: 'error', duration: 3000 });
    }
  }

  render() {
    const p = this._payment || {};
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} title="Delete Payment" variant="danger">
        <div slot="content" class="text-sm text-gray-700">
          <p>Are you sure you want to delete this payment?</p>
          <div class="mt-3 p-3 bg-red-50 border border-red-100 rounded text-red-700 text-sm">
            <div><strong>Invoice:</strong> ${p.invoiceDisplay || (p.invoice_id ? `#${p.invoice_id}` : 'N/A')}</div>
            <div><strong>Student:</strong> ${p.studentDisplay || (p.student_id ?? 'N/A')}</div>
            <div><strong>Amount:</strong> ${Number(p.amount || 0).toFixed(2)}</div>
            <div><strong>Method:</strong> ${p.method || 'N/A'}</div>
            <div><strong>Paid On:</strong> ${p.paid_on || 'N/A'}</div>
            ${p.reference ? `<div><strong>Reference:</strong> ${p.reference}</div>` : ''}
          </div>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('finance-payment-delete-dialog', FinancePaymentDeleteDialog);
export default FinancePaymentDeleteDialog;


