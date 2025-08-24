import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * Record View Dialog Component
 * 
 * Displays detailed information about an archived academic year record
 */
class RecordViewDialog extends HTMLElement {
    constructor() {
        super();
        this.recordData = null;
        this.exportData = null;
        this.loading = false;
    }

    connectedCallback() {
        this.render();
        this.addEventListener('click', this.handleActions.bind(this));
    }

    setRecordData(record) {
        this.recordData = record;
        this.render();
    }

    async handleActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        
        switch (action) {
            case 'export-record':
                await this.exportRecord();
                break;
            case 'close-dialog':
                this.close();
                break;
        }
    }

    async exportRecord() {
        if (!this.recordData) return;
        
        try {
            this.setLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                this.showToast('Authentication Error', 'Please log in to export records', 'error');
                return;
            }

            const response = await api.withToken(token).get(`/academic-year-records/${this.recordData.id}/export`);
            this.exportData = response.data.data;
            
            // Create and download the export file
            this.downloadExport();
            
        } catch (error) {
            console.error('❌ Error exporting record:', error);
            this.showToast('Export Error', error.response?.data?.message || 'Failed to export record', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    downloadExport() {
        if (!this.exportData) return;
        
        // Create JSON file content
        const content = JSON.stringify(this.exportData, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `academic-year-record-${this.exportData.archive_info?.year_code || this.recordData.year_code}-${this.recordData.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Export Successful', 'Record data exported successfully', 'success');
    }

    setLoading(loading) {
        this.loading = loading;
        this.render();
    }

    showToast(title, message, variant = 'info') {
        // Dispatch custom event for toast notification
        this.dispatchEvent(new CustomEvent('show-toast', {
            detail: { title, message, variant }
        }));
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    render() {
        if (!this.recordData) {
            this.innerHTML = `
                <ui-dialog open>
                    <div slot="header" class="flex items-center">
                        <i class="fas fa-archive text-green-500 mr-2"></i>
                        <span class="font-semibold">Record Details</span>
                    </div>
                    <div slot="content" class="text-center py-8">
                        <p class="text-gray-500">No record data available</p>
                    </div>
                    <div slot="footer" class="flex justify-end">
                        <ui-button color="primary" data-action="close-dialog">Close</ui-button>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        const record = this.recordData;
        const archiveDate = new Date(record.archive_date).toLocaleString();
        
        this.innerHTML = `
            <ui-dialog open>
                <div slot="header" class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-archive text-green-500 mr-2"></i>
                        <span class="font-semibold">Academic Year Record Details</span>
                    </div>
                    <button class="text-gray-400 hover:text-gray-600" data-action="close-dialog">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div slot="content" class="space-y-6">
                    <!-- Archive Information -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">Archive Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Year Code</label>
                                <p class="text-lg font-semibold text-gray-800">${record.year_code}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Record Type</label>
                                <p class="text-lg font-semibold text-gray-800">${record.record_type}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Total Records</label>
                                <p class="text-lg font-semibold text-gray-800">${record.total_records}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Archive Date</label>
                                <p class="text-lg font-semibold text-gray-800">${archiveDate}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Archived By</label>
                                <p class="text-lg font-semibold text-gray-800">${record.archived_by_name || 'System'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600">Status</label>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Archived
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Notes -->
                    ${record.notes ? `
                        <div class="bg-blue-50 rounded-lg p-4">
                            <h3 class="text-lg font-semibold text-blue-800 mb-2">Notes</h3>
                            <p class="text-blue-700">${record.notes}</p>
                        </div>
                    ` : ''}

                    <!-- Data Summary -->
                    <div class="bg-green-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-green-800 mb-3">Archived Data Summary</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div class="bg-white rounded-lg p-3">
                                <div class="text-2xl font-bold text-green-600">${record.total_records}</div>
                                <div class="text-sm text-green-600">Total Records</div>
                            </div>
                            <div class="bg-white rounded-lg p-3">
                                <div class="text-2xl font-bold text-blue-600">${record.record_type === 'complete_year_snapshot' ? 'Complete' : 'Partial'}</div>
                                <div class="text-sm text-blue-600">Archive Type</div>
                            </div>
                            <div class="bg-white rounded-lg p-3">
                                <div class="text-2xl font-bold text-purple-600">${record.year_code}</div>
                                <div class="text-sm text-purple-600">Academic Year</div>
                            </div>
                            <div class="bg-white rounded-lg p-3">
                                <div class="text-2xl font-bold text-orange-600">${record.id}</div>
                                <div class="text-sm text-orange-600">Record ID</div>
                            </div>
                        </div>
                    </div>

                    <!-- Export Section -->
                    <div class="bg-yellow-50 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-yellow-800 mb-3">Export Options</h3>
                        <p class="text-yellow-700 mb-3">Download this archived record for offline analysis or backup purposes.</p>
                        <div class="flex gap-3">
                            <ui-button 
                                data-action="export-record" 
                                color="primary" 
                                ${this.loading ? 'disabled' : ''}
                                class="flex items-center gap-2">
                                <i class="fas fa-download"></i>
                                ${this.loading ? 'Exporting...' : 'Export Record Data'}
                            </ui-button>
                        </div>
                    </div>
                </div>
                
                <div slot="footer" class="flex justify-end gap-3">
                    <ui-button color="secondary" data-action="close-dialog">Close</ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('record-view-dialog', RecordViewDialog);
export default RecordViewDialog;
