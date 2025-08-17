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
        this.gradeBoundaryItems = [];
    }

    static get observedAttributes() { return ['open']; }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.addFormEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('confirm', () => this.updatePolicy());
        this.addEventListener('cancel', () => this.close());
        // Dynamic boundary buttons
        this.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-action="add-boundary-item"]');
            if (addBtn) { e.preventDefault(); this.addBoundaryItem(); }
            const removeBtn = e.target.closest('[data-action="remove-boundary-item"]');
            if (removeBtn) { e.preventDefault(); const idx = parseInt(removeBtn.getAttribute('data-index'), 10); this.removeBoundaryItem(idx); }
            
            // Show grading policy info
            const infoBtn = e.target.closest('[data-action="show-grading-policy-info"]');
            if (infoBtn) {
                e.preventDefault();
                this.showGradingPolicyInfo();
            }
        });
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
        const gb = Array.isArray(this.policyData.grade_boundaries) ? this.policyData.grade_boundaries : (typeof this.policyData.grade_boundaries === 'string' ? (()=>{try{return JSON.parse(this.policyData.grade_boundaries);}catch(_){return []}})() : []);
        this.gradeBoundaryItems = (gb && Array.isArray(gb) && gb.length > 0) ? gb.map(x => ({ grade: x.grade || '', min: x.min ?? '' })) : [{ grade: '', min: '' }];
        const container = this.querySelector('#gb-inputs');
        if (container) container.innerHTML = this.renderBoundaryInputs();
        if (statusSwitch) {
            if (Number(this.policyData.is_active) === 1) statusSwitch.setAttribute('checked', '');
            else statusSwitch.removeAttribute('checked');
        }
        
        // Validate form after populating
        setTimeout(() => this.validateForm(), 100);
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

    validateForm() {
        try {
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const subjectDropdown = this.querySelector('ui-search-dropdown[name="subject_id"]');
            const assignMaxInput = this.querySelector('ui-input[data-field="assignment_max_score"]');
            const examMaxInput = this.querySelector('ui-input[data-field="exam_max_score"]');
            const saveBtn = this.querySelector('#update-policy-btn');

            // Check if assignment + exam = 100
            const assignMax = Number(assignMaxInput?.value || 0);
            const examMax = Number(examMaxInput?.value || 0);
            const totalEquals100 = assignMax + examMax === 100;

            // Check for unique grade boundaries
            const boundaries = this.readBoundaryItemsFromDOM();
            const hasBoundary = Array.isArray(boundaries) && boundaries.length > 0;
            
            // Check for unique grades and minimum values
            const grades = boundaries.map(b => b.grade).filter(g => g.trim() !== '');
            const mins = boundaries.map(b => b.min).filter(m => !Number.isNaN(m));
            const uniqueGrades = new Set(grades);
            const uniqueMins = new Set(mins);
            const hasUniqueGrades = grades.length === uniqueGrades.size;
            const hasUniqueMins = mins.length === uniqueMins.size;

            const allFilled = !!String(nameInput?.value || '').trim() &&
                !!String(descriptionTextarea?.getValue() || '').trim() &&
                !!String(subjectDropdown?.value || '').trim() &&
                assignMax > 0 &&
                examMax > 0 &&
                totalEquals100 &&
                hasBoundary &&
                hasUniqueGrades &&
                hasUniqueMins;

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

            // Show/hide grade boundary validation message
            const boundaryValidationMsg = this.querySelector('#boundary-validation-msg');
            if (boundaryValidationMsg) {
                if (!hasUniqueGrades || !hasUniqueMins) {
                    let msg = '';
                    if (!hasUniqueGrades) msg += 'Grade values must be unique. ';
                    if (!hasUniqueMins) msg += 'Minimum values must be unique.';
                    boundaryValidationMsg.textContent = msg.trim();
                    boundaryValidationMsg.classList.remove('hidden');
                } else {
                    boundaryValidationMsg.classList.add('hidden');
                }
            }
        } catch (_) { /* noop */ }
    }

    addFormEventListeners() {
        // Add event listeners to form fields for real-time validation
        const nameInput = this.querySelector('ui-input[data-field="name"]');
        if (nameInput) {
            nameInput.addEventListener('input', () => this.validateForm());
        }

        const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
        if (descriptionTextarea) {
            descriptionTextarea.addEventListener('input', () => this.validateForm());
        }

        const subjectDropdown = this.querySelector('ui-search-dropdown[name="subject_id"]');
        if (subjectDropdown) {
            subjectDropdown.addEventListener('change', () => this.validateForm());
        }

        const assignMaxInput = this.querySelector('ui-input[data-field="assignment_max_score"]');
        if (assignMaxInput) {
            assignMaxInput.addEventListener('input', () => this.validateForm());
        }

        const examMaxInput = this.querySelector('ui-input[data-field="exam_max_score"]');
        if (examMaxInput) {
            examMaxInput.addEventListener('input', () => this.validateForm());
        }

        // Add event listeners to grade boundary inputs
        const gbContainer = this.querySelector('#gb-inputs');
        if (gbContainer) {
            gbContainer.addEventListener('input', () => this.validateForm());
            gbContainer.addEventListener('change', () => this.validateForm());
        }

        const saveBtn = this.querySelector('#update-policy-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.updatePolicy());
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

            // Validate assignment + exam = 100
            if (payload.assignment_max_score + payload.exam_max_score !== 100) {
                Toast.show({ title: 'Validation Error', message: 'Assignment and Exam scores must add up to 100', variant: 'error', duration: 3000 });
                return;
            }

            // Validate unique grade boundaries
            const grades = payload.grade_boundaries.map(b => b.grade).filter(g => g.trim() !== '');
            const mins = payload.grade_boundaries.map(b => b.min).filter(m => !Number.isNaN(m));
            const uniqueGrades = new Set(grades);
            const uniqueMins = new Set(mins);
            
            if (grades.length !== uniqueGrades.size) {
                Toast.show({ title: 'Validation Error', message: 'Grade values must be unique', variant: 'error', duration: 3000 });
                return;
            }
            
            if (mins.length !== uniqueMins.size) {
                Toast.show({ title: 'Validation Error', message: 'Minimum values must be unique', variant: 'error', duration: 3000 });
                return;
            }

            if (!payload.name || !payload.description || !payload.subject_id || !payload.assignment_max_score || !payload.exam_max_score || !Array.isArray(payload.grade_boundaries) || payload.grade_boundaries.length === 0) {
                Toast.show({ title: 'Validation Error', message: 'Please fill all required fields', variant: 'error', duration: 3000 });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) { Toast.show({ title: 'Authentication Error', message: 'Please log in to perform this action', variant: 'error', duration: 3000 }); return; }

            const confirmBtn = this.querySelector('#update-policy-btn');
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
            const confirmBtn = this.querySelector('#update-policy-btn');
            if (confirmBtn) { confirmBtn.removeAttribute('loading'); confirmBtn.textContent = 'Update Policy'; }
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
                <div slot="title">
                    <div class="flex items-center gap-2">
                        <span>Update Grading Policy</span>
                        <button class="text-gray-400 hover:text-gray-600 transition-colors" data-action="show-grading-policy-info" title="About Grading Policies">
                            <i class="fas fa-question-circle text-lg"></i>
                        </button>
                    </div>
                </div>
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea data-field="description" rows="3" class="w-full"></ui-textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Grade Boundaries</label>
                        <div class="space-y-2">
                            <div id="gb-inputs" class="space-y-2">${this.renderBoundaryInputs()}</div>
                            <div class="flex justify-end mt-2">
                                <ui-button type="button" variant="outline" size="sm" data-action="add-boundary-item" class="px-3">
                                    <i class="fas fa-plus mr-1"></i>
                                    Add Boundary
                                </ui-button>
                            </div>
                            <p class="text-xs text-gray-500">Enter entries like Grade and Minimum percentage. Example: A and 80.</p>
                            <div id="boundary-validation-msg" class="hidden text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200"></div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch name="is_active" class="w-full"><span slot="label">Active</span></ui-switch>
                    </div>
                </form>
                <div slot="footer" class="flex justify-end gap-2">
                    <ui-button variant="outline" modal-action="cancel">Cancel</ui-button>
                    <ui-button id="update-policy-btn" color="primary" disabled>Update Policy</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('grading-policy-update-modal', GradingPolicyUpdateModal);
export default GradingPolicyUpdateModal;


