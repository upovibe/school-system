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
    this.set('receipt', null);
    this.set('loading', false);
  }

  setReceiptData(receipt) {
    this.set('receipt', receipt);
    this.set('loading', false);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dialog-close', this.onClose.bind(this));
  }

  // Add event listeners after the component is rendered
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open' && newValue !== null) {
      // Modal is now open, add event listeners to buttons
      setTimeout(() => {
        this.addButtonListeners();
      }, 100);
    }
  }

  addButtonListeners() {
    
    const printBtn = this.querySelector('#print-btn');
    const regenerateBtn = this.querySelector('#regenerate-btn');
    
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.onPrint();
      });
    }
    
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', () => {
        this.onRegenerate();
      });
    }
  }

  static get observedAttributes() {
    return ['open'];
  }

  close() { 
    this.removeAttribute('open'); 
  }

  onClose() {
    this.close();
  }

  async onPrint() {
    if (!this.get('receipt')) {
      return;
    }
    
    try {
      this.set('loading', true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        Toast.show({ title: 'Error', message: 'Authentication token not found', variant: 'error', duration: 3000 });
        return;
      }
      
      const printUrl = `/api/finance/receipts/${this.get('receipt').id}/print`;
      
      // Fetch the receipt HTML with authentication
      const response = await fetch(printUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/html'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Open new window and write the HTML content
        const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          
          // Wait for content to load then print
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        }
      } else {
        throw new Error(`Print failed with status: ${response.status}`);
      }
    } catch (error) {
      Toast.show({ title: 'Error', message: 'Failed to print receipt', variant: 'error', duration: 3000 });
    } finally {
      this.set('loading', false);
    }
  }

  async onRegenerate() {
    if (!this.get('receipt')) {
      return;
    }
    
    // Show custom confirmation dialog
    const confirmed = await this.showConfirmDialog(
      'Regenerate Receipt',
      `Are you sure you want to regenerate receipt <strong>${this.get('receipt').receipt_number}</strong>?<br><br>
      <strong>This will:</strong><br>
      • Generate a new receipt number<br>
      • Reset the print status<br>
      • Keep all payment details the same<br><br>
      <em>This action cannot be undone.</em>`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      this.set('loading', true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        Toast.show({ title: 'Error', message: 'Authentication token not found', variant: 'error', duration: 3000 });
        return;
      }
      
      const response = await api.withToken(token).post(`/finance/receipts/${this.get('receipt').id}/regenerate`, {});
      
      if (response.data.success) {
        Toast.show({ title: 'Success', message: 'Receipt regenerated successfully', variant: 'success', duration: 3000 });
        
        // Update the receipt data with the response
        this.set('receipt', response.data.data);
        this.render();
        
        // Close the modal after successful regeneration
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('receipt-regenerated', { 
            bubbles: true, 
            composed: true,
            detail: { receipt: response.data.data }
          }));
        }, 0);
      } else {
        Toast.show({ title: 'Error', message: response.data.message || 'Failed to regenerate receipt', variant: 'error', duration: 3000 });
      }
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to regenerate receipt';
        Toast.show({ title: 'Error', message: errorMessage, variant: 'error', duration: 3000 });
      } else if (error.request) {
        Toast.show({ title: 'Error', message: 'No response received from server', variant: 'error', duration: 3000 });
      } else {
        Toast.show({ title: 'Error', message: 'Failed to regenerate receipt: ' + error.message, variant: 'error', duration: 3000 });
      }
    } finally {
      this.set('loading', false);
    }
  }

  showConfirmDialog(title, message) {
    return new Promise((resolve) => {
      const dialog = document.createElement('ui-dialog');
      dialog.setAttribute('open', '');
      dialog.setAttribute('title', title);
      
      dialog.innerHTML = `
        <div slot="content" class="text-gray-700">
          ${message}
        </div>
        <div slot="footer" class="flex justify-end space-x-3">
          <ui-button color="secondary" id="cancel-btn">Cancel</ui-button>
          <ui-button color="error" id="confirm-btn">Regenerate Receipt</ui-button>
        </div>
      `;
      
      // Add event listeners
      dialog.querySelector('#cancel-btn').addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(false);
      });
      
      dialog.querySelector('#confirm-btn').addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(true);
      });
      
      // Add to body
      document.body.appendChild(dialog);
    });
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
          <ui-button id="cancel-view" variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
          <ui-button id="print-btn" color="primary">
            <i class="fas fa-print mr-1"></i>Print
          </ui-button>
          <ui-button id="regenerate-btn" color="secondary">
            <i class="fas fa-sync mr-1"></i>Regenerate
          </ui-button>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define('finance-receipt-view-modal', FinanceReceiptViewModal);
export default FinanceReceiptViewModal;

