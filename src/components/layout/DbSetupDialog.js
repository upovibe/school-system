import App from '@/core/App.js';

class DbSetupDialog extends App {
    connectedCallback() {
        super.connectedCallback();
        this.render();
        this.ensureEventListeners();
    }

    render() {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
                    <h2 class="text-2xl font-bold mb-4 text-red-600">Database Not Connected</h2>
                    <p class="mb-4 text-gray-700">The database is not connected or initialized.</p>
                    <button id="init-db-btn" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Initialize Database</button>
                    <div id="db-setup-output" class="mt-4 text-sm text-gray-700"></div>
                </div>
            </div>
        `;
    }

    ensureEventListeners() {
        const btn = this.querySelector('#init-db-btn');
        if (btn) {
            btn.onclick = async () => {
                btn.disabled = true;
                btn.textContent = 'Initializing...';
                const outputDiv = this.querySelector('#db-setup-output');
                outputDiv.textContent = '';
                const res = await fetch('/api/db/fresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{}'
                }).then(r => r.json());
                outputDiv.textContent = res.output || (res.success ? 'Database initialized!' : 'Failed to initialize database.');
                if (res.success) {
                    setTimeout(() => location.reload(), 2000);
                } else {
                    btn.disabled = false;
                    btn.textContent = 'Initialize Database';
                }
            };
        }
    }

    updatedCallback() {
        this.ensureEventListeners();
    }
}

customElements.define('db-setup-dialog', DbSetupDialog);
export default DbSetupDialog; 