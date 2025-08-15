import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

class GradingPolicyAddModal extends HTMLElement {
    constructor() {
        super();
        this.subjects = [];
        this.gradeBoundaryItems = [
            { grade: '', min: '' }
        ];
    }

    renderBoundaryInputs() {
        const items = this.gradeBoundaryItems && this.gradeBoundaryItems.length > 0 ? this.gradeBoundaryItems : [{ grade: '', min: '' }];
        return items.map((item, index) => `
            <div class="flex justify-between items-center gap-2">
                <div class="w-full">
                    <label class="block text-xs text-gray-600 mb-1">Grade</label>
                    <ui-input data-gb-field="grade" data-index="${index}" type="text" placeholder="e.g., A" value="${item.grade ?? ''}" class="w-full"></ui-input>
                </div>
                <div class="w-1/3">
                    <label class="block text-xs text-gray-600 mb-1">Min</label>
                    <ui-input data-gb-field="min" data-index="${index}" type="number" min="0" max="100" placeholder="e.g., 80" value="${item.min ?? ''}" class="w-full"></ui-input>
                </div>
                <div class="w-10">
                    ${items.length > 1 ? `
                        <ui-button type="button" variant="danger-outline" size="sm" data-action="remove-boundary-item" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </ui-button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    readBoundaryItemsFromDOM() {
        const rows = this.querySelectorAll('#gb-inputs [data-gb-field]');
        const tmp = [];
        rows.forEach((el) => {
            const idx = parseInt(el.getAttribute('data-index'), 10);
            const field = el.getAttribute('data-gb-field');
            if (!tmp[idx]) tmp[idx] = { grade: '', min: '' };
            const val = el.getAttribute('type') === 'number' ? Number(el.value || el.getAttribute('value') || 0) : (el.value || el.getAttribute('value') || '');
            tmp[idx][field] = val;
        });
        // filter out empty rows and coerce min to number
        const cleaned = (tmp || []).filter(it => (String(it.grade).trim() !== '' && !Number.isNaN(Number(it.min)))).map(it => ({ grade: String(it.grade).trim(), min: Number(it.min) }));
        this.gradeBoundaryItems = tmp.length ? tmp : this.gradeBoundaryItems;
        return cleaned;
    }

    addBoundaryItem() {
        this.readBoundaryItemsFromDOM();
        this.gradeBoundaryItems.push({ grade: '', min: '' });
        const container = this.querySelector('#gb-inputs');
        if (container) container.innerHTML = this.renderBoundaryInputs();
    }

    removeBoundaryItem(index) {
        this.readBoundaryItemsFromDOM();
        if (this.gradeBoundaryItems.length > 1) {
            this.gradeBoundaryItems.splice(index, 1);
            const container = this.querySelector('#gb-inputs');
            if (container) container.innerHTML = this.renderBoundaryInputs();
        }
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadSubjectsWithoutPolicies();
        // Re-populate options after render in case dropdown upgrades late
        setTimeout(() => this.populateSubjectsDropdown(), 0);
    }

    setupEventListeners() {
        this.addEventListener('cancel', () => this.close());
        this.addEventListener('change', (e) => {
            if (e.target && e.target.matches('ui-search-dropdown[name="subject_id"]')) {
                // no-op; value read on submit
            }
        });

        // Dynamic grade boundary rows: add/remove
        this.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-action="add-boundary-item"]');
            if (addBtn) {
                e.preventDefault();
                this.addBoundaryItem();
            }
            const removeBtn = e.target.closest('[data-action="remove-boundary-item"]');
            if (removeBtn) {
                e.preventDefault();
                const index = parseInt(removeBtn.getAttribute('data-index'), 10);
                this.removeBoundaryItem(index);
            }
        });
    }

    // Validate required fields and toggle Save button
    validateForm() {
        try {
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[name="subject_id"]');
            const assignMaxInput = this.querySelector('ui-input[data-field="assignment_max_score"]');
            const examMaxInput = this.querySelector('ui-input[data-field="exam_max_score"]');
            const saveBtn = this.querySelector('#save-policy-btn');

            // Boundary rows must have at least one valid entry
            const boundaries = this.readBoundaryItemsFromDOM();
            const hasBoundary = Array.isArray(boundaries) && boundaries.length > 0;

            const allFilled = !!String(nameInput?.value || '').trim() &&
                !!String(descriptionTextarea?.getValue() || '').trim() &&
                !!String(subjectDropdown?.value || '').trim() &&
                Number(assignMaxInput?.value || 0) > 0 &&
                Number(examMaxInput?.value || 0) > 0 &&
                hasBoundary;

            if (saveBtn) {
                if (allFilled) saveBtn.removeAttribute('disabled');
                else saveBtn.setAttribute('disabled', '');
            }
        } catch (_) { /* noop */ }
    }

    // Wire events and initial validation
    addFormEventListeners() {
        const selectors = [
            'ui-input[data-field="name"]',
            'ui-textarea[data-field="description"]',
            'ui-search-dropdown[name="subject_id"]',
            'ui-input[data-field="assignment_max_score"]',
            'ui-input[data-field="exam_max_score"]'
        ];
        selectors.forEach(sel => {
            const el = this.querySelector(sel);
            if (el) {
                el.addEventListener('input', () => this.validateForm());
                el.addEventListener('change', () => this.validateForm());
            }
        });
        const gb = this.querySelector('#gb-inputs');
        if (gb) {
            gb.addEventListener('input', () => this.validateForm());
            gb.addEventListener('change', () => this.validateForm());
        }
        const saveBtn = this.querySelector('#save-policy-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.savePolicy());
        this.validateForm();
    }

    async loadSubjectsWithoutPolicies() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const resp = await api.withToken(token).get('/grading-policies/subjects/without-policies');
            this.subjects = resp.data?.data || [];
            if (!Array.isArray(this.subjects) || this.subjects.length === 0) {
                // Fallback: load all subjects so user can still create/update policies
                await this.loadAllSubjectsFallback();
            }
            this.populateSubjectsDropdown();
        } catch (e) {
            // Fallback to all subjects if special endpoint fails
            await this.loadAllSubjectsFallback();
            this.populateSubjectsDropdown();
        }
    }

    async loadAllSubjectsFallback() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const respAll = await api.withToken(token).get('/subjects');
            // Expecting array in respAll.data.data
            const list = respAll.data?.data || [];
            // Normalize to id/name pairs
            this.subjects = list.map(s => ({ id: s.id || s.subject_id || s.id, name: s.name || s.subject_name || s.name }));
        } catch (_) {
            // keep subjects as empty array
            this.subjects = [];
        }
    }

    populateSubjectsDropdown() {
        const dd = this.querySelector('ui-search-dropdown[name="subject_id"]');
        if (!dd) return;
        const optionsHtml = (this.subjects || []).map(s => `<ui-option value="${s.id}">${s.name}</ui-option>`).join('');
        // Replace hidden slot sibling with options container
        const temp = document.createElement('div');
        temp.innerHTML = optionsHtml;
        const existing = dd.querySelectorAll('ui-option');
        existing.forEach(n => n.remove());
        Array.from(temp.children).forEach(el => dd.appendChild(el));
        // Reset any previous selection so placeholder shows
        dd.value = '';
    }

    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }

    async savePolicy() {
        try {
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[name="subject_id"]');
            const assignMaxInput = this.querySelector('ui-input[data-field="assignment_max_score"]');
            const examMaxInput = this.querySelector('ui-input[data-field="exam_max_score"]');
            // Build grade boundaries array from dynamic inputs
            const boundaries = this.readBoundaryItemsFromDOM();
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

            const gradeBoundaries = boundaries;

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
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to perform this action', variant: 'error', duration: 3000 });
                return;
            }

            const confirmBtn = this.querySelector('#save-policy-btn');
            if (confirmBtn) { confirmBtn.setAttribute('loading', ''); }

            const resp = await api.withToken(token).post('/grading-policies', payload);
            if (resp.data.success) {
                Toast.show({ title: 'Success', message: 'Policy created successfully', variant: 'success', duration: 3000 });
                this.dispatchEvent(new CustomEvent('grading-policy-saved', {
                    detail: {
                        policy: {
                            id: resp.data.data.id,
                            name: payload.name,
                            description: payload.description,
                            subject_id: Number(payload.subject_id),
                            subject_name: (this.subjects.find(s => String(s.id) === String(payload.subject_id))?.name) || '',
                            assignment_max_score: payload.assignment_max_score,
                            exam_max_score: payload.exam_max_score,
                            grade_boundaries: payload.grade_boundaries,
                            is_active: payload.is_active,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        }
                    },
                    bubbles: true,
                    composed: true
                }));
                this.close();
            } else {
                Toast.show({ title: 'Error', message: resp.data.message || 'Failed to create policy', variant: 'error', duration: 3000 });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to create policy', variant: 'error', duration: 3000 });
        } finally {
            const confirmBtn = this.querySelector('#save-policy-btn');
            if (confirmBtn) { confirmBtn.removeAttribute('loading'); }
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
                <div slot="title">Add New Grading Policy</div>
                <form class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Policy Name *</label>
                        <ui-input data-field="name" type="text" placeholder="e.g., Standard Policy" class="w-full"></ui-input>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                        <ui-search-dropdown name="subject_id" placeholder="Select subject" class="w-full"></ui-search-dropdown>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Max Score *</label>
                            <ui-input data-field="assignment_max_score" type="number" min="1" placeholder="e.g., 40" class="w-full"></ui-input>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Exam Max Score *</label>
                            <ui-input data-field="exam_max_score" type="number" min="1" placeholder="e.g., 60" class="w-full"></ui-input>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <ui-textarea data-field="description" rows="3" placeholder="Short description..." class="w-full"></ui-textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Grade Boundaries *</label>
                        <div class="space-y-2">
                            <div id="gb-inputs" class="space-y-2">
                                ${this.renderBoundaryInputs()}
                            </div>
                            <div class="flex justify-end mt-2">
                                <ui-button type="button" variant="outline" size="sm" data-action="add-boundary-item" class="px-3">
                                    <i class="fas fa-plus mr-1"></i>
                                    Add Boundary
                                </ui-button>
                            </div>
                            <p class="text-xs text-gray-500">Enter entries like Grade and Minimum percentage. Example: A and 80.</p>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch name="is_active" checked class="w-full"><span slot="label">Active</span></ui-switch>
                    </div>
                </form>
                <div slot="footer" class="flex items-center justify-end gap-2">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Cancel</ui-button>
                    <ui-button id="save-policy-btn" color="primary" disabled>Create Policy</ui-button>
                </div>
            </ui-modal>
        `;
        // Attach validation and save wiring
        this.addFormEventListeners();
    }
}

customElements.define('grading-policy-add-modal', GradingPolicyAddModal);
export default GradingPolicyAddModal;


