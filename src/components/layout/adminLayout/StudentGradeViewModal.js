import '@/components/ui/Modal.js';

class StudentGradeViewModal extends HTMLElement {
    constructor() { super(); this.gradeData = null; }
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
    connectedCallback() { this.render(); }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }
    setGradeData(grade) { this.gradeData = grade; this.render(); }

    formatDate(dateString) {
        if (!dateString) return '—';
        try { return new Date(dateString).toLocaleString(); } catch { return dateString; }
    }

    render() {
        const g = this.gradeData || {};
        const studentName = [g.student_first_name, g.student_last_name].filter(Boolean).join(' ');
        const classLabel = g.class_name ? `${g.class_name}${g.class_section ? ' ('+g.class_section+')' : ''}` : '';
        const subjectName = g.subject_name || '';
        const periodName = g.grading_period_name || '';
        this.innerHTML = `
            <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" size="lg" close-button="true">
                <div slot="title">Student Grade Details</div>
                <div class="space-y-5 p-2">
                    <!-- Header -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-user-graduate text-blue-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Student & Class</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Student</label>
                                <p class="text-gray-900 text-sm font-medium">${studentName || '—'}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Class</label>
                                <p class="text-gray-900 text-sm font-medium">${classLabel || '—'}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Subject & Period -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-book text-purple-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Subject & Period</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                                <p class="text-gray-900 text-sm font-medium">${subjectName || '—'}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Grading Period</label>
                                <p class="text-gray-900 text-sm font-medium">${periodName || '—'}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Scores & Final -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-chart-line text-green-600"></i>
                            <h4 class="text-md font-semibold text-gray-800">Scores</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Assignment Total</label>
                                <p class="text-gray-900 text-sm font-medium">${g.assignment_total ?? '—'}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Exam Total</label>
                                <p class="text-gray-900 text-sm font-medium">${g.exam_total ?? '—'}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Final Percentage</label>
                                <p class="text-gray-900 text-sm font-medium">${g.final_percentage ?? '—'}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Final Letter Grade</label>
                                <p class="text-gray-900 text-sm font-medium">${g.final_letter_grade ?? '—'}</p>
                            </div>
                        </div>
                    </div>

                    ${g.remarks ? `
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-align-left text-amber-600"></i>
                            <h4 class="text-md font-semibold text-gray-800">Remarks</h4>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-gray-700 text-sm">${g.remarks}</p>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Timestamps -->
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-history text-gray-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Created</label>
                                <p class="text-gray-900 text-sm font-medium">${this.formatDate(g.created_at)}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-xs font-medium text-gray-600 mb-1">Updated</label>
                                <p class="text-gray-900 text-sm font-medium">${this.formatDate(g.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('student-grade-view-modal', StudentGradeViewModal);
export default StudentGradeViewModal;


