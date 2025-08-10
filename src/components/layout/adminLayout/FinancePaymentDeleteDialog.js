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
      <ui-dialog ${this.hasAttribute('open') ? 'open' : ''}>
        <div slot="title">Delete Payment</div>
        <div class="text-sm text-gray-700">
          Are you sure you want to delete this payment of <span class="font-semibold">${Number(p.amount || 0).toFixed(2)}</span> for invoice <span class="font-semibold">${p.invoice_id || ''}</span>?
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('finance-payment-delete-dialog', FinancePaymentDeleteDialog);
export default FinancePaymentDeleteDialog;


