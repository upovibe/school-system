import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';

/**
 * Page View Modal Component
 * 
 * A simple modal component for viewing page details
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class PageViewModal extends HTMLElement {
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
        // Listen for modal close events
        this.addEventListener('modal-close', () => {
            this.close();
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
        this.dispatchEvent(new CustomEvent('modal-opened'));
        
        // Log the page data when modal opens
        if (this.pageData) {
            console.log('🔍 VIEW MODAL DATA:', this.pageData);
        }
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.removeAttribute('open');
        this.pageData = null;
        this.dispatchEvent(new CustomEvent('modal-closed'));
    }

    // Set page data for viewing
    setPageData(pageData) {
        this.pageData = pageData;
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.isOpen ? 'open' : ''} 
                position="bottom" 
                size="lg"
                close-button="true">
                <div slot="title">View Page</div>
                
                <div class="p-6">
                    <p class="text-gray-600">Page data has been logged to console.</p>
                    <p class="text-sm text-gray-500 mt-2">Check browser console to see the page data.</p>
                </div>
                
                <div slot="footer" class="flex justify-end space-x-3">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" onclick="this.closest('page-view-modal').close()">
                        Close
                    </button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('page-view-modal', PageViewModal);
export default PageViewModal; 