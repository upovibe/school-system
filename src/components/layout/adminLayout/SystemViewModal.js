import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';

/**
 * System View Modal Component
 * 
 * A modal component for viewing system setting details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class SystemViewModal extends HTMLElement {
    constructor() {
        super();
        this.settingData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Close)
        this.addEventListener('confirm', () => {
            this.close();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.settingData = null;
    }

    // Set setting data for viewing
    setSettingData(settingData) {
        this.settingData = settingData;
        // Re-render the modal with the new data
        this.render();
    }

    // Helper method to get proper image URL
    getImageUrl(imagePath) {
        if (!imagePath) return null;
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        
        // If it's a relative path without /, construct the URL
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    // Render the appropriate value display based on setting type
    renderValueDisplay() {
        const settingType = this.settingData?.setting_type || 'text';
        const currentValue = this.settingData?.setting_value || '';

        switch (settingType) {
            case 'boolean':
                const boolValue = currentValue === '1' || currentValue === 'true' || currentValue === true;
                return `
                    <div class="flex items-center gap-2">
                        <ui-badge color="${boolValue ? 'success' : 'error'}">
                            <i class="fas fa-${boolValue ? 'check' : 'times'} mr-1"></i>
                            ${boolValue ? 'True' : 'False'}
                        </ui-badge>
                    </div>
                `;
            
            case 'color':
                return `
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded border border-gray-300" style="background-color: ${currentValue || '#000000'}"></div>
                        <span class="font-mono text-sm">${currentValue || '#000000'}</span>
                    </div>
                `;
            
            case 'file':
            case 'image':
                if (currentValue) {
                    const isImage = settingType === 'image';
                    return `
                        <div class="space-y-2">
                            ${isImage ? `
                                <div class="relative">
                                    <img src="${this.getImageUrl(currentValue)}" 
                                         alt="Setting Value" 
                                         class="w-full h-48 object-cover rounded-lg border border-gray-200"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                    <div class="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                        <div class="text-center">
                                            <i class="fas fa-image text-gray-400 text-2xl mb-2"></i>
                                            <p class="text-gray-500 text-sm">Image not found</p>
                                        </div>
                                    </div>
                                </div>
                            ` : `
                                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <i class="fas fa-file text-gray-400 text-2xl mb-2"></i>
                                    <p class="text-gray-500 text-sm">File uploaded</p>
                                </div>
                            `}
                            <div class="flex justify-end">
                                <button onclick="window.open('${this.getImageUrl(currentValue)}', '_blank')" 
                                        class="text-blue-500 hover:text-blue-700 text-xs">
                                    <i class="fas fa-external-link-alt mr-1"></i>Open
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                            <i class="fas fa-file text-gray-400 text-2xl mb-2"></i>
                            <p class="text-gray-500 text-sm">No file uploaded</p>
                        </div>
                    `;
                }
            
            case 'textarea':
            case 'select':
                return `
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <pre class="text-sm text-gray-900 whitespace-pre-wrap">${currentValue || 'No value set'}</pre>
                    </div>
                `;
            
            default:
                return `
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <span class="text-sm text-gray-900">${currentValue || 'No value set'}</span>
                    </div>
                `;
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View System Setting</div>
                
                <div>
                    ${this.settingData ? `
                        <!-- Setting Header -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.settingData.setting_key || 'N/A'}</h3>
                            <ui-badge color="secondary"><i class="fas fa-tag mr-1"></i>${this.settingData.category || 'N/A'}</ui-badge>
                            <ui-badge color="${this.settingData.is_active ? 'success' : 'error'}">
                                ${this.settingData.is_active ? '<i class="fas fa-check mr-1"></i> Active' : '<i class="fas fa-times mr-1"></i> Inactive'}
                            </ui-badge>
                        </div>

                        <!-- Setting Type -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-cog text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Setting Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-tag mr-1"></i>Setting Type
                                    </label>
                                    <ui-badge color="info">${this.settingData.setting_type || 'text'}</ui-badge>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-folder mr-1"></i>Category
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.settingData.category || 'general'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Setting Value -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-value text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Setting Value</h4>
                            </div>
                            ${this.renderValueDisplay()}
                        </div>

                        <!-- Description -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Description</h4>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <p class="text-gray-900 text-sm leading-relaxed">
                                    ${this.settingData.description || 'No description provided'}
                                </p>
                            </div>
                        </div>

                        <!-- Timestamps -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-clock text-orange-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-plus mr-1"></i>Created
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.settingData.created_at ? new Date(this.settingData.created_at).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.settingData.updated_at ? new Date(this.settingData.updated_at).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No setting data available</p>
                        </div>
                    `}
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('system-view-modal', SystemViewModal);
export default SystemViewModal;
