import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class CashierPaymentViewModal extends HTMLElement {
  constructor() { super(); this._payment = null; }
  static get observedAttributes() { return ['open']; }
  connectedCallback() { this.render(); this.setup(); }
  setPaymentData(payment) { 
    this._payment = payment || null; 
    this.render(); 
    this.setup(); 
  }

  setup() {
    const cancelMainBtn = this.querySelector('#cancel-view');
    if (cancelMainBtn && !cancelMainBtn._bound) {
      cancelMainBtn.addEventListener('click', () => this.close());
      cancelMainBtn._bound = true;
    }

    const printBtn = this.querySelector('#print-btn');
    if (printBtn && !printBtn._bound) {
      printBtn.addEventListener('click', () => this.printReceipt());
      printBtn._bound = true;
    }
  }

  async printReceipt() {
    try {
      
      if (!this._payment?.receipt_id) {
        Toast.show({ title: 'Error', message: 'No receipt found for this payment', variant: 'error', duration: 3000 });
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) return Toast.show({ title: 'Auth', message: 'Please log in', variant: 'error', duration: 3000 });
      
      // Use the same API endpoint structure as receipt view modal
      const url = `/api/cashier/receipts/${this._payment.receipt_id}/print`;
      
      const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'text/html' } });
      
      if (!resp.ok) throw new Error('Failed to print receipt');
      const html = await resp.text();
      
      const w = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (w) {
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => { try { w.print(); } catch (_) {} }, 800);
      }
    } catch (error) {
      console.error('Error in printReceipt:', error);
      Toast.show({ title: 'Error', message: 'Failed to print receipt', variant: 'error', duration: 3000 });
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
          <div class="flex flex-col gap-2 border-b pb-4">
            <h3 class="text-xl font-semibold text-gray-900">${safe(p.invoiceDisplay || ('Invoice #' + p.invoice_id))}</h3>
            <div class="flex items-center gap-2 w-full justify-end">
              <ui-badge color="info"><i class="fas fa-coins mr-1"></i>${money(p.amount)}</ui-badge>
              ${p.method ? `<ui-badge color="secondary"><i class="fas fa-wallet mr-1"></i>${safe(p.method)}</ui-badge>` : ''}
              ${isVoided ? `<ui-badge color="error"><i class="fas fa-ban mr-1"></i>Voided</ui-badge>` : ''}
            </div>
          </div>

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
          <ui-button id="cancel-view" variant="outline" color="secondary" modal-action="cancel">Close</ui-button>
          <ui-button id="print-btn" color="primary"><i class="fas fa-print mr-1"></i>Print Receipt</ui-button>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('cashier-payment-view-modal', CashierPaymentViewModal);
export default CashierPaymentViewModal;


