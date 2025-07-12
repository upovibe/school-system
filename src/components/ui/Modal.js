/**
 * Modal Component
 * 
 * A side modal component that slides in from different directions (left, right, top, bottom).
 * Perfect for navigation panels, forms, and content overlays.
 * 
 * Attributes:
 * - open: boolean (default: false) - controls modal visibility
 * - position: string (default: "right") - modal position: "left", "right", "top", "bottom"
 * - size: string (default: "md") - modal size: "sm", "md", "lg", "xl", "full"
 * - backdrop: boolean (default: true) - show/hide backdrop
 * - close-on-escape: boolean (default: true) - close on escape key
 * - close-on-backdrop-click: boolean (default: true) - close on backdrop click
 * - close-button: boolean (default: true) - show/hide close button
 * 
 * Slots:
 * - default: Main modal content
 * - title: Modal header title
 * - footer: Modal footer content
 * 
 * Events:
 * - modal-open: Fired when modal opens
 * - modal-close: Fired when modal closes
 * 
 * Usage:
 * <ui-modal open position="right" size="md">
 *   <div slot="title">Modal Title</div>
 *   <div>Modal content goes here</div>
 *   <div slot="footer">Footer content</div>
 * </ui-modal>
 */
class Modal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.escapeHandler = this.handleEscape.bind(this);
        this.backdropClickHandler = this.handleBackdropClick.bind(this);
    }

    static get observedAttributes() {
        return ['open', 'position', 'size', 'backdrop', 'close-on-escape', 'close-on-backdrop-click', 'close-button'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.updateOpenState();
        // Add explicit close button event after render
        this.addCloseButtonHandler();
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'open') {
                this.updateOpenState();
            } else {
                this.render();
                this.addCloseButtonHandler();
            }
        }
    }

    setupEventListeners() {
        // Backdrop click
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop') && this.getAttribute('close-on-backdrop-click') !== 'false') {
                this.close();
            }
        });

        // Escape key
        document.addEventListener('keydown', this.escapeHandler);
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.escapeHandler);
    }

    handleEscape(event) {
        if (event.key === 'Escape' && this.isOpen && this.getAttribute('close-on-escape') !== 'false') {
            this.close();
        }
    }

    handleBackdropClick(event) {
        if (event.target.classList.contains('modal-backdrop') && this.getAttribute('close-on-backdrop-click') !== 'false') {
            this.close();
        }
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
        
        // Add to body if not already there
        if (!document.body.contains(this)) {
            document.body.appendChild(this);
        }

        // Focus management
        this.focus();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Trigger open event
        this.dispatchEvent(new CustomEvent('modal-open'));
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.removeAttribute('open');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Trigger close event
        this.dispatchEvent(new CustomEvent('modal-close'));
    }

    render() {
        const position = this.getAttribute('position') || 'right';
        const size = this.getAttribute('size') || 'md';
        const backdrop = this.getAttribute('backdrop') !== 'false';
        const showClose = this.getAttribute('close-button') === 'true';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                }

                :host([open]) {
                    display: block;
                }

                .modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(2px);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                :host([open]) .modal-backdrop {
                    opacity: 1;
                }

                .modal-content {
                    position: absolute;
                    background: white;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    border-radius: 8px;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                    max-height: 100vh;
                    max-width: 100vw;
                }

                /* Position variants */
                .modal-content[data-position="left"] {
                    top: 0;
                    left: 0;
                    height: 100vh;
                    transform: translateX(-100%);
                }

                .modal-content[data-position="right"] {
                    top: 0;
                    right: 0;
                    height: 100vh;
                    transform: translateX(100%);
                }

                .modal-content[data-position="top"] {
                    top: 0;
                    left: 0;
                    right: 0;
                    width: 100vw;
                    transform: translateY(-100%);
                }

                .modal-content[data-position="bottom"] {
                    bottom: 0;
                    left: 0;
                    right: 0;
                    width: 100vw;
                    transform: translateY(100%);
                }

                /* Size variants - only for left and right positions */
                .modal-content[data-position="left"][data-size="sm"],
                .modal-content[data-position="right"][data-size="sm"] {
                    width: 300px;
                }

                .modal-content[data-position="left"][data-size="md"],
                .modal-content[data-position="right"][data-size="md"] {
                    width: 400px;
                }

                .modal-content[data-position="left"][data-size="lg"],
                .modal-content[data-position="right"][data-size="lg"] {
                    width: 500px;
                }

                .modal-content[data-position="left"][data-size="xl"],
                .modal-content[data-position="right"][data-size="xl"] {
                    width: 600px;
                }

                .modal-content[data-position="left"][data-size="full"],
                .modal-content[data-position="right"][data-size="full"] {
                    width: 100%;
                }

                /* Position-specific sizes for top and bottom */
                .modal-content[data-position="top"][data-size="sm"],
                .modal-content[data-position="bottom"][data-size="sm"] {
                    height: 200px;
                }

                .modal-content[data-position="top"][data-size="md"],
                .modal-content[data-position="bottom"][data-size="md"] {
                    height: 300px;
                }

                .modal-content[data-position="top"][data-size="lg"],
                .modal-content[data-position="bottom"][data-size="lg"] {
                    height: 400px;
                }

                .modal-content[data-position="top"][data-size="xl"],
                .modal-content[data-position="bottom"][data-size="xl"] {
                    height: 500px;
                }

                .modal-content[data-position="top"][data-size="full"],
                .modal-content[data-position="bottom"][data-size="full"] {
                    height: 100%;
                }

                /* Open state animations */
                :host([open]) .modal-content[data-position="left"] {
                    opacity: 1;
                    transform: translateX(0);
                }

                :host([open]) .modal-content[data-position="right"] {
                    opacity: 1;
                    transform: translateX(0);
                }

                :host([open]) .modal-content[data-position="top"] {
                    opacity: 1;
                    transform: translateY(0);
                }

                :host([open]) .modal-content[data-position="bottom"] {
                    opacity: 1;
                    transform: translateY(0);
                }

                .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.5rem 0.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                    position: relative;
                    min-height: 2rem;
                }

                .modal-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                    text-align: center;
                }

                .modal-close {
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0.15rem;
                    border-radius: 0.25rem;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 1.5rem;
                    height: 1.5rem;
                    position: absolute;
                    top: 1rem;
                    z-index: 10;
                }

                /* Position-specific close button placement */
                .modal-content[data-position="left"] .modal-close {
                    left: 1rem;
                }

                .modal-content[data-position="right"] .modal-close {
                    right: 1rem;
                }

                .modal-content[data-position="top"] .modal-close {
                    right: 1rem;
                }

                .modal-content[data-position="bottom"] .modal-close {
                    right: 1rem;
                }

                .modal-close:hover {
                    background-color: #e5e7eb;
                    color: #374151;
                }

                .modal-close:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }

                .modal-close svg {
                    width: 1.25rem;
                    height: 1.25rem;
                }

                .modal-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    max-height: calc(100vh - 120px);
                }

                .modal-footer {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding: 0.5rem 1.5rem;
                    border-top: 1px solid #e5e7eb;
                    background: #f9fafb;
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .modal-content[data-position="left"],
                    .modal-content[data-position="right"] {
                        width: 100vw;
                    }

                    .modal-content[data-position="top"],
                    .modal-content[data-position="bottom"] {
                        height: 50vh;
                    }
                }

                /* Focus styles */
                :host:focus {
                    outline: none;
                }

                .modal-content:focus {
                    outline: none;
                }
            </style>

            ${backdrop ? '<div class="modal-backdrop"></div>' : ''}
            
            <div class="modal-content" data-position="${position}" data-size="${size}" tabindex="-1">
                ${showClose ? `
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <slot name="title">Modal Title</slot>
                        </h3>
                        <button class="modal-close" aria-label="Close modal">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                ` : `
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <slot name="title">Modal Title</slot>
                        </h3>
                    </div>
                `}
                
                <div class="modal-body">
                    <slot></slot>
                </div>
                
                <div class="modal-footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        `;
    }

    addCloseButtonHandler() {
        const closeBtn = this.shadowRoot.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.close();
            };
        }
    }
}

customElements.define('ui-modal', Modal);
export default Modal; 