import '@/components/ui/Modal.js';
import '@/components/ui/Badge.js';

class CashierInvoiceViewModal extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setInvoiceData(invoice) {
    this._invoice = invoice || null;
    this.render();
  }

  setupEventListeners() {
    this.addEventListener('cancel', () => this.close());
  }

  open() { this.setAttribute('open', ''); }
  close() { this.removeAttribute('open'); }

  render() {
    const i = this._invoice;
    const safe = (v) => (v == null || v === '' ? 'N/A' : v);
    const money = (v) => Number(v || 0).toFixed(2);
    const formatDate = (d) => {
      if (!d) return 'N/A';
      try { return new Date(d).toLocaleString(); } catch { return d; }
    };

    if (!i) {
      this.innerHTML = `
        <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" size="lg" close-button="true">
          <div slot="title">View Invoice Details</div>
          <div class="p-4 text-center text-gray-500">No invoice data to display</div>
        </ui-modal>
      `;
      return;
    }

    this.innerHTML = `
      <ui-modal 
        ${this.hasAttribute('open') ? 'open' : ''}
        position="right"
        size="lg"
        close-button="true">
        <div slot="title">View Invoice Details</div>

        <div>
          <!-- Header -->
          <div class="flex items-center gap-3 border-b pb-4">
            <h3 class="text-xl font-semibold text-gray-900">Invoice # ${safe(i.invoice_number)}</h3>
            <ui-badge color="${String(i.status).toLowerCase() === 'paid' ? 'success' : 'warning'}">
              <i class="fas fa-${String(i.status).toLowerCase() === 'paid' ? 'check' : 'exclamation'} mr-1"></i>
              ${safe(i.status)}
            </ui-badge>
          </div>

          <!-- Financials -->
          <div class="border-b pb-4 mt-4">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-receipt text-indigo-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Financials</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-arrow-up mr-1"></i>Amount Due
                </label>
                <p class="text-gray-900 text-sm font-medium">${money(i.amount_due)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-arrow-down mr-1"></i>Amount Paid
                </label>
                <p class="text-gray-900 text-sm font-medium">${money(i.amount_paid)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-balance-scale mr-1"></i>Balance
                </label>
                <p class="${Number(i.balance) > 0 ? 'text-red-600' : 'text-green-600'} text-sm font-semibold">${money(i.balance)}</p>
              </div>
            </div>
          </div>

          <!-- Invoice Information -->
          <div class="border-b pb-4 mt-4">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-info-circle text-blue-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Invoice Information</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-user-graduate mr-1"></i>Student
                </label>
                <p class="text-gray-900 text-sm font-medium">${safe(i.studentDisplay || `#${i.student_id}`)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-user mr-1"></i>Student Type
                </label>
                <p class="text-gray-900 text-sm">${safe(i.student_type)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-calendar mr-1"></i>Academic Year
                </label>
                <p class="text-gray-900 text-sm">${safe(i.academic_year)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-calendar-alt mr-1"></i>Term
                </label>
                <p class="text-gray-900 text-sm">${safe(i.term)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-calendar-day mr-1"></i>Issue Date
                </label>
                <p class="text-gray-900 text-sm">${formatDate(i.issue_date)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-calendar-check mr-1"></i>Due Date
                </label>
                <p class="text-gray-900 text-sm">${formatDate(i.due_date)}</p>
              </div>
            </div>
          </div>

          <!-- Additional Details -->
          ${i.notes ? `
          <div class="border-b pb-4 mt-4">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-sticky-note text-yellow-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Notes</h4>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <p class="text-gray-700 text-sm">${i.notes}</p>
            </div>
          </div>
          ` : ''}

          <!-- Timestamps -->
          <div class="mt-4">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-clock text-gray-500"></i>
              <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-plus mr-1"></i>Created
                </label>
                <p class="text-gray-900 text-sm">${formatDate(i.created_at)}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  <i class="fas fa-edit mr-1"></i>Last Updated
                </label>
                <p class="text-gray-900 text-sm">${formatDate(i.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        <div slot="footer" class="flex justify-end">
          <ui-button modal-action="cancel" variant="secondary">Close</ui-button>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('cashier-invoice-view-modal', CashierInvoiceViewModal);
export default CashierInvoiceViewModal;
