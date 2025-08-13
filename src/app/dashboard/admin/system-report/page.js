import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/LogViewDialog.js';
import api from '@/services/api.js';

/**
 * System Report Page
 * 
 * Displays system logs data using Table component
 */
class SystemReportPage extends App {
    constructor() {
        super();
        this.logs = null;
        this.loading = false;
        this.showViewDialog = false;
        this.viewLogData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'System Reports | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-row-click', this.onRowClick.bind(this));
        this.addEventListener('table-refresh', this.onRefresh.bind(this));
        
        // Listen for dialog opened event to pass data
        this.addEventListener('dialog-opened', (event) => {
            const dialog = event.target;
            if (dialog.tagName === 'LOG-VIEW-DIALOG') {
                const viewLogData = this.get('viewLogData');
                if (viewLogData) {
                    dialog.setLogData(viewLogData);
                }
            }
        });
    }

    renderHeader() {
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">System Reports</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-system-reports-info" title="About System Reports">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-indigo-100 text-base sm:text-lg">Audit logs of key actions across the platform</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-system-reports-info') {
            this.showSystemReportsInfo();
        }
    }

    showSystemReportsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot=\"header\" class=\"flex items-center\"> 
                <i class=\"fas fa-clipboard-list text-indigo-500 mr-2\"></i>
                <span class=\"font-semibold\">About System Reports</span>
            </div>
            <div slot=\"content\" class=\"space-y-4\">
                <p class=\"text-gray-700\">Browse system activity logs for auditing and troubleshooting. Click a row to view details.</p>
                <div class=\"bg-gray-50 rounded-lg p-4 space-y-2\">
                    <div class=\"flex justify-between\"><span class=\"text-sm font-medium\">User</span><span class=\"text-sm text-gray-600\">Actor that performed the action</span></div>
                    <div class=\"flex justify-between\"><span class=\"text-sm font-medium\">Action & Description</span><span class=\"text-sm text-gray-600\">What happened, summarized</span></div>
                    <div class=\"flex justify-between\"><span class=\"text-sm font-medium\">IP Address</span><span class=\"text-sm text-gray-600\">Source of the request</span></div>
                    <div class=\"flex justify-between\"><span class=\"text-sm font-medium\">Timestamp</span><span class=\"text-sm text-gray-600\">When it occurred</span></div>
                </div>
            </div>
            <div slot=\"footer\" class=\"flex justify-end\">
                <ui-button color=\"primary\" onclick=\"this.closest('ui-dialog').close()\">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    async loadData() {
        try {
            this.set('loading', true);
            
            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view logs',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Load logs data
            const logsResponse = await api.withToken(token).get('/logs');
            
            this.set('logs', logsResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading logs:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load system logs',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onRowClick(event) {
        console.log('🔍 Row click event received:', event);
        console.log('🔍 Event detail:', event.detail);
        
        const { detail } = event;
        const viewLog = this.get('logs').find(log => log.id === detail.row.id);
        
        console.log('🔍 Found log:', viewLog);
        
        if (viewLog) {
            console.log('🔍 Closing all dialogs...');
            this.closeAllDialogs();
            
            console.log('🔍 Setting view log data...');
            this.set('viewLogData', viewLog);
            
            console.log('🔍 Setting show view dialog to true...');
            this.set('showViewDialog', true);
            
            console.log('🔍 Current showViewDialog state:', this.get('showViewDialog'));
            
            setTimeout(() => {
                console.log('🔍 Looking for log-view-dialog element...');
                const viewDialog = this.querySelector('log-view-dialog');
                console.log('🔍 Found dialog element:', viewDialog);
                
                if (viewDialog) {
                    console.log('🔍 Setting log data to dialog...');
                    viewDialog.setLogData(viewLog);
                    console.log('🔍 Opening dialog...');
                    viewDialog.open();
                    console.log('🔍 Dialog should now be open');
                } else {
                    console.log('❌ Dialog element not found!');
                }
            }, 0);
        } else {
            console.log('❌ Log not found for ID:', detail.row.id);
        }
    }

    async onViewLogDetails(logId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view log details',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const response = await api.withToken(token).get(`/logs/${logId}`);
            const logData = response.data.data;
            
            this.closeAllDialogs();
            this.set('viewLogData', logData);
            this.set('showViewDialog', true);
            setTimeout(() => {
                const viewDialog = this.querySelector('log-view-dialog');
                if (viewDialog) {
                    viewDialog.setLogData(logData);
                }
            }, 0);
            
        } catch (error) {
            console.error('❌ Error loading log details:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load log details',
                variant: 'error',
                duration: 3000
            });
        }
    }

    onRefresh(event) {
        this.loadData();
    }

    // Update table data without full page reload
    updateTableData() {
        const logs = this.get('logs');
        if (!logs) return;

        // Prepare table data
        const tableData = logs.map((log, index) => ({
            id: log.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            user: log.user_name || 'System',
            action: log.action,
            description: log.description,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            created: new Date(log.created_at).toLocaleString(),
        }));

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    // Close all dialogs
    closeAllDialogs() {
        this.set('showViewDialog', false);
        this.set('viewLogData', null);
    }

    render() {
        const logs = this.get('logs');
        const loading = this.get('loading');
        const showViewDialog = this.get('showViewDialog');
        
        // Prepare table data and columns for logs
        const tableData = logs ? logs.map((log, index) => ({
            id: log.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            user: log.user_name || 'System',
            action: log.action,
            description: log.description,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            created: new Date(log.created_at).toLocaleString(),
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'user', label: 'User' },
            { key: 'action', label: 'Action' },
            { key: 'description', label: 'Description' },
            { key: 'ip_address', label: 'IP Address', html: false },
            { key: 'created', label: 'Timestamp' }
        ];
        
        return `
            ${this.renderHeader()}
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- System Logs Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="System Activity Logs"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search logs..."
                            pagination
                            page-size="50"
                            refresh
                            print
                            export
                            bordered
                            striped
                            clickable
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>
            
            <!-- View Log Dialog -->
            <log-view-dialog id="view-dialog" ${showViewDialog ? 'open' : ''}></log-view-dialog>
        `;
    }
}

customElements.define('app-system-report-page', SystemReportPage);
export default SystemReportPage;
