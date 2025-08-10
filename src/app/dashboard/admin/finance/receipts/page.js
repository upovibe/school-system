import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/FinanceReceiptViewModal.js';
import api from '@/services/api.js';
import Toast from '@/components/ui/Toast.js';

/**
 * Finance: Fee Receipts Management Page
 *
 * Displays fee receipts with view, print, and regenerate actions using the Table component.
 */
class FinanceReceiptsPage extends App {
  constructor() {
    super();
    this.receipts = null;
    this.loading = false;
    this.showViewModal = false;
    this.viewReceiptData = null;
  }

  // Header counts
  getHeaderCounts() {
    const receipts = this.get('receipts') || [];
    const total = receipts.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    let today = 0;
    let totalAmount = 0;
    let printed = 0;
    let voided = 0;
    
    receipts.forEach(r => {
      totalAmount += Number(r.amount || 0);
      if ((r.created_at || '').startsWith(todayStr)) today += 1;
      if (r.printed_on) printed += 1;
      if (r.voided_at) voided += 1;
    });
    
    const students = new Set((receipts || []).map(r => String(r.student_id))).size;
    return { total, today, totalAmount, students, printed, voided };
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="space-y-8 mb-4">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold">Fee Receipts</h1>
              <p class="text-blue-100 text-base sm:text-lg">View and manage payment receipts</p>
            </div>
            <div class="mt-4 sm:mt-0 text-right">
              <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
              <div class="text-blue-100 text-xs sm:text-sm">Total Receipts</div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-calendar-day text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.today}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Today</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-coins text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">₵${Number(c.totalAmount).toFixed(2)}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Total Amount</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-print text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.printed}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Printed</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-red-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-ban text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.voided}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Voided</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
    
    // Listen for table events
    this.addEventListener('table-view', this.onView.bind(this));
    this.addEventListener('table-refresh', this.loadData.bind(this));
  }

  async loadData() {
    this.set('loading', true);
    const token = localStorage.getItem('token');
    if (!token) {
      Toast.show({ title: 'Authentication Error', message: 'Please log in to view data', variant: 'error', duration: 3000 });
      this.set('loading', false);
      return;
    }

    try {
      const response = await api.withToken(token).get('/finance/receipts');
      if (response.data.success) {
        this.set('receipts', response.data.data);
        this.updateTableData();
      } else {
        Toast.show({ title: 'Error', message: 'Failed to load receipts', variant: 'error', duration: 3000 });
      }
    } catch (error) {
      console.error('Error loading receipts:', error);
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load receipts', variant: 'error', duration: 3000 });
      this.set('receipts', []);
    } finally {
      this.set('loading', false);
    }
  }

  // Helper methods for display
  studentDisplay(receipt) {
    if (!receipt) return 'N/A';
    
    // Use student_display if available (most reliable)
    if (receipt.student_display) {
      return receipt.student_display;
    }
    
    // Fallback to combining first_name and last_name
    const firstName = receipt.first_name || '';
    const lastName = receipt.last_name || '';
    const result = `${firstName} ${lastName}`.trim() || 'N/A';
    return result;
  }

  invoiceDisplay(receipt) {
    if (!receipt) return 'N/A';
    const result = receipt.invoice_number || `INV-${receipt.invoice_id}` || 'N/A';
    return result;
  }

  displayStatus(status) {
    const v = String(status || 'posted').toLowerCase();
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  formatDateTime(value) {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  // Event handlers
  onView(event) {
    const id = event.detail.row?.id;
    const receipt = this.get('receipts')?.find(r => String(r.id) === String(id));
    if (receipt) {
      this.closeAllModals();
      this.set('viewReceiptData', receipt);
      this.set('showViewModal', true);
      
      // Get the modal immediately and set data
      const modal = this.querySelector('finance-receipt-view-modal');
      if (modal) {
        modal.setReceiptData(receipt);
      } else {
        // If modal not found, wait for next render cycle
        setTimeout(() => {
          const modal = this.querySelector('finance-receipt-view-modal');
          if (modal) {
            modal.setReceiptData(receipt);
          }
        }, 100);
      }
    }
  }

  updateTableData() {
    const receipts = this.get('receipts');
    if (!receipts) return;

    const tableData = receipts.map((r, idx) => ({
      id: r.id,
      index: idx + 1,
      receipt_number: r.receipt_number,
      invoice: this.invoiceDisplay(r),
      student: this.studentDisplay(r),
      amount: Number(r.amount).toFixed(2),
      method: r.method || 'N/A',
      status: this.displayStatus(r.payment_status || 'posted'),
      paid_on: this.formatDateTime(r.paid_on),
      printed_on: this.formatDateTime(r.printed_on),
      created: this.formatDateTime(r.created_at),
    }));

    const table = this.querySelector('ui-table');
    if (table) table.setAttribute('data', JSON.stringify(tableData));
  }

  closeAllModals() {
    this.set('showViewModal', false);
    this.set('viewReceiptData', null);
  }

  render() {
    const receipts = this.get('receipts');
    const loading = this.get('loading');
    const showViewModal = this.get('showViewModal');

    const tableData = receipts ? receipts.map((r, idx) => ({
      id: r.id,
      index: idx + 1,
      receipt_number: r.receipt_number,
      invoice: this.invoiceDisplay(r),
      student: this.studentDisplay(r),
      amount: Number(r.amount).toFixed(2),
      method: r.method || 'N/A',
      status: this.displayStatus(r.payment_status || 'posted'),
      paid_on: this.formatDateTime(r.paid_on),
      printed_on: this.formatDateTime(r.printed_on),
      created: this.formatDateTime(r.created_at),
    })) : [];

    const tableColumns = [
      { key: 'index', label: 'No.' },
      { key: 'receipt_number', label: 'Receipt No.' },
      { key: 'invoice', label: 'Invoice' },
      { key: 'student', label: 'Student' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status' },
      { key: 'paid_on', label: 'Paid On' },
      { key: 'printed_on', label: 'Printed On' },
      { key: 'created', label: 'Created' },
    ];

    return `
      ${this.renderHeader()}
      <div class="bg-white rounded-lg shadow-lg p-4">
        ${loading ? `
          <div class="space-y-4">
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
          </div>
        ` : `
          <div class="mb-8">
            <ui-table
              title="Fee Receipts"
              data='${JSON.stringify(tableData)}'
              columns='${JSON.stringify(tableColumns)}'
              sortable
              searchable
              search-placeholder="Search receipts..."
              pagination
              page-size="50"
              action
              actions="view"  
              refresh
              print
              bordered
              striped
              class="w-full"
            ></ui-table>
          </div>
        `}
      </div>

      <finance-receipt-view-modal ${showViewModal ? 'open' : ''}></finance-receipt-view-modal>
    `;
  }
}

customElements.define('app-finance-receipts-page', FinanceReceiptsPage);
export default FinanceReceiptsPage;