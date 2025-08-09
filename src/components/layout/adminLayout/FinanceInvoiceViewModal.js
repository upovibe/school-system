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
    const rows = i ? [
      ['Student', i.studentDisplay || `#${i.student_id}`],
      ['Academic Year', i.academic_year],
      ['Term', i.term],
      ['Invoice #', i.invoice_number],
      ['Amount Due', Number(i.amount_due).toFixed(2)],
      ['Amount Paid', Number(i.amount_paid).toFixed(2)],
      ['Balance', Number(i.balance).toFixed(2)],
      ['Status', i.status],
      ['Issue Date', i.issue_date || '—'],
      ['Due Date', i.due_date || '—'],
      ['Notes', i.notes || '—'],
      ['Updated', i.updated_at],
    ] : [];

    this.innerHTML = `
      <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
        <div slot="title">View Invoice</div>
        <div class="space-y-4">
          ${i ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${rows.map(([k, v]) => `
                <div class="p-3 border rounded-md bg-gray-50">
                  <div class="text-xs text-gray-500">${k}</div>
                  <div class="text-sm font-medium text-gray-800">${v}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-gray-600">No data</div>
          `}
        </div>
      </ui-modal>
    `;
  }
}

customElements.define('finance-invoice-view-modal', FinanceInvoiceViewModal);
export default FinanceInvoiceViewModal;



