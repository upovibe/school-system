import App from '@/core/App.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Textarea.js';
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
    this.showVoidDialog = false;
    this.voidReason = '';
  }

  setReceiptData(receipt) {
    this.receipt = receipt || null;
    this.render();
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Listen for dialog events
    this.addEventListener('dialog-close', this.onClose.bind(this));
    
    // Initial render
    this.render();
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open' && newValue !== null) {
      // Modal is now open, ensure it's rendered
      this.render();
    }
  }

  close() { 
    this.removeAttribute('open'); 
  }

  onClose() {
    this.close();
  }

  onVoidClick() {
    this.set('showVoidDialog', true);
  }

  onVoidCancel() {
    this.set('showVoidDialog', false);
    this.set('voidReason', '');
  }

  async onVoidConfirm() {
    if (!this.voidReason.trim()) {
      this.showToast('error', 'Void reason is required');
      return;
    }

    if (!this.receipt) return;
    
    try {
      this.set('loading', true);
      
      const response = await api.post(`/finance/receipts/${this.receipt.id}/void`, {
        reason: this.voidReason.trim()
      });
      
      if (response.data.success) {
        this.showToast('success', 'Receipt voided successfully');
        // Refresh the receipt data
        this.receipt = response.data.data;
        this.set('showVoidDialog', false);
        this.set('voidReason', '');
        this.render();
      } else {
        this.showToast('error', response.data.message || 'Failed to void receipt');
      }
    } catch (error) {
      console.error('Error voiding receipt:', error);
      this.showToast('error', 'Failed to void receipt');
    } finally {
      this.set('loading', false);
    }
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
        this.showToast('error', 'Failed to generate receipt for printing');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      this.showToast('error', 'Failed to print receipt');
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
        this.showToast('success', 'Receipt regenerated successfully');
        // Refresh the receipt data
        this.receipt = response.data.data;
        this.render();
      } else {
        this.showToast('error', response.data.message || 'Failed to regenerate receipt');
      }
    } catch (error) {
      console.error('Error regenerating receipt:', error);
      this.showToast('error', 'Failed to regenerate receipt');
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
    const receipt = this.receipt;
    const loading = this.get('loading');
    const showVoidDialog = this.get('showVoidDialog');
    const voidReason = this.get('voidReason');

    if (!receipt) {
      return `
        <ui-dialog title="Receipt Details" size="lg" ${this.hasAttribute('open') ? 'open' : ''}>
          <div slot="content" class="p-6 text-center text-gray-500">
            No receipt data available
          </div>
        </ui-dialog>
      `;
    }

    const isVoided = receipt.voided_at;
    const voidedClass = isVoided ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
    const voidedText = isVoided ? 'text-red-800' : 'text-green-800';

    return `
      <ui-dialog title="Receipt Details" size="lg" ${this.hasAttribute('open') ? 'open' : ''}>
        <div slot="content" class="p-6 space-y-6">
          <!-- Header with receipt number and status -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Receipt ${receipt.receipt_number}</h3>
              <p class="text-sm text-gray-600">Generated on ${this.formatDateTime(receipt.created_at)}</p>
            </div>
            <div class="flex items-center space-x-2">
              <span class="px-3 py-1 text-sm font-medium rounded-full ${voidedClass} ${voidedText} border">
                ${isVoided ? 'VOIDED' : 'ACTIVE'}
              </span>
            </div>
          </div>

          <!-- Student Information -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-md font-semibold text-gray-900 mb-3">Student Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-600">Student Name</label>
                <p class="text-sm text-gray-900">${receipt.student_first_name} ${receipt.student_last_name}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">Student ID</label>
                <p class="text-sm text-gray-900">${receipt.student_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          <!-- Payment Information -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-md font-semibold text-gray-900 mb-3">Payment Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-600">Invoice Number</label>
                <p class="text-sm text-gray-900">${receipt.invoice_number || 'N/A'}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">Term & Academic Year</label>
                <p class="text-sm text-gray-900">${receipt.term} ${receipt.academic_year}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">Payment Method</label>
                <p class="text-sm text-gray-900">${receipt.method || 'N/A'}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">Reference</label>
                <p class="text-sm text-gray-900">${receipt.reference || 'N/A'}</p>
              </div>
            </div>
          </div>

          <!-- Financial Summary -->
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="text-md font-semibold text-blue-900 mb-3">Financial Summary</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-blue-600">Amount Paid</label>
                <p class="text-lg font-bold text-blue-900">${this.formatCurrency(receipt.amount)}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-blue-600">Balance After Payment</label>
                <p class="text-lg font-bold text-blue-900">${this.formatCurrency(receipt.balance)}</p>
              </div>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-md font-semibold text-gray-900 mb-3">Timestamps</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-600">Payment Date</label>
                <p class="text-sm text-gray-900">${this.formatDateTime(receipt.paid_on)}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">Receipt Generated</label>
                <p class="text-sm text-gray-900">${this.formatDateTime(receipt.created_at)}</p>
              </div>
              ${receipt.printed_on ? `
                <div>
                  <label class="text-sm font-medium text-gray-600">Last Printed</label>
                  <p class="text-sm text-gray-900">${this.formatDateTime(receipt.printed_on)}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Void Information (if voided) -->
          ${isVoided ? `
            <div class="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 class="text-md font-semibold text-red-900 mb-3">Void Information</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-red-600">Voided On</label>
                  <p class="text-sm text-red-900">${this.formatDateTime(receipt.voided_at)}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-red-600">Voided By</label>
                  <p class="text-sm text-red-900">${receipt.voided_by_display || 'N/A'}</p>
                </div>
                ${receipt.void_reason ? `
                  <div class="md:col-span-2">
                    <label class="text-sm font-medium text-red-600">Void Reason</label>
                    <p class="text-sm text-red-900">${receipt.void_reason}</p>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Footer Actions -->
        <div slot="footer" class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Receipt ID: ${receipt.id}
          </div>
          <div class="flex items-center space-x-3">
            <ui-button 
              variant="outline" 
              size="sm"
              onclick="this.closest('finance-receipt-view-modal').onPrint()"
              ${loading ? 'disabled' : ''}
            >
              <i class="fas fa-print mr-2"></i>
              Print Receipt
            </ui-button>
            <ui-button 
              variant="outline" 
              size="sm"
              onclick="this.closest('finance-receipt-view-modal').onRegenerate()"
              ${loading ? 'disabled' : ''}
            >
              <i class="fas fa-sync-alt mr-2"></i>
              Regenerate
            </ui-button>
            ${!isVoided ? `
              <ui-button 
                variant="outline" 
                color="error"
                size="sm"
                onclick="this.closest('finance-receipt-view-modal').onVoidClick()"
                ${loading ? 'disabled' : ''}
              >
                <i class="fas fa-ban mr-2"></i>
                Void
              </ui-button>
            ` : ''}
            <ui-button 
              variant="outline" 
              size="sm"
              onclick="this.closest('finance-receipt-view-modal').onClose()"
            >
              Cancel
            </ui-button>
          </div>
        </div>
      </ui-dialog>

      <!-- Void Dialog -->
      ${showVoidDialog ? `
        <ui-dialog title="Void Receipt" variant="danger" open>
          <div slot="content" class="p-6">
            <p class="text-sm text-gray-700 mb-4">Please provide a reason for voiding this receipt. This action cannot be undone.</p>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Void Reason *</label>
              <ui-textarea 
                id="void-reason-input"
                placeholder="Enter reason for voiding this receipt..."
                rows="3"
                class="w-full"
                value="${voidReason}"
                onchange="this.closest('finance-receipt-view-modal').set('voidReason', this.value)"
              ></ui-textarea>
            </div>
          </div>
          <div slot="footer" class="flex justify-end gap-3">
            <ui-button 
              variant="outline" 
              size="sm"
              onclick="this.closest('finance-receipt-view-modal').onVoidCancel()"
            >
              Cancel
            </ui-button>
            <ui-button 
              color="error"
              size="sm"
              onclick="this.closest('finance-receipt-view-modal').onVoidConfirm()"
              ${loading ? 'disabled' : ''}
            >
              <i class="fas fa-ban mr-2"></i>
              Void Receipt
            </ui-button>
          </div>
        </ui-dialog>
      ` : ''}
    `;
  }
}

customElements.define('finance-receipt-view-modal', FinanceReceiptViewModal);
export default FinanceReceiptViewModal;

