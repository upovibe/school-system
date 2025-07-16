import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';

/**
 * Log View Modal Component
 * 
 * A modal component for viewing detailed log information
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class LogViewModal extends HTMLElement {
    constructor() {
        super();
        this.logData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    // Set log data for viewing
    setLogData(logData) {
        this.logData = logData;
        // Re-render the modal with the new data
        this.render();
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    render() {
        if (!this.logData) {
            return '';
        }

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleString();
        };

        const truncateText = (text, maxLength = 100) => {
            if (!text) return 'N/A';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };

        const formatMetadata = (metadata) => {
            if (!metadata) return null;
            try {
                if (typeof metadata === 'string') {
                    return JSON.parse(metadata);
                }
                return metadata;
            } catch (e) {
                return metadata;
            }
        };

        const additionalData = formatMetadata(this.logData.metadata || this.logData.additional_data);

        return `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="center" 
                close-button="true"
                size="lg">
                <div slot="title">Log Details</div>
                <div class="space-y-6">
                    <!-- Basic Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Log ID</label>
                            <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                ${this.logData.id}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">User</label>
                            <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                ${this.logData.user_name || 'System'}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Action</label>
                            <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                ${this.logData.action || 'N/A'}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                            <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                ${this.logData.ip_address || 'N/A'}
                            </div>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md min-h-[60px]">
                                ${this.logData.description || 'No description available'}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Timestamps -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                            <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                ${formatDate(this.logData.created_at)}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                            <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                ${this.logData.updated_at ? formatDate(this.logData.updated_at) : 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <!-- User Agent -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                        <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            ${truncateText(this.logData.user_agent, 200)}
                        </div>
                    </div>
                    
                    <!-- Additional Data -->
                    ${additionalData ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Additional Data</label>
                            <div class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                <pre class="whitespace-pre-wrap text-xs">${JSON.stringify(additionalData, null, 2)}</pre>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('log-view-modal', LogViewModal);
export default LogViewModal; 