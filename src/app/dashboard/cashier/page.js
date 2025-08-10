import App from '@/core/App.js';
import store from '@/core/store.js';
import api from '@/services/api.js';
import '@/components/ui/Link.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Button.js';
import '@/components/ui/Card.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Input.js';
import '@/components/ui/Select.js';
import '@/components/ui/Alert.js';

/**
 * Cashier Dashboard Page
 * 
 * This page provides cashiers with access to financial management features
 * including fee schedules, invoices, payments, and receipts.
 */
class CashierPage extends App {
    constructor() {
        super();
        this.financialData = {
            totalInvoices: 0,
            totalPayments: 0,
            pendingAmount: 0,
            recentTransactions: []
        };
        this.isLoading = true;
        this.error = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        document.title = 'Cashier Dashboard | School System';
        
        // Subscribe to store changes
        this.unsubscribe = store.subscribe((newState) => {
            this.set('isAuthenticated', newState.isAuthenticated);
        });

        await this.loadFinancialData();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    async loadFinancialData() {
        try {
            this.set('isLoading', true);
            this.set('error', null);

            // Load financial summary data
            const [invoicesResponse, paymentsResponse] = await Promise.all([
                api.get('/finance/invoices'),
                api.get('/finance/payments')
            ]);

            const invoices = invoicesResponse.data?.data || [];
            const payments = paymentsResponse.data?.data || [];

            // Calculate financial summary
            const totalInvoices = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount || 0), 0);
            const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
            const pendingAmount = totalInvoices - totalPayments;

            // Get recent transactions (last 5)
            const recentTransactions = [...invoices, ...payments]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            this.set('financialData', {
                totalInvoices,
                totalPayments,
                pendingAmount,
                recentTransactions
            });

        } catch (error) {
            console.error('Error loading financial data:', error);
            this.set('error', 'Failed to load financial data. Please try again.');
        } finally {
            this.set('isLoading', false);
        }
    }

    setupEventListeners() {
        this.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="refresh"]')) {
                this.loadFinancialData();
            }
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS'
        }).format(amount || 0);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-GH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    render() {
        const { financialData, isLoading, error } = this.get();
        const { totalInvoices, totalPayments, pendingAmount, recentTransactions } = financialData;

        if (isLoading) {
            return `
                <div class="flex items-center justify-center h-64">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            `;
        }

        if (error) {
            return `
                <div class="p-6">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-medium text-red-800">Error</h3>
                                <div class="mt-2 text-sm text-red-700">${error}</div>
                            </div>
                        </div>
                    </div>
                    <button data-action="refresh" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                        Try Again
                    </button>
                </div>
            `;
        }

        return `
            <div class="p-6 space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Cashier Dashboard</h1>
                        <p class="text-gray-600">Manage financial transactions and student accounts</p>
                    </div>
                    <button data-action="refresh" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Refresh
                    </button>
                </div>

                <!-- Financial Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div class="flex items-center">
                            <div class="p-2 bg-blue-100 rounded-lg">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Total Invoices</p>
                                <p class="text-2xl font-bold text-gray-900">${this.formatCurrency(totalInvoices)}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <div class="flex items-center">
                            <div class="p-2 bg-green-100 rounded-lg">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Total Payments</p>
                                <p class="text-2xl font-bold text-gray-900">${this.formatCurrency(totalPayments)}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                        <div class="flex items-center">
                            <div class="p-2 bg-yellow-100 rounded-lg">
                                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Pending Amount</p>
                                <p class="text-2xl font-bold text-gray-900">${this.formatCurrency(pendingAmount)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <a href="/dashboard/cashier/invoices" class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                            <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span class="text-sm font-medium text-gray-700">Manage Invoices</span>
                        </a>

                        <a href="/dashboard/cashier/payments" class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                            <svg class="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                            <span class="text-sm font-medium text-gray-700">Process Payments</span>
                        </a>

                        <a href="/dashboard/cashier/receipts" class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                            <svg class="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span class="text-sm font-medium text-gray-700">Generate Receipts</span>
                        </a>

                        <a href="/dashboard/cashier/schedules" class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
                            <svg class="w-8 h-8 text-orange-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span class="text-sm font-medium text-gray-700">Fee Schedules</span>
                        </a>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h2 class="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${recentTransactions.length > 0 ? recentTransactions.map(transaction => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                transaction.type === 'invoice' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }">
                                                ${transaction.type === 'invoice' ? 'Invoice' : 'Payment'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${transaction.student_name || 'N/A'}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${this.formatCurrency(transaction.amount)}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ${this.formatDate(transaction.created_at)}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                transaction.status === 'paid' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : transaction.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }">
                                                ${transaction.status || 'Unknown'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                                            No recent transactions found
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('cashier-page', CashierPage);
export default CashierPage;
