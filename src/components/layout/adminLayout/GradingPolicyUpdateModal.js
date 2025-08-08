import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class GradingPolicyUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.policyData = null;
        this.subjects = [];
    }

    static get observedAttributes() { return ['open']; }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('confirm', () => this.updatePolicy());
        this.addEventListener('cancel', () => this.close());
    }

    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }

    setPolicyData(policy) {
        this.policyData = policy;
        this.populateForm();
        this.loadSubjects();
    }

    async loadSubjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const resp = await api.withToken(token).get('/subjects');
            this.subjects = (resp.data.data || []).map(s => ({ id: s.id, name: s.name }));
            this.populateSubjectsDropdown();
        } catch (_) {}
    }

    populateSubjectsDropdown() {
        const dd = this.querySelector('ui-search-dropdown[name="subject_id"]');
        if (!dd) return;
        const optionsHtml = (this.subjects || []).map(s => `<ui-option value="${s.id}">${s.name}</ui-option>`).join('');
        const existing = dd.querySelectorAll('ui-option');
        existing.forEach(n => n.remove());
        const temp = document.createElement('div');
        temp.innerHTML = optionsHtml;
        Array.from(temp.children).forEach(el => dd.appendChild(el));
        // Preselect
        if (this.policyData?.subject_id) {
            dd.value = String(this.policyData.subject_id);
        }
    }

    populateForm() {
        if (!this.policyData) return;
        const nameInput = this.querySelector('ui-input[data-field="name"]');
        const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
        const assignMaxInput = this.querySelector('ui-input[data-field="assignment_max_score"]');
        const examMaxInput = this.querySelector('ui-input[data-field="exam_max_score"]');
        const boundariesTextarea = this.querySelector('ui-textarea[data-field="grade_boundaries"]');
        const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

        if (nameInput) nameInput.value = this.policyData.name || '';
        if (descriptionTextarea) descriptionTextarea.setValue(this.policyData.description || '');
        if (assignMaxInput) assignMaxInput.value = this.policyData.assignment_max_score || '';
        if (examMaxInput) examMaxInput.value = this.policyData.exam_max_score || '';
        if (boundariesTextarea) {
            const gb = Array.isArray(this.policyData.grade_boundaries) ? this.policyData.grade_boundaries : (typeof this.policyData.grade_boundaries === 'string' ? (()=>{try{return JSON.parse(this.policyData.grade_boundaries);}catch(_){return []}})() : []);
            boundariesTextarea.setValue(JSON.stringify(gb, null, 2));
        }
        if (statusSwitch) {
            if (Number(this.policyData.is_active) === 1) statusSwitch.setAttribute('checked', '');
            else statusSwitch.removeAttribute('checked');
        }
    }

    async updatePolicy() {
        try {
            if (!this.policyData?.id) {
                Toast.show({ title: 'Error', message: 'No policy data to update', variant: 'error', duration: 3000 });
                return;
            }

            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[name="subject_id"]');
            const assignMaxInput = this.querySelector('ui-input[data-field="assignment_max_score"]');
            const examMaxInput = this.querySelector('ui-input[data-field="exam_max_score"]');
            const boundariesTextarea = this.querySelector('ui-textarea[data-field="grade_boundaries"]');
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

            let gradeBoundaries;
            try { gradeBoundaries = JSON.parse(boundariesTextarea ? boundariesTextarea.getValue() : '[]'); }
            catch (_) { Toast.show({ title: 'Validation Error', message: 'Grade boundaries must be valid JSON array', variant: 'error', duration: 3000 }); return; }

            const payload = {
                name: nameInput?.value || '',
                description: descriptionTextarea?.getValue() || '',
                subject_id: subjectDropdown?.value || '',
                assignment_max_score: Number(assignMaxInput?.value || 0),
                exam_max_score: Number(examMaxInput?.value || 0),
                grade_boundaries: gradeBoundaries,
                is_active: statusSwitch ? (statusSwitch.checked ? 1 : 0) : 1,
            };

            if (!payload.name || !payload.description || !payload.subject_id || !payload.assignment_max_score || !payload.exam_max_score || !Array.isArray(payload.grade_boundaries) || payload.grade_boundaries.length === 0) {
                Toast.show({ title: 'Validation Error', message: 'Please fill all required fields', variant: 'error', duration: 3000 });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) { Toast.show({ title: 'Authentication Error', message: 'Please log in to perform this action', variant: 'error', duration: 3000 }); return; }

            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.setAttribute('loading', ''); confirmBtn.textContent = 'Updating...'; }

            const resp = await api.withToken(token).put(`/grading-policies/${this.policyData.id}`, payload);
            if (resp.data.success) {
                Toast.show({ title: 'Success', message: 'Policy updated successfully', variant: 'success', duration: 3000 });
                this.dispatchEvent(new CustomEvent('grading-policy-updated', {
                    detail: { policy: {
                        id: this.policyData.id,
                        name: payload.name,
                        description: payload.description,
                        subject_id: Number(payload.subject_id),
                        subject_name: (this.subjects.find(s => String(s.id) === String(payload.subject_id))?.name) || this.policyData.subject_name || '',
                        assignment_max_score: payload.assignment_max_score,
                        exam_max_score: payload.exam_max_score,
                        grade_boundaries: payload.grade_boundaries,
                        is_active: payload.is_active,
                        created_at: this.policyData.created_at,
                        updated_at: new Date().toISOString(),
                    } },
                    bubbles: true,
                    composed: true
                }));
                this.close();
            } else {
                Toast.show({ title: 'Error', message: resp.data.message || 'Failed to update policy', variant: 'error', duration: 3000 });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update policy', variant: 'error', duration: 3000 });
        } finally {
            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.removeAttribute('loading'); confirmBtn.textContent = 'Update Policy'; }
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
                <div slot="title">Update Grading Policy</div>
                <form class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
                        <ui-input data-field="name" type="text" class="w-full"></ui-input>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <ui-search-dropdown name="subject_id" placeholder="Select subject" class="w-full"></ui-search-dropdown>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Max Score</label>
                            <ui-input data-field="assignment_max_score" type="number" min="1" class="w-full"></ui-input>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Exam Max Score</label>
                            <ui-input data-field="exam_max_score" type="number" min="1" class="w-full"></ui-input>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea data-field="description" rows="3" class="w-full"></ui-textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Grade Boundaries (JSON array)</label>
                        <ui-textarea data-field="grade_boundaries" rows="5" class="w-full"></ui-textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch name="is_active" class="w-full"><span slot="label">Active</span></ui-switch>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('grading-policy-update-modal', GradingPolicyUpdateModal);
export default GradingPolicyUpdateModal;


