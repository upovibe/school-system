import App from '@/core/App.js';

class ApplyPage extends App {
    connectedCallback() {
        super.connectedCallback();
        document.title = 'Apply | UPO UI';
        this.render();
    }

    render() {
        return `
            <div class="min-h-[60vh] flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-3xl font-bold mb-4">Apply goes here</h1>
                    <p class="text-lg text-gray-600">This is the application page.</p>
                </div>
            </div>
        `;
    }
}

customElements.define('app-apply-page', ApplyPage);
export default ApplyPage; 