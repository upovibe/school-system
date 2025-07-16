import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';

/**
 * User Role View Modal Component
 * 
 * A modal component for viewing user role details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class UserRoleViewModal extends HTMLElement {
    constructor() {
        super();
        this.roleData = null;
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

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.roleData = null;
        this.render();
    }

    // Set user role data for viewing
    setUserRoleData(roleData) {
        this.roleData = { ...roleData };
        this.render();
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    render() {
        if (!this.roleData) {
            this.innerHTML = `
                <ui-modal 
                    title="View User Role"
                    size="md"
                    ${this.hasAttribute('open') ? 'open' : ''}>
                    
                    <div class="text-center py-8 text-gray-500">
                        <p>No role data available</p>
                    </div>

                    <div slot="footer" class="flex justify-end space-x-3">
                        <ui-button 
                            variant="secondary"
                            onclick="this.closest('user-role-view-modal').close()">
                            Close
                        </ui-button>
                    </div>
                </ui-modal>
            `;
            return;
        }

        this.innerHTML = `
            <ui-modal 
                title="View User Role"
                size="md"
                ${this.hasAttribute('open') ? 'open' : ''}>
                
                <div class="space-y-6">
                    <!-- Role ID -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Role ID
                        </label>
                        <p class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            ${this.roleData.id || 'N/A'}
                        </p>
                    </div>

                    <!-- Role Name -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Role Name
                        </label>
                        <p class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            ${this.roleData.name || 'N/A'}
                        </p>
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <p class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md min-h-[60px]">
                            ${this.roleData.description || 'No description provided'}
                        </p>
                    </div>

                    <!-- Created Date -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Created Date
                        </label>
                        <p class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            ${this.formatDate(this.roleData.created_at)}
                        </p>
                    </div>

                    <!-- Updated Date -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Last Updated
                        </label>
                        <p class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            ${this.formatDate(this.roleData.updated_at)}
                        </p>
                    </div>
                </div>

                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button 
                        variant="secondary"
                        onclick="this.closest('user-role-view-modal').close()">
                        Close
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('user-role-view-modal', UserRoleViewModal);
export default UserRoleViewModal; 