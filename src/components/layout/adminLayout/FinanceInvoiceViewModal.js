import '@/components/ui/Modal.js';

class FinanceInvoiceViewModal extends HTMLElement {
  constructor() {
    super();
    this._invoice = null;
  }

  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this.render();
  }

  setInvoiceData(invoice) {
    this._invoice = invoice || null;
    this.render();
  }

  render() {
    const i = this._invoice;
    const safe = (v) => (v == null || v === '' ? '—' : v);
    const money = (v) => Number(v || 0).toFixed(2);

    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">Invoice Details</div>
        ${i ? `
        <div class="space-y-4">
          <div class="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm opacity-90">Invoice #</div>
                <div class="text-xl font-semibold">${safe(i.invoice_number)}</div>
              </div>
              <div class="text-right">
                <div class="text-sm opacity-90">Status</div>
                <div class="inline-flex items-center px-2 py-1 rounded-md ${String(i.status).toLowerCase() === 'paid' ? 'bg-green-500/30' : 'bg-yellow-500/30'}">
                  <span class="text-sm font-semibold">${safe(i.status)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-3 rounded-md border bg-white">
              <div class="text-xs text-gray-500">Amount Due</div>
              <div class="text-lg font-semibold text-gray-900">${money(i.amount_due)}</div>
            </div>
            <div class="p-3 rounded-md border bg-white">
              <div class="text-xs text-gray-500">Amount Paid</div>
              <div class="text-lg font-semibold text-gray-900">${money(i.amount_paid)}</div>
            </div>
            <div class="p-3 rounded-md border bg-white">
              <div class="text-xs text-gray-500">Balance</div>
              <div class="text-lg font-semibold ${Number(i.balance) > 0 ? 'text-red-600' : 'text-green-600'}">${money(i.balance)}</div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3 border rounded-md bg-gray-50">
              <div class="text-xs text-gray-500">Student</div>
              <div class="text-sm font-medium text-gray-800">${safe(i.studentDisplay || `#${i.student_id}`)}</div>
            </div>
            <div class="p-3 border rounded-md bg-gray-50">
              <div class="text-xs text-gray-500">Period</div>
              <div class="text-sm font-medium text-gray-800">${safe(i.academic_year)} • ${safe(i.term)}</div>
            </div>
            <div class="p-3 border rounded-md bg-gray-50">
              <div class="text-xs text-gray-500">Issue Date</div>
              <div class="text-sm font-medium text-gray-800">${safe(i.issue_date)}</div>
            </div>
            <div class="p-3 border rounded-md bg-gray-50">
              <div class="text-xs text-gray-500">Due Date</div>
              <div class="text-sm font-medium text-gray-800">${safe(i.due_date)}</div>
            </div>
            <div class="p-3 border rounded-md bg-gray-50 sm:col-span-2">
              <div class="text-xs text-gray-500">Notes</div>
              <div class="text-sm font-medium text-gray-800">${safe(i.notes)}</div>
            </div>
          </div>

          <div class="text-xs text-gray-500 text-right">Updated ${safe(i.updated_at)}</div>
        </div>
        ` : `
          <div class="p-4 text-gray-600">No data</div>
        `}
      </ui-modal>
    `;
  }
}

customElements.define('finance-invoice-view-modal', FinanceInvoiceViewModal);
export default FinanceInvoiceViewModal;



