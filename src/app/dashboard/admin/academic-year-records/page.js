import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/RecordViewDialog.js';
import api from '@/services/api.js';

/**
 * Academic Year Records Page
 * 
 * Displays archived academic year records using Table component
 */
class AcademicYearRecordsPage extends App {
    constructor() {
        super();
        this.records = null;
        this.loading = false;
        this.showViewDialog = false;
        this.viewRecordData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Academic Year Records | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-row-click', this.onRowClick.bind(this));
        this.addEventListener('table-refresh', this.onRefresh.bind(this));
    }

    renderHeader() {
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Academic Year Records</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-records-info" title="About Academic Year Records">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>                                
                            <button 
                                onclick="this.closest('app-academic-year-records-page').loadData()"
                                class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                title="Refresh data">
                                <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                            </button>                                
                            </div>
                            <p class="text-green-100 text-base sm:text-lg">Archived snapshots of completed academic years</p>
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
        if (action === 'show-records-info') {
            this.showRecordsInfo();
        }
    }

    showRecordsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center"> 
                <i class="fas fa-archive text-green-500 mr-2"></i>
                <span class="font-semibold">About Academic Year Records</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">Browse archived academic year data for historical reference and compliance. Click a row to view details.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between"><span class="text-sm font-medium">Year Code</span><span class="text-sm text-gray-600">Academic year identifier (e.g., 2023-2024)</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Record Type</span><span class="text-sm text-gray-600">Type of data archived</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Total Records</span><span class="text-sm text-gray-600">Number of items archived</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Archive Date</span><span class="text-sm text-gray-600">When it occurred</span></div>
                    <div class="flex justify-between"><span class="text-sm font-medium">Archived By</span><span class="text-sm text-gray-600">User who performed the archive</span></div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
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
                    message: 'Please log in to view academic year records',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Load academic year records data
            const recordsResponse = await api.withToken(token).get('/academic-year-records');
            
            this.set('records', recordsResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading academic year records:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load academic year records',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onRowClick(event) {
        const { detail } = event;
        const viewRecord = this.get('records').find(record => record.id === detail.row.id);
        
        if (viewRecord) {
            this.closeAllDialogs();
            this.set('viewRecordData', viewRecord);
            this.set('showViewDialog', true);
            
            setTimeout(() => {
                const viewDialog = this.querySelector('record-view-dialog');
                
                if (viewDialog) {
                    viewDialog.setRecordData(viewRecord);
                    viewDialog.open();
                }
            }, 0);
        }
    }

    async onViewRecordDetails(recordId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view record details',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const response = await api.withToken(token).get(`/academic-year-records/${recordId}`);
            const recordData = response.data.data;
            
            this.closeAllDialogs();
            this.set('viewRecordData', recordData);
            this.set('showViewDialog', true);
            setTimeout(() => {
                const viewDialog = this.querySelector('record-view-dialog');
                if (viewDialog) {
                    viewDialog.setRecordData(recordData);
                }
            }, 0);
            
        } catch (error) {
            console.error('❌ Error loading record details:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load record details',
                variant: 'error',
                duration: 3000
            });
        }
    }

    onRefresh(event) {
        this.loadData();
    }

    formatRecordType(recordType) {
        if (!recordType) return '—';
        
        // Convert snake_case to Title Case
        return recordType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Update table data without full page reload
    updateTableData() {
        const records = this.get('records');
        if (!records) return;

        // Prepare table data
        const tableData = records.map((record, index) => ({
            id: record.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            year_code: record.year_code,
            record_type: this.formatRecordType(record.record_type),
            total_records: String(record.total_records || 0),
            archive_date: new Date(record.archive_date).toLocaleDateString(),
            archived_by: record.archived_by_name || 'System',
            notes: record.notes || '—'
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
        this.set('viewRecordData', null);
    }

    render() {
        const records = this.get('records');
        const loading = this.get('loading');
        const showViewDialog = this.get('showViewDialog');
        
        // Prepare table data and columns for records
        const tableData = records ? records.map((record, index) => ({
            id: record.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            year_code: record.year_code,
            record_type: this.formatRecordType(record.record_type),
            total_records: String(record.total_records || 0),
            archive_date: new Date(record.archive_date).toLocaleDateString(),
            archived_by: record.archived_by_name || 'System',
            notes: record.notes || '—'
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'year_code', label: 'Year Code' },
            { key: 'record_type', label: 'Record Type' },
            { key: 'total_records', label: 'Total Records', html: false },
            { key: 'archive_date', label: 'Archive Date' },
            { key: 'archived_by', label: 'Archived By' },
            { key: 'notes', label: 'Notes' }
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
                    <!-- Academic Year Records Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Archived Academic Year Records"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search records..."
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
            
            <!-- View Record Dialog -->
            <record-view-dialog id="view-dialog" ${showViewDialog ? 'open' : ''}></record-view-dialog>
        `;
    }
}

customElements.define('app-academic-year-records-page', AcademicYearRecordsPage);
export default AcademicYearRecordsPage;
