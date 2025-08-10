import '@/components/ui/Modal.js';
import '@/components/ui/Badge.js';

class FinancePaymentViewModal extends HTMLElement {
  constructor() { super(); this._payment = null; }
  static get observedAttributes() { return ['open']; }
  connectedCallback() { this.render(); }
  setPaymentData(payment) { this._payment = payment || null; this.render(); }

  render() {
    const p = this._payment || {};
    const safe = (v) => (v == null || v === '' ? 'N/A' : v);
    const money = (v) => Number(v || 0).toFixed(2);
    const fmt = (v) => {
      if (!v) return 'N/A';
      try { const d = new Date(String(v).replace(' ', 'T')); return d.toLocaleString(); } catch { return v; }
    };
    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" size="lg" close-button="true">
        <div slot="title">View Payment</div>
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex items-center gap-3 border-b pb-4">
            <h3 class="text-xl font-semibold text-gray-900">${safe(p.invoiceDisplay || ('Invoice #' + p.invoice_id))}</h3>
            <ui-badge color="info"><i class="fas fa-coins mr-1"></i>${money(p.amount)}</ui-badge>
            ${p.method ? `<ui-badge color="secondary"><i class="fas fa-wallet mr-1"></i>${safe(p.method)}</ui-badge>` : ''}
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
            </div>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('finance-payment-view-modal', FinancePaymentViewModal);
export default FinancePaymentViewModal;


