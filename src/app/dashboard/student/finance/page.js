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
        this.activeTab = 'invoices';
        // Initialize state
        this.set('loading', true);
        this.set('currentUser', null);
        this.set('financeData', null);
        this.set('summaryData', null);
        this.set('activeTab', 'invoices');
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'My Payments | Student Dashboard';
        this.loadAll();
        this.addEventListener('click', this.handleButtonClick.bind(this));
        this.addEventListener('table-row-click', this.handleTableRowClick.bind(this));
    }

    handleButtonClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        
        switch (action) {
            case 'show-finance-help':
                this.showFinanceHelp();
                break;
            case 'switch-tab':
                const tab = button.getAttribute('data-tab');
                this.switchTab(tab);
                break;
        }
    }

    handleTableRowClick(event) {
        const { detail } = event;
        const activeTab = this.get('activeTab');
        
        if (activeTab === 'invoices') {
            const invoiceId = detail.row.id;
            this.showInvoiceDetails(invoiceId);
        } else if (activeTab === 'payments') {
            const paymentId = detail.row.id;
            this.showPaymentDetails(paymentId);
        }
    }

    switchTab(tab) {
        this.set('activeTab', tab);
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

    getFilteredInvoices() {
        const financeData = this.get('financeData');
        return financeData?.invoices || [];
    }

    getFilteredPayments() {
        const financeData = this.get('financeData');
        return financeData?.payments || [];
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
            status_badge: this.getStatusBadge(invoice.status)
        }));
    }

    preparePaymentTableData(payments) {
        return payments.map(payment => ({
            id: payment.id,
            invoice_number: payment.invoice_number,
            amount: `₵${parseFloat(payment.amount).toFixed(2)}`,
            amount_raw: parseFloat(payment.amount),
            method: payment.method?.charAt(0).toUpperCase() + payment.method?.slice(1) || 'Unknown',
            paid_on: new Date(payment.paid_on).toLocaleDateString(),
            academic_year: payment.academic_year,
            grading_period: payment.grading_period,
            receipt_number: payment.receipt_number || 'N/A'
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
            }
        ];
    }

    getPaymentTableColumns() {
        return [
            {
                key: 'invoice_number',
                label: 'Invoice Number',
                sortable: true,
                searchable: true
            },
            {
                key: 'amount',
                label: 'Amount Paid',
                sortable: true,
                align: 'right',
                render: (value, row) => {
                    return `<span class="text-green-600 font-medium">${value}</span>`;
                }
            },
            {
                key: 'method',
                label: 'Payment Method',
                sortable: true,
                searchable: true
            },
            {
                key: 'paid_on',
                label: 'Payment Date',
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
                key: 'receipt_number',
                label: 'Receipt Number',
                sortable: true,
                searchable: true
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



    render() {
        const loading = this.get('loading');
        const currentUser = this.get('currentUser');
        const financeData = this.get('financeData');
        const summaryData = this.get('summaryData');
        const activeTab = this.get('activeTab');
        
        const userName = currentUser?.name || currentUser?.first_name + ' ' + currentUser?.last_name || 'Student';
        const filteredInvoices = this.getFilteredInvoices();
        const filteredPayments = this.getFilteredPayments();

        return `
            <div class="space-y-6">
                <!-- Enhanced Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">My Payments</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-finance-help" title="Payment Help">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Track your school fees and payment history</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-sm sm:text-base font-semibold">Total Invoices</div>
                                <div class="text-2xl sm:text-3xl font-bold">
                                    ${loading ? '...' : (summaryData?.summary?.total_invoices || 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${!loading && summaryData ? `
                        <!-- Enhanced Summary Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="flex items-center">
                                    <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                        <i class="fas fa-file-invoice text-white text-lg sm:text-xl"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-lg font-semibold">₵${summaryData.summary.total_invoiced.toFixed(2)}</div>
                                        <div class="text-blue-100 text-xs sm:text-sm">Total Invoiced</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="flex items-center">
                                    <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                        <i class="fas fa-check-circle text-white text-lg sm:text-xl"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-lg font-semibold">₵${summaryData.summary.total_paid.toFixed(2)}</div>
                                        <div class="text-blue-100 text-xs sm:text-sm">Total Paid</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="flex items-center">
                                    <div class="size-10 flex items-center justify-center ${summaryData.summary.total_outstanding > 0 ? 'bg-red-500' : 'bg-gray-500'} rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                        <i class="fas fa-exclamation-triangle text-white text-lg sm:text-xl"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-lg font-semibold">₵${summaryData.summary.total_outstanding.toFixed(2)}</div>
                                        <div class="text-blue-100 text-xs sm:text-sm">Outstanding</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="flex items-center">
                                    <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                        <i class="fas fa-percentage text-white text-lg sm:text-xl"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-lg font-semibold">
                                            ${summaryData.summary.total_invoiced > 0 ? 
                                                ((summaryData.summary.total_paid / summaryData.summary.total_invoiced) * 100).toFixed(1) : 0}%
                                        </div>
                                        <div class="text-blue-100 text-xs sm:text-sm">Payment Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <!-- Loading State for Header Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="animate-pulse">
                                    <div class="h-6 bg-white bg-opacity-30 rounded mb-2"></div>
                                    <div class="h-4 bg-white bg-opacity-20 rounded"></div>
                                </div>
                            </div>
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="animate-pulse">
                                    <div class="h-6 bg-white bg-opacity-30 rounded mb-2"></div>
                                    <div class="h-4 bg-white bg-opacity-20 rounded"></div>
                                </div>
                            </div>
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="animate-pulse">
                                    <div class="h-6 bg-white bg-opacity-30 rounded mb-2"></div>
                                    <div class="h-4 bg-white bg-opacity-20 rounded"></div>
                                </div>
                            </div>
                            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                                <div class="animate-pulse">
                                    <div class="h-6 bg-white bg-opacity-30 rounded mb-2"></div>
                                    <div class="h-4 bg-white bg-opacity-20 rounded"></div>
                                </div>
                            </div>
                        </div>
                    `}
                </div>

                ${!loading && summaryData ? `



                    <!-- Tabbed Table -->
                    <div class="bg-white shadow rounded-lg">
                        <!-- Tab Navigation -->
                        <div class="border-b border-gray-200">
                            <nav class="flex space-x-8 px-6 pt-6" aria-label="Tabs">
                                <button 
                                    class="py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === 'invoices' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }"
                                    data-action="switch-tab"
                                    data-tab="invoices">
                                    <i class="fas fa-file-invoice mr-2"></i>
                                    Invoices (${filteredInvoices.length})
                                </button>
                                <button 
                                    class="py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === 'payments' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }"
                                    data-action="switch-tab"
                                    data-tab="payments">
                                    <i class="fas fa-credit-card mr-2"></i>
                                    Payment History (${filteredPayments.length})
                                </button>
                            </nav>
                        </div>

                        <!-- Tab Content -->
                        <div class="p-6">
                            ${activeTab === 'invoices' ? `
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
                                        print
                                        refresh
                                        clickable
                                        row-clickable="true"
                                        class="w-full">
                                    </ui-table>
                                ` : `
                                    <div class="p-8 text-center">
                                        <i class="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                                        <h3 class="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                                        <p class="text-gray-500">You have no invoices yet.</p>
                                    </div>
                                `}
                            ` : `
                                ${filteredPayments.length > 0 ? `
                                    <ui-table 
                                        title=""
                                        data='${JSON.stringify(this.preparePaymentTableData(filteredPayments))}'
                                        columns='${JSON.stringify(this.getPaymentTableColumns())}'
                                        sortable
                                        searchable
                                        search-placeholder="Search payments..."
                                        pagination
                                        page-size="10"
                                        bordered
                                        striped
                                        print
                                        refresh
                                        clickable
                                        row-clickable="true"
                                        class="w-full">
                                    </ui-table>
                                ` : `
                                    <div class="p-8 text-center">
                                        <i class="fas fa-credit-card text-4xl text-gray-300 mb-4"></i>
                                        <h3 class="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                                        <p class="text-gray-500">You have no payment records yet.</p>
                                    </div>
                                `}
                            `}
                        </div>
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
