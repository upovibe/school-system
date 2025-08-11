import App from '@/core/App.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class CashierReceiptViewModal extends App {
  constructor() { super(); this.set('receipt', null); this.set('loading', false); }
  static get observedAttributes() { return ['open']; }
  setReceiptData(receipt) { this.set('receipt', receipt); this.set('loading', false); }
  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      const printBtn = this.querySelector('#print-btn');
      if (printBtn && !printBtn._bound) { printBtn.addEventListener('click', () => this.onPrint()); printBtn._bound = true; }
      const regenBtn = this.querySelector('#regen-btn');
      if (regenBtn && !regenBtn._bound) { regenBtn.addEventListener('click', () => this.onRegenerate()); regenBtn._bound = true; }
    }, 0);
  }

  async onPrint() {
    const receipt = this.get('receipt');
    if (!receipt) return;
    try { window.open(`/api/cashier/receipts/${receipt.id}/print`, '_blank'); } catch (_) {}
  }

  async onRegenerate() {
    const receipt = this.get('receipt');
    if (!receipt) return;
    try {
      const ok = confirm(`Regenerate receipt ${receipt.receipt_number}? This will assign a new number.`);
      if (!ok) return;
      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });
      const resp = await api.withToken(token).post(`/cashier/receipts/${receipt.id}/regenerate`, {});
      if (resp?.data?.success) {
        Toast.show({ title: 'Success', message: 'Receipt regenerated', variant: 'success', duration: 2000 });
        this.set('receipt', resp.data.data);
        this.render();
        this.dispatchEvent(new CustomEvent('receipt-regenerated', { bubbles: true, composed: true, detail: { receipt: resp.data.data } }));
      } else {
        throw new Error(resp?.data?.message || 'Failed to regenerate');
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to regenerate receipt', variant: 'error', duration: 3000 });
    }
  }

  render() {
    const receipt = this.get('receipt');
    if (!receipt) {
      return `
        <ui-dialog title="Receipt Details" ${this.hasAttribute('open') ? 'open' : ''}>
          <div slot="content" class="p-6 text-center text-gray-500">No receipt data available</div>
        </ui-dialog>
      `;
    }
    const safe = (v) => (v == null || v === '' ? 'N/A' : v);
    const money = (v) => Number(v || 0).toFixed(2);
    const fmt = (v) => { if (!v) return 'N/A'; try { return new Date(String(v).replace(' ', 'T')).toLocaleString(); } catch { return v; } };
    const isVoided = String(receipt.payment_status || '').toLowerCase() === 'voided';
    return `
      <ui-dialog id="main-dialog" ${this.hasAttribute('open') ? 'open' : ''} title="View Receipt">
        <div slot="content" class="space-y-6">
          <div class="flex flex-col gap-2 border-b pb-4">
            <h3 class="text-xl font-semibold text-gray-900">Receipt ${safe(receipt.receipt_number)}</h3>
            <div class="flex items-center gap-2 w-full justify-end">
              <ui-badge color="info"><i class="fas fa-receipt mr-1"></i>${money(receipt.amount)}</ui-badge>
              ${receipt.method ? `<ui-badge color="secondary"><i class="fas fa-wallet mr-1"></i>${safe(receipt.method)}</ui-badge>` : ''}
              ${isVoided ? `<ui-badge color="error"><i class="fas fa-ban mr-1"></i>Voided</ui-badge>` : ''}
            </div>
          </div>

          <div class="border-b pb-4 mt-2">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-user text-blue-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Student Information</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <p class="text-gray-900 text-sm font-medium">${safe(receipt.student_display || `${receipt.first_name || ''} ${receipt.last_name || ''}`.trim() || 'N/A')}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <p class="text-gray-900 text-sm">${safe(receipt.student_number || receipt.student_id || 'N/A')}</p>
              </div>
            </div>
          </div>

          <div class="border-b pb-4 mt-2">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-info-circle text-green-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Payment Information</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <p class="text-gray-900 text-sm">${safe(receipt.invoice_number)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Term & Academic Year</label>
                <p class="text-gray-900 text-sm">${safe(receipt.term)} ${safe(receipt.academic_year)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <p class="text-gray-900 text-sm">${safe(receipt.method)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <p class="text-gray-900 text-sm">${safe(receipt.reference)}</p>
              </div>
            </div>
          </div>

          <div class="border-b pb-4 mt-2">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-coins text-yellow-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Financial Summary</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <label class="block text-sm font-medium text-blue-700 mb-1">Amount Paid</label>
                <p class="text-lg font-bold text-blue-900">${money(receipt.amount)}</p>
              </div>
              <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                <label class="block text-sm font-medium text-green-700 mb-1">Balance After Payment</label>
                <p class="text-lg font-bold text-green-900">${money(receipt.balance)}</p>
              </div>
            </div>
          </div>

          <div class="mt-2">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-clock text-orange-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <span class="text-gray-900 text-sm">${fmt(receipt.paid_on)}</span>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text sm font-medium text-gray-700 mb-1">Receipt Generated</label>
                <span class="text-gray-900 text-sm">${fmt(receipt.created_at)}</span>
              </div>
              ${receipt.printed_on ? `
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Printed</label>
                <span class="text-gray-900 text-sm">${fmt(receipt.printed_on)}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
        <div slot="footer" class="flex items-center justify-end gap-2">
          <ui-button id="close-btn" variant="outline" color="secondary" dialog-action="cancel">Close</ui-button>
          <ui-button id="print-btn" color="primary"><i class="fas fa-print mr-1"></i>Print</ui-button>
          <ui-button id="regen-btn" color="secondary"><i class="fas fa-sync mr-1"></i>Regenerate</ui-button>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('cashier-receipt-view-modal', CashierReceiptViewModal);
export default CashierReceiptViewModal;


