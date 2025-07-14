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
        this.pageData = null;
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
        // Log the page data when modal opens
        if (this.pageData) {
            console.log('🔍 VIEW MODAL DATA:', this.pageData);
        }
    }

    close() {
        this.removeAttribute('open');
        this.pageData = null;
    }

    // Set page data for viewing
    setPageData(pageData) {
        this.pageData = pageData;
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Page</div>
                
                <div class="p-6">
                    <p class="text-gray-600">Page data has been logged to console.</p>
                    <p class="text-sm text-gray-500 mt-2">Check browser console to see the page data.</p>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('page-view-modal', PageViewModal);
export default PageViewModal; 