import App from '@/core/App.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Finance: Receipt View Dialog
 *
 * Displays receipt details with options to print, regenerate, and void.
 */
class FinanceReceiptViewModal extends App {
  constructor() {
    super();
    this.receipt = null;
    this.loading = false;
  }

  setReceiptData(receipt) {
    this.set('receipt', receipt);
    this.set('loading', false);
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Listen for dialog events
    this.addEventListener('dialog-close', this.onClose.bind(this));
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // No action needed when open attribute changes
  }

  close() { 
    this.removeAttribute('open'); 
  }

  onClose() {
    this.close();
  }

  async onPrint() {
    if (!this.receipt) return;
    
    try {
      this.set('loading', true);
      
      // Open receipt in new window for printing
      const printUrl = `/api/finance/receipts/${this.receipt.id}/print`;
      const token = localStorage.getItem('token');
      
      const response = await fetch(printUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/html'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } else {
        Toast.show({ title: 'Error', message: 'Failed to generate receipt for printing', variant: 'error', duration: 3000 });
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      Toast.show({ title: 'Error', message: 'Failed to print receipt', variant: 'error', duration: 3000 });
    } finally {
      this.set('loading', false);
    }
  }

  async onRegenerate() {
    if (!this.receipt) return;
    
    try {
      this.set('loading', true);
      
      const response = await api.post(`/finance/receipts/${this.receipt.id}/regenerate`);
      if (response.data.success) {
        Toast.show({ title: 'Success', message: 'Receipt regenerated successfully', variant: 'success', duration: 3000 });
        // Refresh the receipt data
        this.set('receipt', response.data.data);
        this.render();
      } else {
        Toast.show({ title: 'Error', message: response.data.message || 'Failed to regenerate receipt', variant: 'error', duration: 3000 });
      }
    } catch (error) {
      console.error('Error regenerating receipt:', error);
      Toast.show({ title: 'Error', message: 'Failed to regenerate receipt', variant: 'error', duration: 3000 });
    } finally {
      this.set('loading', false);
    }
  }

  formatDateTime(value) {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  formatCurrency(amount) {
    return `₵${Number(amount).toFixed(2)}`;
  }

  render() {
    const receipt = this.get('receipt');
    const loading = this.get('loading');

    if (!receipt) {
      return `
        <ui-dialog title="Receipt Details" size="lg" ${this.hasAttribute('open') ? 'open' : ''}>
          <div slot="content" class="p-6 text-center text-gray-500">
            No receipt data available
          </div>
        </ui-dialog>
      `;
    }

    // Helper functions for consistent formatting
    const safe = (v) => (v == null || v === '' ? 'N/A' : v);
    const money = (v) => Number(v || 0).toFixed(2);
    const fmt = (v) => {
      if (!v) return 'N/A';
      try { 
        const d = new Date(String(v).replace(' ', 'T')); 
        return d.toLocaleString(); 
      } catch { 
        return v; 
      }
    };

    return `
      <ui-dialog id="main-dialog" ${this.hasAttribute('open') ? 'open' : ''} title="View Receipt">
        <div slot="content" class="space-y-6">
          <!-- Header -->
          <div class="flex flex-col gap-2 border-b pb-4">
            <h3 class="text-xl font-semibold text-gray-900">Receipt ${safe(receipt.receipt_number)}</h3>
            <div class="flex items-center gap-2 w-full justify-end">
              <ui-badge color="info"><i class="fas fa-receipt mr-1"></i>${money(receipt.amount)}</ui-badge>
              ${receipt.method ? `<ui-badge color="secondary"><i class="fas fa-wallet mr-1"></i>${safe(receipt.method)}</ui-badge>` : ''}
              ${receipt.payment_status ? `<ui-badge color="${receipt.payment_status === 'voided' ? 'error' : 'success'}"><i class="fas fa-${receipt.payment_status === 'voided' ? 'ban' : 'check'} mr-1"></i>${receipt.payment_status.toUpperCase()}</ui-badge>` : ''}
            </div>
          </div>

          <!-- Student Information -->
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

          <!-- Payment Information -->
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

          <!-- Financial Summary -->
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

          <!-- Timestamps -->
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
                <label class="block text-sm font-medium text-gray-700 mb-1">Receipt Generated</label>
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
          <ui-button id="cancel-view" variant="outline" color="secondary" dialog-action="cancel">Cancel</ui-button>
          <ui-button id="print-btn" color="primary" onclick="this.closest('finance-receipt-view-modal').onPrint()">
            <i class="fas fa-print mr-1"></i>Print
          </ui-button>
          <ui-button id="regenerate-btn" color="secondary" onclick="this.closest('finance-receipt-view-modal').onRegenerate()">
            <i class="fas fa-sync mr-1"></i>Regenerate
          </ui-button>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('finance-receipt-view-modal', FinanceReceiptViewModal);
export default FinanceReceiptViewModal;

