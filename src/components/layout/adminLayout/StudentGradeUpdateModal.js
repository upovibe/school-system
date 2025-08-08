import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import api from '@/services/api.js';

class StudentGradeUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.gradeData = null;
        this.policy = null;
    }

    static get observedAttributes() { return ['open']; }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && oldValue !== newValue) {
            const modal = this.querySelector('ui-modal');
            if (modal) {
                if (this.hasAttribute('open')) modal.setAttribute('open', '');
                else modal.removeAttribute('open');
            } else {
                this.render();
            }
        }
    }
    connectedCallback() { this.render(); this.setup(); }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }

    setup() {
        this.addEventListener('confirm', () => this.update());
        this.addEventListener('cancel', () => this.close());
    }

    async loadPolicyForSubject(subjectId) {
        try {
            const token = localStorage.getItem('token');
            if (!token || !subjectId) return;
            const resp = await api.withToken(token).get('/grading-policies/by-subject', { subject_id: subjectId });
            this.policy = resp?.data?.data || null;
            this.applyMaxConstraints();
        } catch (e) {
            this.policy = null;
            this.applyMaxConstraints();
        }
    }

    applyMaxConstraints() {
        const assignInput = this.querySelector('ui-input[data-field="assignment_total"]');
        const examInput = this.querySelector('ui-input[data-field="exam_total"]');
        const assignLabel = this.querySelector('[data-label="assignment"]');
        const examLabel = this.querySelector('[data-label="exam"]');
        const assignMax = this.policy?.assignment_max_score ?? null;
        const examMax = this.policy?.exam_max_score ?? null;
        if (assignInput) {
            if (assignMax != null) assignInput.setAttribute('max', String(assignMax)); else assignInput.removeAttribute('max');
            assignInput.setAttribute('min', '0');
            const val = Number(assignInput.value || 0);
            if (assignMax != null && val > assignMax) assignInput.value = String(assignMax);
            assignInput.addEventListener('input', () => {
                const v = Number(assignInput.value || 0);
                if (v < 0) assignInput.value = '0';
                if (assignMax != null && v > assignMax) assignInput.value = String(assignMax);
            });
        }
        if (examInput) {
            if (examMax != null) examInput.setAttribute('max', String(examMax)); else examInput.removeAttribute('max');
            examInput.setAttribute('min', '0');
            const val = Number(examInput.value || 0);
            if (examMax != null && val > examMax) examInput.value = String(examMax);
            examInput.addEventListener('input', () => {
                const v = Number(examInput.value || 0);
                if (v < 0) examInput.value = '0';
                if (examMax != null && v > examMax) examInput.value = String(examMax);
            });
        }
        if (assignLabel) assignLabel.textContent = `Assignment Total${assignMax != null ? ` (Max: ${assignMax})` : ' (No policy set)'}`;
        if (examLabel) examLabel.textContent = `Exam Total${examMax != null ? ` (Max: ${examMax})` : ' (No policy set)'}`;
    }

    setGradeData(grade) {
        this.gradeData = grade;
        this.populate();
        // Load policy for constraints based on subject
        if (grade && grade.subject_id) {
            this.loadPolicyForSubject(grade.subject_id);
        }
    }

    populate() {
        if (!this.gradeData) return;
        const assignInput = this.querySelector('ui-input[data-field="assignment_total"]');
        const examInput = this.querySelector('ui-input[data-field="exam_total"]');
        const remarksTa = this.querySelector('ui-textarea[data-field="remarks"]');
        if (assignInput) assignInput.value = this.gradeData.assignment_total ?? '';
        if (examInput) examInput.value = this.gradeData.exam_total ?? '';
        if (remarksTa) remarksTa.setValue(this.gradeData.remarks || '');
        // Apply any existing constraints
        this.applyMaxConstraints();
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
            const assignVal = Number(assignInput?.value || 0);
            const examVal = Number(examInput?.value || 0);
            const assignMax = this.policy?.assignment_max_score ?? null;
            const examMax = this.policy?.exam_max_score ?? null;

            if (assignMax != null && assignVal > assignMax) {
                Toast.show({ title: 'Validation Error', message: `Assignment total cannot exceed ${assignMax}`, variant: 'error', duration: 3000 });
                return;
            }
            if (examMax != null && examVal > examMax) {
                Toast.show({ title: 'Validation Error', message: `Exam total cannot exceed ${examMax}`, variant: 'error', duration: 3000 });
                return;
            }

            const payload = {
                assignment_total: assignVal,
                exam_total: examVal,
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
                            <label class="block text-sm font-medium text-gray-700 mb-1" data-label="assignment">Assignment Total</label>
                            <ui-input data-field="assignment_total" type="number" min="0" class="w-full"></ui-input>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1" data-label="exam">Exam Total</label>
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
        setTimeout(() => { this.populate(); }, 0);
    }
}

customElements.define('student-grade-update-modal', StudentGradeUpdateModal);
export default StudentGradeUpdateModal;


