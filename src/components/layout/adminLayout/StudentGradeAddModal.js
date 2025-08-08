import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/SearchDropdown.js';
import api from '@/services/api.js';

class StudentGradeAddModal extends HTMLElement {
    constructor() {
        super();
        this.prefill = { filters: {}, classes: [], subjects: [], periods: [] };
        this.students = [];
        this.allSubjects = [];
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

    setFilterPrefill(filters, lists) {
        this.allSubjects = lists.subjects || [];
        this.prefill = { filters: filters || {}, classes: lists.classes || [], subjects: lists.subjects || [], periods: lists.periods || [] };
        this.render();
        this.populateDropdowns();
        // Preselect subject and period if provided
        const subjDd = this.querySelector('ui-search-dropdown[name="subject_id"]');
        const periodDd = this.querySelector('ui-search-dropdown[name="grading_period_id"]');
        if (subjDd && this.prefill.filters.subject_id) subjDd.value = String(this.prefill.filters.subject_id);
        if (periodDd && this.prefill.filters.grading_period_id) periodDd.value = String(this.prefill.filters.grading_period_id);
        if (this.prefill.filters.class_id) { this.loadStudentsByClass(this.prefill.filters.class_id); }
        // Filter subjects by class if available (requires endpoint mapping class->subjects)
        if (this.prefill.filters.class_id) {
            this.loadSubjectsByClass(this.prefill.filters.class_id);
        }
    }

    setup() {
        this.addEventListener('confirm', () => this.save());
        this.addEventListener('cancel', () => this.close());
        this.addEventListener('change', (e) => {
            const dd = e.target.closest('ui-search-dropdown');
            if (!dd) return;
            if (dd.getAttribute('name') === 'class_id') {
                this.loadStudentsByClass(dd.value);
            }
        });
    }

    populateDropdowns() {
        const classDd = this.querySelector('ui-search-dropdown[name="class_id"]');
        const subjDd = this.querySelector('ui-search-dropdown[name="subject_id"]');
        const periodDd = this.querySelector('ui-search-dropdown[name="grading_period_id"]');
        const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
        if (classDd) {
            const html = (this.prefill.classes || []).map(c => `<ui-option value="${c.id}">${c.name}${c.section ? ' - '+c.section : ''}</ui-option>`).join('');
            classDd.querySelectorAll('ui-option').forEach(o=>o.remove());
            const temp = document.createElement('div'); temp.innerHTML = html; Array.from(temp.children).forEach(el => classDd.appendChild(el));
            classDd.value = this.prefill.filters.class_id ? String(this.prefill.filters.class_id) : '';
        }
        if (subjDd) {
            const html = (this.prefill.subjects || []).map(s => `<ui-option value="${s.id}">${s.name}</ui-option>`).join('');
            subjDd.querySelectorAll('ui-option').forEach(o=>o.remove());
            const temp = document.createElement('div'); temp.innerHTML = html; Array.from(temp.children).forEach(el => subjDd.appendChild(el));
            subjDd.value = this.prefill.filters.subject_id ? String(this.prefill.filters.subject_id) : '';
        }
        if (periodDd) {
            const html = (this.prefill.periods || []).map(p => `<ui-option value="${p.id}">${p.name}</ui-option>`).join('');
            periodDd.querySelectorAll('ui-option').forEach(o=>o.remove());
            const temp = document.createElement('div'); temp.innerHTML = html; Array.from(temp.children).forEach(el => periodDd.appendChild(el));
            periodDd.value = this.prefill.filters.grading_period_id ? String(this.prefill.filters.grading_period_id) : '';
        }
        if (studentDd) {
            const html = (this.students || []).map(s => `<ui-option value="${s.id}">${s.first_name} ${s.last_name} (${s.student_id})</ui-option>`).join('');
            studentDd.querySelectorAll('ui-option').forEach(o=>o.remove());
            const temp = document.createElement('div'); temp.innerHTML = html; Array.from(temp.children).forEach(el => studentDd.appendChild(el));
            studentDd.value = this.prefill.filters.student_id ? String(this.prefill.filters.student_id) : '';
        }
    }

    async loadStudentsByClass(classId) {
        try {
            const token = localStorage.getItem('token');
            if (!token || !classId) { this.students = []; this.populateDropdowns(); return; }
            const resp = await api.withToken(token).get('/students/by-class', { class_id: classId });
            this.students = resp.data.data || [];
            this.populateDropdowns();
        } catch (_) { this.students = []; this.populateDropdowns(); }
    }

    async loadSubjectsByClass(classId) {
        try {
            const token = localStorage.getItem('token');
            if (!token || !classId) return;
            const resp = await api.withToken(token).get('/class-subjects/by-class', { class_id: classId });
            const classSubjects = resp.data.data || [];
            // Map to {id, name} using global subjects to resolve names when API doesn't provide
            const full = Array.isArray(this.allSubjects) ? this.allSubjects : [];
            const mapped = classSubjects
                .map(cs => {
                    const sid = cs.subject_id ?? cs.id;
                    const found = full.find(s => String(s.id) === String(sid));
                    return {
                        id: sid,
                        name: (found && found.name) || cs.subject_name || cs.name || cs.code || String(sid)
                    };
                })
                .filter(s => s.id);
            if (mapped.length) {
                this.prefill.subjects = mapped;
                this.populateDropdowns();
                const subjDd = this.querySelector('ui-search-dropdown[name="subject_id"]');
                if (subjDd && this.prefill.filters.subject_id) subjDd.value = String(this.prefill.filters.subject_id);
            }
        } catch (_) { /* ignore */ }
    }

    async save() {
        try {
            const studentDd = this.querySelector('ui-search-dropdown[name="student_id"]');
            const classDd = this.querySelector('ui-search-dropdown[name="class_id"]');
            const subjDd = this.querySelector('ui-search-dropdown[name="subject_id"]');
            const periodDd = this.querySelector('ui-search-dropdown[name="grading_period_id"]');
            const assignInput = this.querySelector('ui-input[data-field="assignment_total"]');
            const examInput = this.querySelector('ui-input[data-field="exam_total"]');
            const remarksTa = this.querySelector('ui-textarea[data-field="remarks"]');

            const payload = {
                student_id: Number(studentDd?.value || 0),
                class_id: Number(classDd?.value || 0),
                subject_id: Number(subjDd?.value || 0),
                grading_period_id: Number(periodDd?.value || 0),
                assignment_total: Number(assignInput?.value || 0),
                exam_total: Number(examInput?.value || 0),
                remarks: remarksTa?.getValue() || ''
            };

            if (!payload.student_id || !payload.class_id || !payload.subject_id || !payload.grading_period_id) {
                Toast.show({ title: 'Validation Error', message: 'Please fill all required fields', variant: 'error', duration: 3000 });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) { Toast.show({ title: 'Authentication Error', message: 'Please log in', variant: 'error', duration: 3000 }); return; }

            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.setAttribute('loading', ''); confirmBtn.textContent = 'Creating...'; }

            const resp = await api.withToken(token).post('/student-grades', payload);
            if (resp.data.success) {
                Toast.show({ title: 'Success', message: 'Grade created successfully', variant: 'success', duration: 3000 });
                const id = resp.data?.data?.id;
                this.dispatchEvent(new CustomEvent('student-grade-saved', {
                    detail: { grade: { id, ...payload, final_percentage: resp.data?.data?.final_percentage, final_letter_grade: resp.data?.data?.final_letter_grade, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } },
                    bubbles: true,
                    composed: true
                }));
                this.close();
            } else {
                Toast.show({ title: 'Error', message: resp.data.message || 'Failed to create grade', variant: 'error', duration: 3000 });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to create grade', variant: 'error', duration: 3000 });
        } finally {
            const confirmBtn = this.querySelector('ui-button[slot="confirm"]');
            if (confirmBtn) { confirmBtn.removeAttribute('loading'); confirmBtn.textContent = 'Create Grade'; }
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
                <div slot="title">Add Student Grade</div>
                <form class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <ui-search-dropdown name="class_id" placeholder="Select class" class="w-full"></ui-search-dropdown>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Student</label>
                            <ui-search-dropdown name="student_id" placeholder="Select student" class="w-full"></ui-search-dropdown>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <ui-search-dropdown name="subject_id" placeholder="Select subject" class="w-full"></ui-search-dropdown>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Grading Period</label>
                            <ui-search-dropdown name="grading_period_id" placeholder="Select grading period" class="w-full"></ui-search-dropdown>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Total</label>
                            <ui-input data-field="assignment_total" type="number" min="0" placeholder="e.g., 35" class="w-full"></ui-input>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Exam Total</label>
                            <ui-input data-field="exam_total" type="number" min="0" placeholder="e.g., 55" class="w-full"></ui-input>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <ui-textarea data-field="remarks" rows="3" placeholder="Optional remarks..." class="w-full"></ui-textarea>
                    </div>
                </form>
                <ui-button slot="confirm" variant="primary">Create Grade</ui-button>
                <ui-button slot="cancel" variant="secondary">Cancel</ui-button>
            </ui-modal>
        `;
        // Populate dropdowns after render
        setTimeout(() => this.populateDropdowns(), 0);
    }
}

customElements.define('student-grade-add-modal', StudentGradeAddModal);
export default StudentGradeAddModal;


