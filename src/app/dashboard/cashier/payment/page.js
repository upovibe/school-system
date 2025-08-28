import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import api from '@/services/api.js';
import '@/components/layout/cashierLayout/CashierPaymentAddModal.js';
import '@/components/layout/cashierLayout/CashierPaymentViewModal.js';

class CashierPaymentsPage extends App {
  constructor() {
    super();
    this.payments = null;
    this.invoices = [];
    this.students = [];
    this.users = [];
    this.loading = false;
    this.showAddModal = false;
    this.showViewModal = false;
    this.showDeleteDialog = false;
    this.viewPaymentData = null;
    this.deletePaymentData = null;
  }

  getHeaderCounts() {
    const payments = this.get('payments') || [];
    const total = payments.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    let today = 0;
    let totalAmount = 0;
    payments.forEach(p => {
      totalAmount += Number(p.amount || 0);
      if ((p.paid_on || '').startsWith(todayStr)) today += 1;
    });
    const students = new Set((payments || []).map(p => String(p.student_id))).size;
    return { total, today, totalAmount, students };
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="space-y-8 mb-4">
        <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">Fee Payments</h1>
                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-cashier-payments-info" title="About Fee Payments">
                  <i class="fas fa-question-circle text-lg"></i>
                </button>
              </div>
              <p class="text-emerald-100 text-base sm:text-lg">Record and manage payments for invoices</p>
            </div>
            <div class="mt-4 sm:mt-0 text-right">
              <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
              <div class="text-emerald-100 text-xs sm:text-sm">Total Payments</div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-calendar-day text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.today}</div>
                  <div class="text-emerald-100 text-xs sm:text-sm">Today</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-coins text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${Number(c.totalAmount).toFixed(2)}</div>
                  <div class="text-emerald-100 text-xs sm:text-sm">Total Amount</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-user-graduate text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.students}</div>
                  <div class="text-emerald-100 text-xs sm:text-sm">Students Paid</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-sync-alt text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${new Date().getFullYear()}</div>
                  <div class="text-emerald-100 text-xs sm:text-sm">Current Year</div>
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
    document.title = 'Cashier - Fee Payments';
    this.loadData();
    this.addEventListener('click', this.handleHeaderActions.bind(this));

    this.addEventListener('table-view', this.onView.bind(this));
    this.addEventListener('table-delete', this.onDelete.bind(this));
    this.addEventListener('table-add', this.onAdd.bind(this));
    this.addEventListener('table-refresh', () => this.loadData());

    this.addEventListener('payment-deleted', () => {
      this.loadData();
      this.set('showDeleteDialog', false);
    });

    this.addEventListener('payment-saved', () => {
      this.loadData();
      this.set('showAddModal', false);
    });
  }

  handleHeaderActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');
    if (action === 'show-cashier-payments-info') {
      this.showCashierPaymentsInfo();
    }
  }

  showCashierPaymentsInfo() {
    const dialog = document.createElement('ui-dialog');
    dialog.setAttribute('open', '');
    dialog.innerHTML = `
      <div slot="header" class="flex items-center">
        <i class="fas fa-coins text-emerald-500 mr-2"></i>
        <span class="font-semibold">About Fee Payments</span>
      </div>
      <div slot="content" class="space-y-4">
        <p class="text-gray-700">Record payments against student invoices. Choose invoice, student, method, and amount. Voids/update affect invoice balances.</p>
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between"><span class="text-sm font-medium">Invoice</span><span class="text-sm text-gray-600">Link payment to invoice</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Amount & Method</span><span class="text-sm text-gray-600">Cash, Bank, Mobile Money, Cheque</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Paid On</span><span class="text-sm text-gray-600">Payment timestamp</span></div>
        </div>
      </div>
      <div slot="footer" class="flex justify-end">
        <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
      </div>
    `;
    document.body.appendChild(dialog);
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
      const [presp, iresp, sresp, cresp] = await Promise.all([
        api.withToken(token).get('/cashier/payments'),
        api.withToken(token).get('/cashier/invoices'),
        api.withToken(token).get('/cashier/students'),
        api.withToken(token).get('/classes/active/cashier'),
      ]);
      const payments = presp?.data?.data || [];
      const invoices = iresp?.data?.data || [];
      const students = sresp?.data?.data || [];
      const classes = cresp?.data?.data || [];
      this.set('payments', payments);
      this.set('invoices', invoices);
      this.set('students', students);
      this.set('classes', classes);
      this.invoices = invoices;
      this.students = students;
      this.classes = classes;
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load payments', variant: 'error', duration: 3000 });
      this.set('payments', []);
      this.set('invoices', []);
      this.set('students', []);
      this.set('classes', []);
    }

    this.set('loading', false);
    this.updateTableData();
  }

  studentDisplay(studentId) {
    const list = this.get('students') || this.students || [];
    const s = list.find(x => String(x.id) === String(studentId));
    if (!s) return `Student #${studentId}`;
    const fullName = s.name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || s.username || s.email || `Student #${studentId}`;
    return fullName;
  }

  invoiceDisplay(invoiceId) {
    const list = this.get('invoices') || this.invoices || [];
    const inv = list.find(x => String(x.id) === String(invoiceId));
    if (!inv) return `Invoice #${invoiceId}`;
    return `${inv.invoice_number || ('#' + invoiceId)} (${this.studentDisplay(inv.student_id)})`;
  }

  displayStatus(status) {
    const v = String(status || 'posted').toLowerCase();
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  formatDateTime(value) {
    if (!value) return '';
    try {
      const normalized = String(value).replace(' ', 'T');
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return value;
      return d.toLocaleString();
    } catch (_) { return value; }
  }

  async onView(event) {
    const item = (this.get('payments') || []).find((p) => String(p.id) === String(event.detail.row.id));
    if (!item) return;
    
    this.closeAllModals();
    this.set('viewPaymentData', item);
    this.set('showViewModal', true);
    
    // Fetch full payment data including receipt information
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await api.withToken(token).get(`/cashier/payments/${item.id}`);
      if (response?.data?.success) {
        const fullPaymentData = response.data.data;
        
        setTimeout(() => {
          const modal = this.querySelector('cashier-payment-view-modal');
          if (modal) {
            modal.setPaymentData({
              ...fullPaymentData,
              invoiceDisplay: this.invoiceDisplay(fullPaymentData.invoice_id),
              studentDisplay: this.studentDisplay(fullPaymentData.student_id),
            });
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error fetching full payment data:', error);
      // Fallback to basic data if API call fails
      setTimeout(() => {
        const modal = this.querySelector('cashier-payment-view-modal');
        if (modal) {
          modal.setPaymentData({
            ...item,
            invoiceDisplay: this.invoiceDisplay(item.invoice_id),
            studentDisplay: this.studentDisplay(item.student_id),
          });
        }
      }, 0);
    }
  }

  onDelete(event) {
    const item = (this.get('payments') || []).find((p) => String(p.id) === String(event.detail.row.id));
    if (!item) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    // Confirm then delete
    const dlg = confirm('Delete this payment? This will update the invoice totals.');
    if (!dlg) return;
    api.withToken(token).delete(`/cashier/payments/${item.id}`).then(() => {
      Toast.show({ title: 'Deleted', message: 'Payment deleted', variant: 'success', duration: 2000 });
      this.loadData();
    }).catch((error) => {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete payment', variant: 'error', duration: 3000 });
    });
  }

  onAdd() {
    this.closeAllModals();
    this.set('showAddModal', true);
    setTimeout(() => {
      const modal = this.querySelector('cashier-payment-add-modal');
      if (modal) modal.setData({ 
        invoices: this.invoices, 
        students: this.students, 
        classes: this.classes 
      });
    }, 0);
  }

  updateTableData() {
    const payments = this.get('payments');
    if (!payments) return;
    const tableData = payments.map((p, idx) => ({
      id: p.id,
      index: idx + 1,
      invoice: this.invoiceDisplay(p.invoice_id),
      student: this.studentDisplay(p.student_id),
      amount: Number(p.amount).toFixed(2),
      method: p.method || 'N/A',
      reference: p.reference || '—',
      status: this.displayStatus(p.status),
      paid_on: this.formatDateTime(p.paid_on),
      created: this.formatDateTime(p.created_at),
    }));
    const table = this.querySelector('ui-table');
    if (table) table.setAttribute('data', JSON.stringify(tableData));
  }

  closeAllModals() {
    this.set('showAddModal', false);
    this.set('showViewModal', false);
    this.set('showDeleteDialog', false);
    this.set('viewPaymentData', null);
    this.set('deletePaymentData', null);
  }

  render() {
    const payments = this.get('payments');
    const loading = this.get('loading');

    const tableData = payments ? payments.map((p, idx) => ({
      id: p.id,
      index: idx + 1,
      invoice: this.invoiceDisplay(p.invoice_id),
      student: this.studentDisplay(p.student_id),
      amount: Number(p.amount).toFixed(2),
      method: p.method || 'N/A',
      reference: p.reference || '—',
      status: this.displayStatus(p.status),
      paid_on: this.formatDateTime(p.paid_on),
      created: this.formatDateTime(p.created_at),
    })) : [];

    const tableColumns = [
      { key: 'index', label: 'No.' },
      { key: 'invoice', label: 'Invoice' },
      { key: 'student', label: 'Student' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'reference', label: 'Reference' },
      { key: 'status', label: 'Status' },
      { key: 'paid_on', label: 'Paid On' },
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
              title="Fee Payments"
              data='${JSON.stringify(tableData)}'
              columns='${JSON.stringify(tableColumns)}'
              sortable
              searchable
              search-placeholder="Search payments..."
              pagination
              page-size="50"
              action
              actions="view"
              addable
              refresh
              print
              bordered
              striped
              class="w-full"
            ></ui-table>
          </div>
        `}
      </div>

      <cashier-payment-add-modal ${this.get('showAddModal') ? 'open' : ''}></cashier-payment-add-modal>
      <cashier-payment-view-modal ${this.get('showViewModal') ? 'open' : ''}></cashier-payment-view-modal>
    `;
  }
}

customElements.define('app-cashier-payments-page', CashierPaymentsPage);
export default CashierPaymentsPage;

