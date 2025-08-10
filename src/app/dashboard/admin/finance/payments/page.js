import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/FinancePaymentAddModal.js';
import '@/components/layout/adminLayout/FinancePaymentViewModal.js';
import '@/components/layout/adminLayout/FinancePaymentDeleteDialog.js';
import api from '@/services/api.js';

class FinancePaymentsPage extends App {
  constructor() {
    super();
    this.payments = null;
    this.invoices = [];
    this.students = [];
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
              <h1 class="text-2xl sm:text-3xl font-bold">Fee Payments</h1>
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
    document.title = 'Fee Payments | School System';
    this.loadData();

    this.addEventListener('table-view', this.onView.bind(this));
    this.addEventListener('table-delete', this.onDelete.bind(this));
    this.addEventListener('table-add', this.onAdd.bind(this));
    this.addEventListener('table-refresh', () => this.loadData());

    this.addEventListener('payment-deleted', (event) => {
      const id = event.detail.id;
      const current = this.get('payments') || [];
      this.set('payments', current.filter((p) => String(p.id) !== String(id)));
      this.updateTableData();
      this.set('showDeleteDialog', false);
    });

    this.addEventListener('payment-saved', () => {
      // Reload to get accurate computed fields
      this.loadData();
      this.set('showAddModal', false);
    });

    this.addEventListener('payment-voided', () => {
      this.loadData();
      this.set('showViewModal', false);
    });
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
      const [presp, iresp, sresp, uresp] = await Promise.all([
        api.withToken(token).get('/finance/payments'),
        api.withToken(token).get('/finance/invoices'),
        api.withToken(token).get('/students'),
        api.withToken(token).get('/users'),
      ]);
      
      const payments = presp?.data?.data || [];
      const invoices = iresp?.data?.data || [];
      const students = sresp?.data?.data || [];
      const users = uresp?.data || uresp?.data?.data || [];
      
      this.set('payments', payments);
      this.set('invoices', invoices);
      this.set('students', students);
      this.set('users', users);
      this.invoices = invoices;
      this.students = students;
      this.users = users;
    } catch (error) {
      Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load payments', variant: 'error', duration: 3000 });
      this.set('payments', []);
      this.set('invoices', []);
      this.set('students', []);
      this.set('users', []);
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

  userDisplay(userId) {
    const list = this.get('users') || this.users || [];
    const u = list.find(x => String(x.id) === String(userId));
    if (!u) return `User #${userId}`;
    const fullName = u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.full_name || u.username || u.email || `User #${userId}`;
    return fullName;
  }

  displayStatus(status) {
    const v = String(status || 'posted').toLowerCase();
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  formatDateTime(value) {
    if (!value) return '';
    try {
      // Support server formats like 'YYYY-MM-DD HH:mm:ss' or ISO
      const normalized = String(value).replace(' ', 'T');
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return value;
      return d.toLocaleString();
    } catch (_) { return value; }
  }

  onView(event) {
    const item = (this.get('payments') || []).find((p) => String(p.id) === String(event.detail.row.id));
    if (item) {
      this.closeAllModals();
      this.set('viewPaymentData', item);
      this.set('showViewModal', true);
      setTimeout(() => {
        const modal = this.querySelector('finance-payment-view-modal');
        if (modal) {
          const voidedByDisplay = item.voided_by ? this.userDisplay(item.voided_by) : null;
          modal.setPaymentData({ 
            ...item, 
            invoiceDisplay: this.invoiceDisplay(item.invoice_id), 
            studentDisplay: this.studentDisplay(item.student_id),
            voidedByDisplay
          });
        }
      }, 0);
    }
  }

  onDelete(event) {
    const item = (this.get('payments') || []).find((p) => String(p.id) === String(event.detail.row.id));
    if (item) {
      this.closeAllModals();
      this.set('deletePaymentData', item);
      this.set('showDeleteDialog', true);
      setTimeout(() => {
        const dlg = this.querySelector('finance-payment-delete-dialog');
        if (dlg) dlg.setPaymentData({
          ...item,
          invoiceDisplay: this.invoiceDisplay(item.invoice_id),
          studentDisplay: this.studentDisplay(item.student_id),
          voidedByDisplay: item.voided_by ? this.userDisplay(item.voided_by) : null
        });
      }, 0);
    }
  }

  onAdd() {
    this.closeAllModals();
    this.set('showAddModal', true);
    setTimeout(() => {
      const modal = this.querySelector('finance-payment-add-modal');
      if (modal) modal.setData({ invoices: this.invoices, students: this.students });
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
    const showAddModal = this.get('showAddModal');
    const showViewModal = this.get('showViewModal');
    const showDeleteDialog = this.get('showDeleteDialog');

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
              actions="view,delete"  
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

      <finance-payment-add-modal ${showAddModal ? 'open' : ''}></finance-payment-add-modal>
      <finance-payment-view-modal ${showViewModal ? 'open' : ''}></finance-payment-view-modal>
      <finance-payment-delete-dialog ${showDeleteDialog ? 'open' : ''}></finance-payment-delete-dialog>
    `;
  }
}

customElements.define('app-finance-payments-page', FinancePaymentsPage);
export default FinancePaymentsPage;


