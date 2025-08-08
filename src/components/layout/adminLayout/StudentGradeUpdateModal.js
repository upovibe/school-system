import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import api from '@/services/api.js';

class StudentGradeUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.gradeData = null;
    }

    static get observedAttributes() { return ['open']; }
    connectedCallback() { this.render(); this.setup(); }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }

    setup() {
        this.addEventListener('confirm', () => this.update());
        this.addEventListener('cancel', () => this.close());
    }

    setGradeData(grade) {
        this.gradeData = grade;
        this.populate();
    }

    populate() {
        if (!this.gradeData) return;
        const assignInput = this.querySelector('ui-input[data-field="assignment_total"]');
        const examInput = this.querySelector('ui-input[data-field="exam_total"]');
        const remarksTa = this.querySelector('ui-textarea[data-field="remarks"]');
        if (assignInput) assignInput.value = this.gradeData.assignment_total ?? '';
        if (examInput) examInput.value = this.gradeData.exam_total ?? '';
        if (remarksTa) remarksTa.setValue(this.gradeData.remarks || '');
    }

    async update() {
        try {
            if (!this.gradeData?.id) {
                Toast.show({ title: 'Error', message: 'No grade to update', variant: 'error', duration: 3000 });
                return;
            }

            const assignInput = this.querySelector('ui-input[data-field="assignment_total"]');
            const examInput = this.querySelector('ui-input[data-field="exam_total"]');
            const remarksTa = this.querySelector('ui-textarea[data-field="remarks"]');
            const payload = {
                assignment_total: Number(assignInput?.value || 0),
                exam_total: Number(examInput?.value || 0),
                remarks: remarksTa?.getValue() || ''
            };

            const token = localStorage.getItem('token');
            if (!token) { Toast.show({ title: 'Authentication Error', message: 'Please log in', variant: 'error', duration: 3000 }); return; }

            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.setAttribute('loading', ''); confirmBtn.textContent = 'Updating...'; }

            const resp = await api.withToken(token).put(`/student-grades/${this.gradeData.id}`, payload);
            if (resp.data.success) {
                Toast.show({ title: 'Success', message: 'Grade updated successfully', variant: 'success', duration: 3000 });
                this.dispatchEvent(new CustomEvent('student-grade-updated', {
                    detail: { grade: { ...this.gradeData, ...payload, updated_at: new Date().toISOString() } },
                    bubbles: true,
                    composed: true
                }));
                this.close();
            } else {
                Toast.show({ title: 'Error', message: resp.data.message || 'Failed to update grade', variant: 'error', duration: 3000 });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update grade', variant: 'error', duration: 3000 });
        } finally {
            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.removeAttribute('loading'); confirmBtn.textContent = 'Update Grade'; }
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
                <div slot="title">Update Student Grade</div>
                <form class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Total</label>
                            <ui-input data-field="assignment_total" type="number" min="0" class="w-full"></ui-input>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Exam Total</label>
                            <ui-input data-field="exam_total" type="number" min="0" class="w-full"></ui-input>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <ui-textarea data-field="remarks" rows="3" class="w-full"></ui-textarea>
                    </div>
                </form>
                <ui-button slot="confirm" variant="primary">Update Grade</ui-button>
                <ui-button slot="cancel" variant="secondary">Cancel</ui-button>
            </ui-modal>
        `;
        setTimeout(() => this.populate(), 0);
    }
}

customElements.define('student-grade-update-modal', StudentGradeUpdateModal);
export default StudentGradeUpdateModal;


