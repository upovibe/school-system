import '@/components/ui/Modal.js';

class StudentGradeViewModal extends HTMLElement {
    constructor() { super(); this.gradeData = null; }
    static get observedAttributes() { return ['open']; }
    connectedCallback() { this.render(); }
    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }
    setGradeData(grade) { this.gradeData = grade; this.render(); }

    render() {
        const g = this.gradeData || {};
        this.innerHTML = `
            <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" close-button="true">
                <div slot="title">Grade Details</div>
                <div class="space-y-3 p-2">
                    <div><span class="text-xs text-gray-500">Student</span><div class="font-medium">${[g.student_first_name, g.student_last_name].filter(Boolean).join(' ') || ''}</div></div>
                    <div><span class="text-xs text-gray-500">Class</span><div class="font-medium">${g.class_name || ''} ${g.class_section ? '('+g.class_section+')' : ''}</div></div>
                    <div><span class="text-xs text-gray-500">Subject</span><div class="font-medium">${g.subject_name || ''}</div></div>
                    <div><span class="text-xs text-gray-500">Grading Period</span><div class="font-medium">${g.grading_period_name || ''}</div></div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><span class="text-xs text-gray-500">Assignment</span><div class="font-medium">${g.assignment_total ?? ''}</div></div>
                        <div><span class="text-xs text-gray-500">Exam</span><div class="font-medium">${g.exam_total ?? ''}</div></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><span class="text-xs text-gray-500">Final %</span><div class="font-medium">${g.final_percentage ?? ''}</div></div>
                        <div><span class="text-xs text-gray-500">Letter</span><div class="font-medium">${g.final_letter_grade ?? ''}</div></div>
                    </div>
                    ${g.remarks ? `<div><span class="text-xs text-gray-500">Remarks</span><div class="font-medium">${g.remarks}</div></div>` : ''}
                    <div class="text-xs text-gray-400">Updated: ${g.updated_at ? new Date(g.updated_at).toLocaleString() : '-'}</div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('student-grade-view-modal', StudentGradeViewModal);
export default StudentGradeViewModal;


