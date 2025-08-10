import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class FinancePaymentViewModal extends HTMLElement {
  constructor() { super(); this._payment = null; }
  static get observedAttributes() { return ['open']; }
  connectedCallback() { this.render(); this.setup(); }
  setPaymentData(payment) { this._payment = payment || null; this.render(); this.setup(); }

  setup() {
    // Void button in footer - opens void dialog
    const voidBtn = this.querySelector('#void-btn');
    if (voidBtn && !voidBtn._bound) {
      voidBtn.addEventListener('click', () => {
        const dlg = this.querySelector('#void-dialog');
        if (dlg) dlg.setAttribute('open', '');
      });
      voidBtn._bound = true;
    }

    // Void dialog handlers
    const voidDlg = this.querySelector('#void-dialog');
    if (voidDlg && !voidDlg._bound) {
      voidDlg.addEventListener('confirm', () => this.voidPayment());
      voidDlg.addEventListener('cancel', () => voidDlg.removeAttribute('open'));
      voidDlg._bound = true;
    }

    // Cancel button in footer - closes main modal
    const cancelMainBtn = this.querySelector('#cancel-view');
    if (cancelMainBtn && !cancelMainBtn._bound) {
      cancelMainBtn.addEventListener('click', () => this.close());
      cancelMainBtn._bound = true;
    }
  }

  async voidPayment() {
    try {
      if (!this._payment?.id) return;
      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });
      const reasonInput = this.querySelector('#void-reason');
      const reasonVal = (reasonInput?.value || '').trim();
      if (!reasonVal) {
        return Toast.show({ title: 'Validation', message: 'Reason is required to void this payment', variant: 'error', duration: 3000 });
      }
      const resp = await api.withToken(token).put(`/finance/payments/${this._payment.id}/void`, { reason: reasonVal });
      if (resp.status === 200 || resp.data?.success) {
        Toast.show({ title: 'Voided', message: 'Payment voided successfully', variant: 'success', duration: 2000 });
        this.dispatchEvent(new CustomEvent('payment-voided', { bubbles: true, composed: true }));
        const dlg = this.querySelector('#void-dialog');
        if (dlg) dlg.removeAttribute('open');
        this.close();
      } else {
        throw new Error(resp.data?.message || 'Failed to void payment');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to void payment', variant: 'error', duration: 3000 });
    }
  }

  close() { this.removeAttribute('open'); }

  render() {
    const p = this._payment || {};
    const safe = (v) => (v == null || v === '' ? 'N/A' : v);
    const money = (v) => Number(v || 0).toFixed(2);
    const fmt = (v) => {
      if (!v) return 'N/A';
      try { const d = new Date(String(v).replace(' ', 'T')); return d.toLocaleString(); } catch { return v; }
    };
    const isVoided = String(p.status || '').toLowerCase() === 'voided';
    this.innerHTML = `
      <ui-dialog id="main-dialog" ${this.hasAttribute('open') ? 'open' : ''} title="View Payment">
        <div slot="content" class="space-y-6">
          <!-- Header -->
          <div class="flex items-center gap-3 border-b pb-4">
            <h3 class="text-xl font-semibold text-gray-900">${safe(p.invoiceDisplay || ('Invoice #' + p.invoice_id))}</h3>
            <ui-badge color="info"><i class="fas fa-coins mr-1"></i>${money(p.amount)}</ui-badge>
            ${p.method ? `<ui-badge color="secondary"><i class="fas fa-wallet mr-1"></i>${safe(p.method)}</ui-badge>` : ''}
            ${isVoided ? `<ui-badge color="error"><i class="fas fa-ban mr-1"></i>Voided</ui-badge>` : ''}
          </div>

          <!-- Payment Information -->
          <div class="border-b pb-4 mt-2">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-info-circle text-blue-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Payment Information</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <p class="text-gray-900 text-sm font-medium">${safe(p.studentDisplay || ('#' + p.student_id))}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Paid On</label>
                <p class="text-gray-900 text-sm">${fmt(p.paid_on)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <p class="text-gray-900 text-sm">${safe(p.reference)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <p class="text-gray-900 text-sm font-semibold">${money(p.amount)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p class="text-gray-900 text-sm">${safe(p.notes)}</p>
              </div>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="mt-2">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-clock text-orange-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <span class="text-gray-900 text-sm">${fmt(p.created_at)}</span>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Updated</label>
                <span class="text-gray-900 text-sm">${fmt(p.updated_at)}</span>
              </div>
              ${isVoided ? `
              <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Voided</label>
                <span class="text-gray-900 text-sm">${fmt(p.voided_at)}${p.voidedByDisplay ? ` • by ${p.voidedByDisplay}` : ''}${p.void_reason ? ` • Reason: ${p.void_reason}` : ''}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
        <div slot="footer" class="flex items-center justify-end gap-2">
          <ui-button id="cancel-view" variant="outline" color="secondary" dialog-action="cancel">Cancel</ui-button>
          ${!isVoided ? `<ui-button id=\"void-btn\" color=\"error\"><i class=\"fas fa-ban mr-1\"></i>Void</ui-button>` : ''}
        </div>
      </ui-dialog>

      ${!isVoided ? `
      <ui-dialog id="void-dialog" title="Void Payment" ${this.hasAttribute('void-open') ? 'open' : ''}>
        <div slot="content">
          <p class="text-sm text-gray-700 mb-2">Provide an optional reason for voiding this payment.</p>
          <textarea id="void-reason" class="w-full border rounded px-2 py-1 text-sm" rows="3" placeholder="Reason (optional)"></textarea>
        </div>
        <div slot="footer" class="flex justify-end gap-2">
          <ui-button variant="outline" color="secondary" dialog-action="cancel">Cancel</ui-button>
          <ui-button color="error" dialog-action="confirm">Void Payment</ui-button>
        </div>
      </ui-dialog>
      ` : ''}
    `;
  }
}

customElements.define('finance-payment-view-modal', FinancePaymentViewModal);
export default FinancePaymentViewModal;