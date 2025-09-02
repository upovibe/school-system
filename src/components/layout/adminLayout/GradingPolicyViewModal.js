import '@/components/ui/Modal.js';
import '@/components/ui/Badge.js';

class GradingPolicyViewModal extends HTMLElement {
    constructor() {
        super();
        this.policyData = null;
    }

    static get observedAttributes() { return ['open']; }

    connectedCallback() {
        this.render();
        this.addEventListener('cancel', () => this.close());
    }

    open() { this.setAttribute('open', ''); }
    close() { this.removeAttribute('open'); }

    setPolicyData(policy) { this.policyData = policy; this.render(); }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return dateString; }
    }

    renderBoundaries(boundaries) {
        let list = [];
        try {
            list = Array.isArray(boundaries) ? boundaries : JSON.parse(boundaries || '[]');
        } catch { list = []; }
        if (!Array.isArray(list) || list.length === 0) return '<p class="text-sm text-gray-500">No grade boundaries set.</p>';
        return `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                ${list.map(b => `<div class="bg-gray-50 p-2 rounded text-sm"><span class="font-medium">${b.grade}</span>: min ${b.min}</div>`).join('')}
            </div>
        `;
    }

    render() {
        this.innerHTML = `
            <ui-modal ${this.hasAttribute('open') ? 'open' : ''} position="right" size="lg" close-button="true">
                <div slot="title">View Grading Policy</div>
                <div>
                    ${this.policyData ? `
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.policyData.name || 'N/A'}</h3>
                            <ui-badge color="${Number(this.policyData.is_active) === 1 ? 'success' : 'error'}">
                                <i class="fas fa-${Number(this.policyData.is_active) === 1 ? 'check' : 'times'} mr-1"></i>
                                ${Number(this.policyData.is_active) === 1 ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>
                        <div class="border-b pb-4 mt-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Policy Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
                                    <p class="text-gray-900 text-sm font-medium">${this.policyData.name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <p class="text-gray-900 text-sm font-medium">${this.policyData.subject_name || this.policyData.subject?.name || ''}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Max</label>
                                    <p class="text-gray-900 text-sm font-medium">${this.policyData.assignment_max_score}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Exam Max</label>
                                    <p class="text-gray-900 text-sm font-medium">${this.policyData.exam_max_score}</p>
                                </div>
                            </div>
                        </div>
                        <div class="border-b pb-4 mt-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-stream text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Grade Boundaries</h4>
                            </div>
                            ${this.renderBoundaries(this.policyData.grade_boundaries)}
                        </div>
                        <div class="border-b pb-4 mt-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-align-left text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Description</h4>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <p class="text-gray-700 text-sm">${this.policyData.description || ''}</p>
                            </div>
                        </div>
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-history text-gray-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Created</label>
                                    <p class="text-gray-900 text-sm font-medium">${this.formatDate(this.policyData.created_at)}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Updated</label>
                                    <p class="text-gray-900 text-sm font-medium">${this.formatDate(this.policyData.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No grading policy data to display</p>
                        </div>
                    `}
                </div>
                
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Close</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('grading-policy-view-modal', GradingPolicyViewModal);
export default GradingPolicyViewModal;


