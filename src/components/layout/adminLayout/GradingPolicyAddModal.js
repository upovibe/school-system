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
            
            // Show grading policy info
            const infoBtn = e.target.closest('[data-action="show-grading-policy-info"]');
            if (infoBtn) {
                e.preventDefault();
                this.showGradingPolicyInfo();
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

            // Check if assignment + exam = 100
            const assignMax = Number(assignMaxInput?.value || 0);
            const examMax = Number(examMaxInput?.value || 0);
            const totalEquals100 = assignMax + examMax === 100;

            const allFilled = !!String(nameInput?.value || '').trim() &&
                !!String(descriptionTextarea?.getValue() || '').trim() &&
                !!String(subjectDropdown?.value || '').trim() &&
                assignMax > 0 &&
                examMax > 0 &&
                totalEquals100 &&
                hasBoundary;

            if (saveBtn) {
                if (allFilled) saveBtn.removeAttribute('disabled');
                else saveBtn.setAttribute('disabled', '');
            }

            // Show/hide validation message
            const validationMsg = this.querySelector('#score-validation-msg');
            if (validationMsg) {
                if (assignMax > 0 && examMax > 0 && !totalEquals100) {
                    validationMsg.textContent = `Assignment (${assignMax}) + Exam (${examMax}) = ${assignMax + examMax}. Total must equal 100.`;
                    validationMsg.classList.remove('hidden');
                } else {
                    validationMsg.classList.add('hidden');
                }
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

    showGradingPolicyInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-graduation-cap text-blue-500 mr-2"></i>
                <span class="font-semibold">About Grading Policies</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What are Grading Policies?</h4>
                    <p class="text-gray-700">Grading policies define how student performance is evaluated and converted to letter grades. They establish the scoring system and grade boundaries for each subject.</p>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-4 space-y-3">
                    <h5 class="font-semibold text-blue-900">Key Components:</h5>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="font-medium">Total Score</span>
                            <span class="text-blue-600">Always 100 points</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Assignment Score</span>
                            <span class="text-blue-600">e.g., 40 points (40%)</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Exam Score</span>
                            <span class="text-blue-600">e.g., 60 points (60%)</span>
                        </div>
                    </div>
                </div>

                <div class="bg-green-50 rounded-lg p-4 space-y-3">
                    <h5 class="font-semibold text-green-900">Grade Boundaries Example:</h5>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="font-medium">A Grade</span>
                            <span class="text-green-600">80-100 points</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">B Grade</span>
                            <span class="text-green-600">70-79 points</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">C Grade</span>
                            <span class="text-green-600">60-69 points</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">D Grade</span>
                            <span class="text-green-600">50-59 points</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">F Grade</span>
                            <span class="text-green-600">0-49 points</span>
                        </div>
                    </div>
                </div>

                <div class="bg-yellow-50 rounded-lg p-4 space-y-3">
                    <h5 class="font-semibold text-yellow-900">How It Works:</h5>
                    <div class="space-y-2 text-sm text-yellow-800">
                        <p>1. <strong>Student earns scores:</strong> Assignment (35/40) + Exam (55/60) = 90/100</p>
                        <p>2. <strong>System calculates percentage:</strong> 90 ÷ 100 = 90%</p>
                        <p>3. <strong>Grade assigned:</strong> 90% falls in A Grade range (80-100)</p>
                        <p>4. <strong>Final grade:</strong> A</p>
                    </div>
                </div>

                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-lightbulb mr-1"></i>
                        <strong>Tip:</strong> Assignment and Exam scores must always add up to 100. This ensures the total possible score is always 100%.
                    </p>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
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
                <div slot="title">
                    <div class="flex items-center gap-2">
                        <span>Add New Grading Policy</span>
                        <button class="text-gray-400 hover:text-gray-600 transition-colors" data-action="show-grading-policy-info" title="About Grading Policies">
                            <i class="fas fa-question-circle text-lg"></i>
                        </button>
                    </div>
                </div>
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
                            <ui-input data-field="assignment_max_score" type="number" min="1" max="99" placeholder="e.g., 40" class="w-full"></ui-input>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Exam Max Score *</label>
                            <ui-input data-field="exam_max_score" type="number" min="1" max="99" placeholder="e.g., 60" class="w-full"></ui-input>
                        </div>
                    </div>
                    <div id="score-validation-msg" class="hidden text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200"></div>
                    <div class="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
                        <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                        Assignment and Exam scores must add up to 100. For example: Assignment (40) + Exam (60) = 100.
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


