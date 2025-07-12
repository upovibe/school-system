import App from '@/core/App.js';

/**
 * Auth Layout Component
 * 
 * This layout provides a consistent structure for all authentication-related pages.
 * It includes a simple header and content area.
 */
class AuthLayout extends App {
    constructor() {
        super();
        this.pageContent = '';
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Authentication | School System';
    }

    /**
     * Set the page content to be rendered within this layout
     * @param {string} content - HTML content to render
     */
    setPageContent(content) {
        this.pageContent = content;
        this.innerHTML = this.render();
    }

    render() {
        return `
            <main class="flex justify-center items-center">
                ${this.pageContent}
            </main>
        `;
    }
}

customElements.define('app-auth-layout', AuthLayout);
export default AuthLayout; 