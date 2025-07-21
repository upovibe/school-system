import App from '@/core/App.js';
import api from '@/services/api.js';
import '@/components/ui/Dialog.js';
import Toast from '@/components/ui/Toast.js';

/**
 * DbSetupDialog Component
 *
 * This component displays a dialog to initialize the database when a connection
 * is not established. It prevents closing until the setup is successful.
 */
class DbSetupDialog extends App {
    connectedCallback() {
        super.connectedCallback();
        this.render();

        // Component state and properties
        this.dialog = this.querySelector('ui-dialog');
        this.outputDiv = this.querySelector('#db-setup-output');
        this.confirmBtn = this.dialog?.shadowRoot?.getElementById('confirm-btn');

        // Show default message in output area
        if (this.outputDiv) {
            this.outputDiv.innerHTML = `
                <pre class="btext-xs overflow-x-auto my-auto">php api/index.php --fresh</pre>
            `; 
        }

        this.ensureEventListeners();
    }

    ensureEventListeners() {
        if (!this.dialog) return;

        // Prevent dialog from being dismissed until DB is set up
        this.dialog.addEventListener('cancel', this.handleCancel.bind(this));
        this.dialog.addEventListener('confirm', this.handleConfirm.bind(this));
        this.dialog.addEventListener('dialog-close', this.handleCancel.bind(this));
    }

    handleCancel(e) {
        e.preventDefault();
        this.dialog.setAttribute('open', ''); // Keep it open
        Toast.show({
            message: 'Please initialize the database to continue.',
            variant: 'warning',
            duration: 3000,
        });
    }

    async handleConfirm(e) {
        e.preventDefault();
        this.setLoadingState(true);
        Toast.show({ message: 'Initializing database...', variant: 'info' });
        if (this.outputDiv) this.outputDiv.innerHTML = '<pre class="text-xs overflow-x-auto">Initializing...</pre>';

        try {
            const response = await api.post('/db/fresh', {});
            const { output, success } = response.data;

            this.outputDiv.textContent = output || (success ? 'Database initialized!' : 'An unknown error occurred.');

            if (success) {
                Toast.show({ message: 'Database initialized successfully!', variant: 'success', duration: 3000 });
                // Reload the page to reflect the new state
                setTimeout(() => {
                    this.dialog.removeAttribute('open');
                    location.reload();
                }, 2000);
            } else {
                throw new Error('Failed to initialize database.');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to initialize database.';
            this.outputDiv.textContent = error.response?.data?.output || errorMessage;
            Toast.show({ message: errorMessage, variant: 'error', duration: 4000 });
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.dialog.setAttribute('loading', 'true');
            if (this.confirmBtn) {
                this.confirmBtn.disabled = true;
                this.confirmBtn.textContent = 'Initializing...';
            }
        } else {
            this.dialog.removeAttribute('loading');
            if (this.confirmBtn) {
                this.confirmBtn.disabled = false;
                this.confirmBtn.textContent = 'Confirm';
            }
        }
    }

    render() {
        return `
            <ui-dialog open title="Database Not Connected">
                <div slot="content">
                    <p class="mb-4 font-semibold text-red-600">The database is not connected or initialized.</p>
                    <p class="mb-4">Click confirm to run the database setup. This will erase any existing data and create a fresh installation.</p>
                    <div id="db-setup-output" class="mt-4 p-2 text-sm text-gray-700 bg-gray-100 rounded border min-h-[25px] max-h-[100px] flex items-center justify-center" max-height="100px" overflow-y-auto></div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('db-setup-dialog', DbSetupDialog);
export default DbSetupDialog; 