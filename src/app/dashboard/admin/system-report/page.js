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
            <div class="bg-white rounded-lg shadow-lg p-8 m-4">
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
                        ${logs && logs.length > 0 ? `
                            <ui-table 
                                title="System Activity Logs"
                                data='${JSON.stringify(tableData)}'
                                columns='${JSON.stringify(tableColumns)}'
                                sortable
                                searchable
                                search-placeholder="Search logs..."
                                pagination
                                page-size="15"
                                refresh
                                print
                                export
                                bordered
                                striped
                                clickable
                                class="w-full">
                            </ui-table>
                        ` : `
                            <div class="text-center py-8 text-gray-500">
                                <p>No system logs found</p>
                            </div>
                        `}
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
