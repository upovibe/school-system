import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Button.js';
import '@/components/ui/Table.js';

/**
 * Student Finance Page Component (/dashboard/student/finance)
 * 
 * Shows student's financial records including invoices, payments, and financial metrics.
 */
class StudentFinancePage extends App {
    constructor() {
        super();
        this.loading = true;
        this.currentUser = null;
        this.financeData = null;
        this.summaryData = null;
        this.selectedFilter = 'all';
        
        // Initialize state
        this.set('loading', true);
        this.set('currentUser', null);
        this.set('financeData', null);
        this.set('summaryData', null);
        this.set('selectedFilter', 'all');
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'My Payments | Student Dashboard';
        this.loadAll();
        this.addEventListener('click', this.handleButtonClick.bind(this));
    }

    handleButtonClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        
        switch (action) {
            case 'filter-all':
                this.filterData('all');
                break;
            case 'filter-paid':
                this.filterData('paid');
                break;
            case 'filter-pending':
                this.filterData('open');
                break;
            case 'show-invoice-details':
                const invoiceId = button.getAttribute('data-invoice-id');
                this.showInvoiceDetails(invoiceId);
                break;
            case 'show-payment-details':
                const paymentId = button.getAttribute('data-payment-id');
                this.showPaymentDetails(paymentId);
                break;
            case 'show-finance-help':
                this.showFinanceHelp();
                break;
        }
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
            const stored = localStorage.getItem('userData');
            if (stored) {
                try { 
                    this.set('currentUser', JSON.parse(stored)); 
                } catch (_) {}
            }

            // Load finance data in parallel
            const [financeResp, summaryResp] = await Promise.all([
                api.withToken(token).get('/student/finance/records').catch(() => null),
                api.withToken(token).get('/student/finance/summary').catch(() => null)
            ]);

            if (financeResp?.data?.success) {
                this.set('financeData', financeResp.data.data);
            }

            if (summaryResp?.data?.success) {
                this.set('summaryData', summaryResp.data.data);
            }

        } catch (error) {
            console.error('❌ Error loading finance data:', error);
        } finally {
            this.set('loading', false);
        }
    }

    filterData(filter) {
        this.set('selectedFilter', filter);
        // The render method will handle filtering
    }

    getFilteredInvoices() {
        const financeData = this.get('financeData');
        const filter = this.get('selectedFilter');
        
        if (!financeData?.invoices) return [];
        
        switch (filter) {
            case 'paid':
                return financeData.invoices.filter(invoice => invoice.status === 'paid');
            case 'open':
                return financeData.invoices.filter(invoice => invoice.status === 'open');
            default:
                return financeData.invoices;
        }
    }

    showInvoiceDetails(invoiceId) {
        const financeData = this.get('financeData');
        const invoice = financeData?.invoices?.find(inv => inv.id == invoiceId);
        
        if (!invoice) return;

        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-file-invoice text-blue-500 mr-2"></i>
                <span class="font-semibold">Invoice Details</span>
            </div>
            <div slot="content" class="space-y-4">
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium text-gray-600">Invoice Number:</span>
                            <p class="font-mono">${invoice.invoice_number}</p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Status:</span>
                            <p>
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                    invoice.status === 'paid' 
                                        ? 'bg-green-100 text-green-800' 
                                        : invoice.status === 'open' 
                                            ? 'bg-yellow-100 text-yellow-800' 
                                            : 'bg-gray-100 text-gray-800'
                                }">${invoice.status?.toUpperCase()}</span>
                            </p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Academic Year:</span>
                            <p>${invoice.academic_year}</p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Term:</span>
                            <p>${invoice.grading_period}</p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Issue Date:</span>
                            <p>${new Date(invoice.issue_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Due Date:</span>
                            <p>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-semibold text-gray-900 mb-3">Financial Summary</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Amount Due:</span>
                            <span class="font-medium">₵${parseFloat(invoice.amount_due).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Amount Paid:</span>
                            <span class="font-medium text-green-600">₵${parseFloat(invoice.amount_paid || 0).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between border-t pt-2">
                            <span class="font-medium text-gray-900">Outstanding Balance:</span>
                            <span class="font-bold ${parseFloat(invoice.balance) > 0 ? 'text-red-600' : 'text-green-600'}">
                                ₵${parseFloat(invoice.balance).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                ${invoice.payments?.length > 0 ? `
                    <div class="border-t pt-4">
                        <h4 class="font-semibold text-gray-900 mb-3">Payment History</h4>
                        <div class="space-y-2">
                            ${invoice.payments.map(payment => `
                                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                        <span class="text-sm font-medium">₵${parseFloat(payment.amount).toFixed(2)}</span>
                                        <span class="text-xs text-gray-500 ml-2">${payment.method}</span>
                                    </div>
                                    <span class="text-xs text-gray-500">
                                        ${new Date(payment.paid_on).toLocaleDateString()}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Close</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    showPaymentDetails(paymentId) {
        const financeData = this.get('financeData');
        const payment = financeData?.payments?.find(pay => pay.id == paymentId);
        
        if (!payment) return;

        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-receipt text-green-500 mr-2"></i>
                <span class="font-semibold">Payment Details</span>
            </div>
            <div slot="content" class="space-y-4">
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium text-gray-600">Payment Amount:</span>
                            <p class="text-lg font-bold text-green-600">₵${parseFloat(payment.amount).toFixed(2)}</p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Payment Method:</span>
                            <p class="capitalize">${payment.method}</p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Payment Date:</span>
                            <p>${new Date(payment.paid_on).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Invoice Number:</span>
                            <p class="font-mono">${payment.invoice_number}</p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Academic Year:</span>
                            <p>${payment.academic_year}</p>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">Term:</span>
                            <p>${payment.grading_period}</p>
                        </div>
                        ${payment.receipt_number ? `
                            <div class="col-span-2">
                                <span class="font-medium text-gray-600">Receipt Number:</span>
                                <p class="font-mono text-blue-600">${payment.receipt_number}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Close</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    showFinanceHelp() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-question-circle text-blue-500 mr-2"></i>
                <span class="font-semibold">Understanding Your Payments</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Payment Status</h4>
                    <div class="space-y-2">
                        <div class="flex items-center">
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">PAID</span>
                            <span class="text-sm text-gray-600">Invoice has been fully paid</span>
                        </div>
                        <div class="flex items-center">
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">OPEN</span>
                            <span class="text-sm text-gray-600">Payment is still pending</span>
                        </div>
                        <div class="flex items-center">
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">DRAFT</span>
                            <span class="text-sm text-gray-600">Invoice is being prepared</span>
                        </div>
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-semibold text-gray-900 mb-2">Financial Metrics</h4>
                    <div class="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                        <div><strong>Total Invoiced:</strong> All fees you've been charged</div>
                        <div><strong>Total Paid:</strong> All payments you've made</div>
                        <div><strong>Outstanding Balance:</strong> Amount still owed</div>
                        <div><strong>Payment Rate:</strong> Percentage of invoices fully paid</div>
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-semibold text-gray-900 mb-2">Need Help?</h4>
                    <p class="text-sm text-gray-600">
                        If you have questions about your payments or need to make a payment, 
                        please contact the school's finance office or visit the cashier.
                    </p>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it!</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    prepareTableData(invoices) {
        return invoices.map(invoice => ({
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            issue_date: new Date(invoice.issue_date).toLocaleDateString(),
            academic_year: invoice.academic_year,
            grading_period: invoice.grading_period,
            amount_due: `₵${parseFloat(invoice.amount_due).toFixed(2)}`,
            amount_paid: `₵${parseFloat(invoice.amount_paid || 0).toFixed(2)}`,
            balance: `₵${parseFloat(invoice.balance).toFixed(2)}`,
            balance_raw: parseFloat(invoice.balance),
            status: invoice.status,
            status_badge: this.getStatusBadge(invoice.status),
            actions: this.getActionButtons(invoice.id)
        }));
    }

    getTableColumns() {
        return [
            {
                key: 'invoice_number',
                label: 'Invoice Number',
                sortable: true,
                searchable: true
            },
            {
                key: 'issue_date',
                label: 'Issue Date',
                sortable: true
            },
            {
                key: 'academic_year',
                label: 'Academic Year',
                sortable: true,
                searchable: true
            },
            {
                key: 'grading_period',
                label: 'Term',
                sortable: true,
                searchable: true
            },
            {
                key: 'amount_due',
                label: 'Amount Due',
                sortable: true,
                align: 'right'
            },
            {
                key: 'amount_paid',
                label: 'Amount Paid',
                sortable: true,
                align: 'right'
            },
            {
                key: 'balance',
                label: 'Balance',
                sortable: true,
                align: 'right',
                render: (value, row) => {
                    const color = row.balance_raw > 0 ? 'text-red-600' : 'text-green-600';
                    return `<span class="${color} font-medium">${value}</span>`;
                }
            },
            {
                key: 'status_badge',
                label: 'Status',
                sortable: true,
                align: 'center'
            },
            {
                key: 'actions',
                label: 'Actions',
                align: 'center',
                sortable: false
            }
        ];
    }

    getStatusBadge(status) {
        const statusConfig = {
            'paid': 'bg-green-100 text-green-800',
            'open': 'bg-yellow-100 text-yellow-800',
            'draft': 'bg-gray-100 text-gray-800'
        };
        
        const colorClass = statusConfig[status] || statusConfig['draft'];
        return `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}">
            ${status?.toUpperCase() || 'UNKNOWN'}
        </span>`;
    }

    getActionButtons(invoiceId) {
        return `
            <ui-button 
                size="sm" 
                variant="outline" 
                color="primary"
                data-action="show-invoice-details" 
                data-invoice-id="${invoiceId}">
                <i class="fas fa-eye mr-1"></i> View
            </ui-button>
        `;
    }

    render() {
        const loading = this.get('loading');
        const currentUser = this.get('currentUser');
        const financeData = this.get('financeData');
        const summaryData = this.get('summaryData');
        const selectedFilter = this.get('selectedFilter');
        
        const userName = currentUser?.name || currentUser?.first_name + ' ' + currentUser?.last_name || 'Student';
        const filteredInvoices = this.getFilteredInvoices();

        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl font-bold">My Payments</h1>
                                <button class="text-white/90 hover:text-white transition-colors" data-action="show-finance-help" title="Payment Help">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 mt-1">Track your school fees and payment history</p>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold">
                                ${loading ? '...' : (summaryData?.summary?.total_invoices || 0)}
                            </div>
                            <div class="text-blue-100 text-sm">Total Invoices</div>
                        </div>
                    </div>
                </div>

                ${!loading && summaryData ? `
                    <!-- Financial Metrics -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <!-- Total Invoiced -->
                        <div class="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                                    <i class="fas fa-file-invoice text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Total Invoiced</p>
                                    <p class="text-2xl font-bold text-gray-900">₵${summaryData.summary.total_invoiced.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Total Paid -->
                        <div class="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                                    <i class="fas fa-check-circle text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Total Paid</p>
                                    <p class="text-2xl font-bold text-green-600">₵${summaryData.summary.total_paid.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Outstanding Balance -->
                        <div class="bg-white shadow rounded-lg p-6 border-l-4 ${summaryData.summary.total_outstanding > 0 ? 'border-red-500' : 'border-gray-500'}">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full ${summaryData.summary.total_outstanding > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} mr-4">
                                    <i class="fas fa-exclamation-triangle text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Outstanding</p>
                                    <p class="text-2xl font-bold ${summaryData.summary.total_outstanding > 0 ? 'text-red-600' : 'text-gray-900'}">
                                        ₵${summaryData.summary.total_outstanding.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Rate -->
                        <div class="bg-white shadow rounded-lg p-6 border-l-4 border-purple-500">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                                    <i class="fas fa-percentage text-xl"></i>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Payment Rate</p>
                                    <p class="text-2xl font-bold text-purple-600">
                                        ${summaryData.summary.total_invoices > 0 ? 
                                            ((summaryData.summary.paid_invoices / summaryData.summary.total_invoices) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Payments -->
                    ${summaryData.recent_payments?.length > 0 ? `
                        <div class="bg-white shadow rounded-lg p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                <i class="fas fa-history mr-2 text-green-500"></i>
                                Recent Payments
                            </h3>
                            <div class="space-y-3">
                                ${summaryData.recent_payments.map(payment => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                         onclick="this.closest('app-student-finance-page').querySelector('[data-action=show-payment-details][data-payment-id=\"${payment.id}\"]')?.click()">
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                <i class="fas fa-credit-card text-green-600"></i>
                                            </div>
                                            <div>
                                                <p class="font-medium text-gray-900">₵${parseFloat(payment.amount).toFixed(2)}</p>
                                                <p class="text-sm text-gray-500">${payment.academic_year} - ${payment.grading_period}</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-sm text-gray-900">${new Date(payment.paid_on).toLocaleDateString()}</p>
                                            <p class="text-xs text-gray-500 capitalize">${payment.method}</p>
                                        </div>
                                        <button class="hidden" data-action="show-payment-details" data-payment-id="${payment.id}"></button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Outstanding Invoices -->
                    ${summaryData.outstanding_invoices?.length > 0 ? `
                        <div class="bg-white shadow rounded-lg p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                <i class="fas fa-exclamation-triangle mr-2 text-yellow-500"></i>
                                Outstanding Payments
                            </h3>
                            <div class="space-y-3">
                                ${summaryData.outstanding_invoices.map(invoice => `
                                    <div class="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div class="flex items-center">
                                            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                                                <i class="fas fa-file-invoice text-yellow-600"></i>
                                            </div>
                                            <div>
                                                <p class="font-medium text-gray-900">${invoice.invoice_number}</p>
                                                <p class="text-sm text-gray-500">${invoice.academic_year} - ${invoice.grading_period}</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="font-bold text-red-600">₵${parseFloat(invoice.balance).toFixed(2)}</p>
                                            <p class="text-xs text-gray-500">
                                                Due: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- All Invoices -->
                    <div class="bg-white shadow rounded-lg">
                        <div class="p-6 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-semibold text-gray-900">
                                    <i class="fas fa-list mr-2 text-blue-500"></i>
                                    All Invoices
                                </h3>
                                <div class="flex space-x-2">
                                    <button class="px-3 py-1 text-sm rounded-md transition-colors ${selectedFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
                                            data-action="filter-all">
                                        All
                                    </button>
                                    <button class="px-3 py-1 text-sm rounded-md transition-colors ${selectedFilter === 'paid' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}"
                                            data-action="filter-paid">
                                        Paid
                                    </button>
                                    <button class="px-3 py-1 text-sm rounded-md transition-colors ${selectedFilter === 'open' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:bg-gray-100'}"
                                            data-action="filter-pending">
                                        Pending
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        ${filteredInvoices.length > 0 ? `
                            <ui-table 
                                title=""
                                data='${JSON.stringify(this.prepareTableData(filteredInvoices))}'
                                columns='${JSON.stringify(this.getTableColumns())}'
                                sortable
                                searchable
                                search-placeholder="Search invoices..."
                                pagination
                                page-size="10"
                                bordered
                                striped
                                class="w-full">
                            </ui-table>
                        ` : `
                            <div class="p-8 text-center">
                                <i class="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                                <p class="text-gray-500">
                                    ${selectedFilter === 'all' ? 'You have no invoices yet.' : 
                                      selectedFilter === 'paid' ? 'You have no paid invoices.' : 
                                      'You have no pending invoices.'}
                                </p>
                            </div>
                        `}
                    </div>
                ` : `
                    <!-- Loading State -->
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <ui-skeleton class="h-32 w-full"></ui-skeleton>
                            <ui-skeleton class="h-32 w-full"></ui-skeleton>
                            <ui-skeleton class="h-32 w-full"></ui-skeleton>
                            <ui-skeleton class="h-32 w-full"></ui-skeleton>
                        </div>
                        <ui-skeleton class="h-64 w-full"></ui-skeleton>
                        <ui-skeleton class="h-96 w-full"></ui-skeleton>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('app-student-finance-page', StudentFinancePage);
export default StudentFinancePage;
