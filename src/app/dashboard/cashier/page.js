import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Skeleton.js';

class CashierPage extends App {
  constructor() {
    super();
    this.set('loading', true);
    this.set('currentUser', null);
    this.set('invoices', []);
    this.set('payments', []);
    this.set('receipts', []);
    this.set('students', []);
    this.userName = 'Cashier';
  }

  connectedCallback() {
    super.connectedCallback();
    document.title = 'Cashier Dashboard | School System';
    this.loadAll();
    this.addEventListener('click', this.handleHeaderActions.bind(this));
  }

  handleHeaderActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');
    if (action === 'show-cashier-dashboard-info') {
      this.showCashierDashboardInfo();
    }
  }

  showCashierDashboardInfo() {
    const dialog = document.createElement('ui-dialog');
    dialog.setAttribute('open', '');
    dialog.innerHTML = `
      <div slot="header" class="flex items-center">
        <i class="fas fa-cash-register text-green-500 mr-2"></i>
        <span class="font-semibold">About Cashier Dashboard</span>
      </div>
      <div slot="content" class="space-y-4">
        <p class="text-gray-700">Overview of invoices, payments, receipts and quick links for cashier operations.</p>
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between"><span class="text-sm font-medium">Summary Cards</span><span class="text-sm text-gray-600">Quick KPI snapshots for today and totals</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Financial Overview</span><span class="text-sm text-gray-600">Invoice status, payment totals, collection rate</span></div>
          <div class="flex justify-between"><span class="text-sm font-medium">Quick Actions</span><span class="text-sm text-gray-600">Record payments, manage invoices, view receipts</span></div>
        </div>
      </div>
      <div slot="footer" class="flex justify-end">
        <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  async loadAll() {
    try {
      this.set('loading', true);
      const token = localStorage.getItem('token');
      if (!token) {
        this.set('loading', false);
        return;
      }

      // Load user data
      try {
        const raw = localStorage.getItem('userData');
        if (raw) {
          const user = JSON.parse(raw);
          const computedName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || user?.email || 'Cashier';
          this.set('userName', computedName);
          this.set('currentUser', user);
        }
      } catch (_) {
        // ignore
      }

      // Fetch financial data
      const [invoicesResp, paymentsResp, receiptsResp, studentsResp] = await Promise.all([
        api.withToken(token).get('/cashier/invoices').catch(() => ({ data: { data: [] } })),
        api.withToken(token).get('/cashier/payments').catch(() => ({ data: { data: [] } })),
        api.withToken(token).get('/cashier/receipts').catch(() => ({ data: { data: [] } })),
        api.withToken(token).get('/cashier/students').catch(() => ({ data: { data: [] } }))
      ]);

      this.set('invoices', invoicesResp?.data?.data || []);
      this.set('payments', paymentsResp?.data?.data || []);
      this.set('receipts', receiptsResp?.data?.data || []);
      this.set('students', studentsResp?.data?.data || []);
    } finally {
      this.set('loading', false);
    }
  }

  calculateInvoiceStats() {
    const invoices = this.get('invoices') || [];
    return {
      total: invoices.length,
      open: invoices.filter(i => i.status === 'open' && !i.deleted_at).length,
      paid: invoices.filter(i => i.status === 'paid' && !i.deleted_at).length,
      overdue: invoices.filter(i => i.status === 'overdue' && !i.deleted_at).length,
      totalAmount: invoices.reduce((sum, i) => sum + (parseFloat(i.amount_due) || 0), 0),
      totalCollected: invoices.reduce((sum, i) => sum + (parseFloat(i.amount_paid) || 0), 0)
    };
  }

  calculatePaymentStats() {
    const payments = this.get('payments') || [];
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
    
    return {
      total: payments.length,
      today: payments.filter(p => p.paid_on && p.paid_on.startsWith(today)).length,
      thisMonth: payments.filter(p => p.paid_on && p.paid_on.startsWith(thisMonth)).length,
      totalAmount: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      todayAmount: payments.filter(p => p.paid_on && p.paid_on.startsWith(today))
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      thisMonthAmount: payments.filter(p => p.paid_on && p.paid_on.startsWith(thisMonth))
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    };
  }

  calculateReceiptStats() {
    const receipts = this.get('receipts') || [];
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: receipts.length,
      today: receipts.filter(r => r.printed_on && r.printed_on.startsWith(today)).length,
      totalPrinted: receipts.filter(r => r.printed_on).length
    };
  }

  render() {
    const loading = this.get('loading');
    const userName = this.get('userName') || this.userName;
    const invoiceStats = this.calculateInvoiceStats();
    const paymentStats = this.calculatePaymentStats();
    const receiptStats = this.calculateReceiptStats();
    const students = this.get('students') || [];

    return `
      <div class="space-y-8 p-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">Cashier Dashboard</h1>
                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-cashier-dashboard-info" title="About Cashier Dashboard">
                  <i class="fas fa-question-circle text-lg"></i>
                </button>
                <button 
                  onclick="this.closest('app-cashier-dashboard-page').loadAll()"
                  class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                  title="Refresh data">
                  <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              </div>
              <p class="text-green-100 text-base sm:text-lg">Welcome back, ${userName}.</p>
              <p class="text-green-100 text-sm mt-1">
                <i class="fas fa-calendar-alt mr-1"></i>
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div class="mt-4 sm:mt-0">
              <div class="text-right">
                <div class="text-xl sm:text-2xl font-bold">${students.length}</div>
                <div class="text-green-100 text-xs sm:text-sm">Total Students</div>
              </div>
            </div>
          </div>

          <!-- Summary Cards -->
          ${loading ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
              <ui-skeleton class="h-24 w-full"></ui-skeleton>
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-file-invoice text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${invoiceStats.total}</div>
                    <div class="text-green-100 text-xs sm:text-sm">Total Invoices</div>
                  </div>
                </div>
              </div>

              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-credit-card text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${paymentStats.today}</div>
                    <div class="text-green-100 text-xs sm:text-sm">Today's Payments</div>
                  </div>
                </div>
              </div>

              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-amber-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-money-bill text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">₵${paymentStats.todayAmount.toFixed(2)}</div>
                    <div class="text-green-100 text-xs sm:text-sm">Today's Collection</div>
                  </div>
                </div>
              </div>

              <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                <div class="flex items-center">
                  <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                    <i class="fas fa-receipt text-white text-lg sm:text-xl"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xl sm:text-2xl font-bold">${receiptStats.today}</div>
                    <div class="text-green-100 text-xs sm:text-sm">Today's Receipts</div>
                  </div>
                </div>
              </div>
            </div>
          `}
        </div>

        <!-- Financial Overview -->
        ${!loading ? `
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Invoice Status Card -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="p-2.5 rounded-lg bg-blue-500 text-white size-10 flex items-center justify-center">
                    <i class="fas fa-file-invoice text-lg"></i>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-blue-700">Invoice Status</p>
                    <p class="text-2xl font-bold text-blue-900">${invoiceStats.total}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-semibold text-blue-600">${invoiceStats.open + invoiceStats.paid}</div>
                  <div class="text-xs text-blue-500">Active</div>
                </div>
              </div>
              <div class="flex space-x-2">
                <div class="flex-1 text-center py-2 bg-white rounded-md border border-blue-200">
                  <div class="text-sm font-semibold text-orange-600">${invoiceStats.open}</div>
                  <div class="text-xs text-gray-500">Open</div>
                </div>
                <div class="flex-1 text-center py-2 bg-white rounded-md border border-blue-200">
                  <div class="text-sm font-semibold text-green-600">${invoiceStats.paid}</div>
                  <div class="text-xs text-gray-500">Paid</div>
                </div>
                <div class="flex-1 text-center py-2 bg-white rounded-md border border-blue-200">
                  <div class="text-sm font-semibold text-red-600">${invoiceStats.overdue}</div>
                  <div class="text-xs text-gray-500">Overdue</div>
                </div>
              </div>
            </div>

            <!-- Payment Summary Card -->
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="p-2.5 rounded-lg bg-green-500 text-white size-10 flex items-center justify-center">
                    <i class="fas fa-chart-line text-lg"></i>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-green-700">Payment Summary</p>
                    <p class="text-2xl font-bold text-green-900">₵${paymentStats.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-semibold text-green-600">${paymentStats.total}</div>
                  <div class="text-xs text-green-500">Total</div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between items-center py-2 px-3 bg-white rounded-md border border-green-200">
                  <span class="text-sm text-gray-600">This Month</span>
                  <span class="font-semibold text-green-700">₵${paymentStats.thisMonthAmount.toFixed(2)}</span>
                </div>
                <div class="flex justify-between items-center py-2 px-3 bg-white rounded-md border border-green-200">
                  <span class="text-sm text-gray-600">Today</span>
                  <span class="font-semibold text-blue-700">₵${paymentStats.todayAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- Collection Progress Card -->
            <div class="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg shadow-sm border border-purple-200 p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="p-2.5 rounded-lg bg-purple-500 text-white size-10 flex items-center justify-center">
                    <i class="fas fa-percentage text-lg"></i>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-purple-700">Collection Rate</p>
                    <p class="text-2xl font-bold text-purple-900">${invoiceStats.totalAmount > 0 ? ((invoiceStats.totalCollected / invoiceStats.totalAmount) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </div>
              <div class="space-y-3">
                <div class="bg-white rounded-md p-3 border border-purple-200">
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600">Progress</span>
                    <span class="font-medium text-purple-600">${invoiceStats.totalAmount > 0 ? ((invoiceStats.totalCollected / invoiceStats.totalAmount) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div class="bg-purple-500 h-1.5 rounded-full" style="width: ${invoiceStats.totalAmount > 0 ? ((invoiceStats.totalCollected / invoiceStats.totalAmount) * 100) : 0}%"></div>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <div class="flex-1 text-center py-2 bg-white rounded-md border border-purple-200">
                    <div class="text-sm font-semibold text-red-600">₵${invoiceStats.totalAmount.toFixed(2)}</div>
                    <div class="text-xs text-gray-500">Total Due</div>
                  </div>
                  <div class="flex-1 text-center py-2 bg-white rounded-md border border-purple-200">
                    <div class="text-sm font-semibold text-green-600">₵${invoiceStats.totalCollected.toFixed(2)}</div>
                    <div class="text-xs text-gray-500">Collected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ui-skeleton class="h-40 w-full"></ui-skeleton>
            <ui-skeleton class="h-40 w-full"></ui-skeleton>
            <ui-skeleton class="h-40 w-full"></ui-skeleton>
          </div>
        `}

        <!-- Quick Actions -->
        ${loading ? `
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
              <ui-skeleton class="h-28 w-full"></ui-skeleton>
            </div>
          </div>
        ` : `
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/dashboard/cashier/payment" class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-credit-card text-xl mb-2 block"></i>
                <div class="font-medium">Record Payment</div>
                <div class="text-xs opacity-90">Process student payments</div>
              </a>
              <a href="/dashboard/cashier/invoices" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-file-invoice text-xl mb-2 block"></i>
                <div class="font-medium">Manage Invoices</div>
                <div class="text-xs opacity-90">Create & track invoices</div>
              </a>
              <a href="/dashboard/cashier/receipts" class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-receipt text-xl mb-2 block"></i>
                <div class="font-medium">View Receipts</div>
                <div class="text-xs opacity-90">Print & manage receipts</div>
              </a>
              <a href="/dashboard/profile" class="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-lg text-center transition-all duration-200 transform hover:scale-105 shadow-md">
                <i class="fas fa-user text-xl mb-2 block"></i>
                <div class="font-medium">My Profile</div>
                <div class="text-xs opacity-90">Update information</div>
              </a>
            </div>
          </div>
        `}
      </div>
    `;
  }
}

customElements.define('app-cashier-page', CashierPage);
export default CashierPage;