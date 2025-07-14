import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Page Delete Dialog Component
 * 
 * A dialog component for confirming page deletions in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - page-deleted: Fired when a page is successfully deleted
 * - dialog-closed: Fired when dialog is closed
 */
class PageDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.isOpen = false;
        this.pageData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.updateOpenState();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && name === 'open') {
            this.updateOpenState();
        }
    }

    setupEventListeners() {
        // Listen for dialog close events
        this.addEventListener('dialog-close', () => {
            this.close();
        });

        // Listen for dialog confirm/cancel events
        this.addEventListener('confirm', () => {
            this.confirmDelete();
        });

        this.addEventListener('cancel', () => {
            this.cancelDelete();
        });
    }

    updateOpenState() {
        const shouldBeOpen = this.hasAttribute('open');
        
        if (shouldBeOpen && !this.isOpen) {
            this.open();
        } else if (!shouldBeOpen && this.isOpen) {
            this.close();
        }
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.setAttribute('open', '');
        this.dispatchEvent(new CustomEvent('dialog-opened'));
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.removeAttribute('open');
        this.pageData = null;
        this.dispatchEvent(new CustomEvent('dialog-closed'));
    }

    // Set page data for deletion
    setPageData(pageData) {
        this.pageData = pageData;
    }

    // Handle delete confirmation
    async confirmDelete() {
        if (this.pageData) {
            try {
                // Get the auth token
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('❌ No authentication token found');
                    return;
                }

                // Delete the page
                await api.withToken(token).delete(`/pages/${this.pageData.id}`);
                
                Toast.show({
                    title: 'Success',
                    message: 'Page deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('page-deleted', {
                    detail: { pageId: this.pageData.id }
                }));

            } catch (error) {
                console.error('❌ Error deleting page:', error);
                Toast.show({
                    title: 'Error',
                    message: error.response?.data?.message || 'Failed to delete page',
                    variant: 'error',
                    duration: 3000
                });
            }
        }
    }

    // Handle delete cancellation
    cancelDelete() {
        this.close();
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.isOpen ? 'open' : ''} 
                title="Confirm Delete" 
                position="center"
                variant="danger">
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the page "<strong>${this.pageData?.title || 'Unknown'}</strong>"?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The page and all its content will be permanently removed.
                    </p>
                </div>
            </ui-dialog>
        `;
        
        // Ensure event listeners are set up after render
        const dialog = this.querySelector('ui-dialog');
        if (dialog) {
            dialog.ensureEventListeners();
        }
    }
}

customElements.define('page-delete-dialog', PageDeleteDialog);
export default PageDeleteDialog; 