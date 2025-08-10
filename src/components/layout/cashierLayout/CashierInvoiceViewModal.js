import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';

class CashierInvoiceViewModal extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
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
    this.addEventListener('close', () => this.close());
    this._listenersAttached = true;
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  render() {
    if (!this._invoice) return '';

    const invoice = this._invoice;
    const balance = (parseFloat(invoice.amount_due || 0) - parseFloat(invoice.amount_paid || 0)).toFixed(2);
    const statusColor = invoice.status === 'paid' ? 'text-green-600' : 'text-orange-600';
    const statusBg = invoice.status === 'paid' ? 'bg-green-100' : 'bg-orange-100';

    return `
      <ui-modal title="Invoice Details" size="lg">
        <div class="space-y-6">
          <!-- Header with Invoice Number and Status -->
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Invoice #${invoice.invoice_number || 'N/A'}</h3>
              <p class="text-sm text-gray-500">Created on ${invoice.created_at || 'N/A'}</p>
            </div>
            <div class="text-right">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBg} ${statusColor}">
                ${(invoice.status || 'open').toUpperCase()}
              </span>
            </div>
          </div>

          <!-- Student Information -->
          <div class="bg-blue-50 p-4 rounded-lg">
            <h4 class="font-medium text-blue-900 mb-2">Student Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-blue-700 font-medium">Student ID:</span>
                <span class="ml-2 text-blue-900">${invoice.student_id || 'N/A'}</span>
              </div>
              <div>
                <span class="text-blue-700 font-medium">Student Name:</span>
                <span class="ml-2 text-blue-900">${invoice.studentDisplay || 'N/A'}</span>
              </div>
              <div>
                <span class="text-blue-700 font-medium">Academic Year:</span>
                <span class="ml-2 text-blue-900">${invoice.academic_year || 'N/A'}</span>
              </div>
              <div>
                <span class="text-blue-700 font-medium">Term:</span>
                <span class="ml-2 text-blue-900">${invoice.term || 'N/A'}</span>
              </div>
              ${invoice.student_type ? `
                <div>
                  <span class="text-blue-700 font-medium">Student Type:</span>
                  <span class="ml-2 text-blue-900">${invoice.student_type}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Financial Details -->
          <div class="bg-green-50 p-4 rounded-lg">
            <h4 class="font-medium text-green-900 mb-2">Financial Details</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-900">$${parseFloat(invoice.amount_due || 0).toFixed(2)}</div>
                <div class="text-sm text-green-700">Amount Due</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-900">$${parseFloat(invoice.amount_paid || 0).toFixed(2)}</div>
                <div class="text-sm text-green-700">Amount Paid</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold ${parseFloat(balance) > 0 ? 'text-orange-600' : 'text-green-600'}">$${balance}</div>
                <div class="text-sm text-green-700">Balance</div>
              </div>
            </div>
          </div>

          <!-- Dates and Notes -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Important Dates</h4>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="text-gray-600">Issue Date:</span>
                  <span class="ml-2 text-gray-900">${invoice.issue_date || 'N/A'}</span>
                </div>
                <div>
                  <span class="text-gray-600">Due Date:</span>
                  <span class="ml-2 text-gray-900">${invoice.due_date || 'N/A'}</span>
                </div>
                <div>
                  <span class="text-gray-600">Last Updated:</span>
                  <span class="ml-2 text-gray-900">${invoice.updated_at || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Additional Information</h4>
              <div class="text-sm">
                <span class="text-gray-600">Notes:</span>
                <div class="mt-1 text-gray-900 bg-gray-50 p-2 rounded border">
                  ${invoice.notes || 'No additional notes'}
                </div>
              </div>
            </div>
          </div>

          <!-- Payment History (if any) -->
          ${invoice.amount_paid > 0 ? `
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-medium text-yellow-900 mb-2">Payment Information</h4>
              <div class="text-sm text-yellow-800">
                <div>Partial payment of $${parseFloat(invoice.amount_paid).toFixed(2)} has been received.</div>
                <div class="mt-1">Remaining balance: $${balance}</div>
              </div>
            </div>
          ` : ''}

          <!-- System Information -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">System Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Invoice ID:</span>
                <span class="ml-2 text-gray-900">${invoice.id}</span>
              </div>
              <div>
                <span class="text-gray-600">Created:</span>
                <span class="ml-2 text-gray-900">${invoice.created_at || 'N/A'}</span>
              </div>
              <div>
                <span class="text-gray-600">Updated:</span>
                <span class="ml-2 text-gray-900">${invoice.updated_at || 'N/A'}</span>
              </div>
              <div>
                <span class="text-gray-600">Status:</span>
                <span class="ml-2 text-gray-900 capitalize">${invoice.status || 'open'}</span>
              </div>
            </div>
          </div>
        </div>

        <div slot="footer" class="flex justify-end">
          <ui-button data-action="close" variant="secondary">Close</ui-button>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('cashier-invoice-view-modal', CashierInvoiceViewModal);
export default CashierInvoiceViewModal;
