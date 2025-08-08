import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

class StudentGradeDeleteDialog extends HTMLElement {
    constructor() { super(); this.gradeData = null; }
    static get observedAttributes() { return ['open']; }
    connectedCallback() { this.render(); this.setup(); }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }
    setGradeData(grade) { this.gradeData = grade; this.render(); }

    setup() {
        this.addEventListener('confirm', () => this.remove());
        this.addEventListener('cancel', () => this.close());
    }

    async remove() {
        try {
            if (!this.gradeData?.id) { return; }
            const token = localStorage.getItem('token');
            if (!token) { Toast.show({ title: 'Authentication Error', message: 'Please log in', variant: 'error', duration: 3000 }); return; }
            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.setAttribute('loading', ''); confirmBtn.textContent = 'Deleting...'; }
            const resp = await api.withToken(token).delete(`/student-grades/${this.gradeData.id}`);
            if (resp.data.success) {
                Toast.show({ title: 'Success', message: 'Grade deleted', variant: 'success', duration: 2000 });
                this.dispatchEvent(new CustomEvent('student-grade-deleted', { detail: { gradeId: this.gradeData.id }, bubbles: true, composed: true }));
                this.close();
            } else {
                Toast.show({ title: 'Error', message: resp.data.message || 'Failed to delete', variant: 'error', duration: 3000 });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete', variant: 'error', duration: 3000 });
        } finally {
            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.removeAttribute('loading'); confirmBtn.textContent = 'Delete'; }
        }
    }

    render() {
        const g = this.gradeData || {};
        this.innerHTML = `
            <ui-dialog ${this.hasAttribute('open') ? 'open' : ''}>
                <div slot="title">Delete Grade</div>
                <div>Are you sure you want to delete this grade for <strong>${[g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || 'the student'}</strong>?</div>
                <ui-button slot="confirm" variant="danger">Delete</ui-button>
                <ui-button slot="cancel" variant="secondary">Cancel</ui-button>
            </ui-dialog>
        `;
    }
}

customElements.define('student-grade-delete-dialog', StudentGradeDeleteDialog);
export default StudentGradeDeleteDialog;


