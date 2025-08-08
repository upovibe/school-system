import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class GradingPolicyDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.policyData = null;
    }

    static get observedAttributes() { return ['open']; }

    connectedCallback() {
        this.render();
        this.addEventListener('confirm', () => this.deletePolicy());
        this.addEventListener('cancel', () => this.close());
    }

    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }

    setPolicyData(policy) { this.policyData = policy; }

    async deletePolicy() {
        try {
            if (!this.policyData?.id) {
                Toast.show({ title: 'Error', message: 'No policy data to delete', variant: 'error', duration: 3000 });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) { Toast.show({ title: 'Authentication Error', message: 'Please log in to perform this action', variant: 'error', duration: 3000 }); return; }

            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.setAttribute('loading', ''); confirmBtn.textContent = 'Deleting...'; }

            const resp = await api.withToken(token).delete(`/grading-policies/${this.policyData.id}`);
            if (resp.data.success) {
                Toast.show({ title: 'Success', message: 'Policy deleted successfully', variant: 'success', duration: 3000 });
                this.dispatchEvent(new CustomEvent('grading-policy-deleted', {
                    detail: { policyId: this.policyData.id },
                    bubbles: true,
                    composed: true
                }));
                this.close();
            } else {
                Toast.show({ title: 'Error', message: resp.data.message || 'Failed to delete policy', variant: 'error', duration: 3000 });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete policy', variant: 'error', duration: 3000 });
        } finally {
            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.removeAttribute('loading'); confirmBtn.textContent = 'Delete Policy'; }
        }
    }

    render() {
        const name = this.policyData ? this.policyData.name : 'this policy';
        this.innerHTML = `
            <ui-dialog ${this.hasAttribute('open') ? 'open' : ''} variant="danger">
                <div slot="title">Delete Grading Policy</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">Are you sure you want to delete <strong>${name}</strong>?</p>
                    <p class="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('grading-policy-delete-dialog', GradingPolicyDeleteDialog);
export default GradingPolicyDeleteDialog;


