import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/GradingPolicyAddModal.js';
import '@/components/layout/adminLayout/GradingPolicyUpdateModal.js';
import '@/components/layout/adminLayout/GradingPolicyViewModal.js';
import '@/components/layout/adminLayout/GradingPolicyDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Grading Policy Management Page
 * 
 * Displays grading policies using Table component
 */
class GradingPolicyManagementPage extends App {
    constructor() {
        super();
        this.policies = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updatePolicyData = null;
        this.viewPolicyData = null;
        this.deletePolicyData = null;
    }

    getHeaderCounts() {
        const policies = this.get('policies') || [];
        const total = policies.length;
        let active = 0;
        let inactive = 0;
        const subjectSet = new Set();
        policies.forEach((p) => {
            const isActive = Number(p.is_active) === 1 || String(p.is_active || p.status).toLowerCase() === 'active';
            if (isActive) active += 1; else inactive += 1;
            const subjectName = p.subject_name || p.subject?.name;
            if (subjectName) subjectSet.add(String(subjectName));
        });
        return { total, active, inactive, subjects: subjectSet.size };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Grading Policies</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-grading-policies-info" title="About Grading Policies">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Define assignment and exam weightings per subject</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Policies</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-check text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Active</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-pause-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.inactive}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Inactive</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-book text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.subjects}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Subjects Covered</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-layer-group text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Total</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Grading Policy Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));

        // Table actions
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));

        // Event handlers from modals/dialogs
        this.addEventListener('grading-policy-deleted', (event) => {
            const deletedId = event.detail.policyId;
            const current = this.get('policies') || [];
            this.set('policies', current.filter(p => p.id !== deletedId));
            this.updateTableData();
            this.set('showDeleteDialog', false);
        });

        this.addEventListener('grading-policy-saved', (event) => {
            const newPolicy = event.detail.policy;
            if (newPolicy) {
                const current = this.get('policies') || [];
                this.set('policies', [...current, newPolicy]);
                this.updateTableData();
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });

        this.addEventListener('grading-policy-updated', (event) => {
            const updated = event.detail.policy;
            if (updated) {
                const current = this.get('policies') || [];
                const mapped = current.map(p => p.id === updated.id ? updated : p);
                this.set('policies', mapped);
                this.updateTableData();
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-grading-policies-info') {
            this.showGradingPoliciesInfo();
        }
    }

    showGradingPoliciesInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-balance-scale text-blue-500 mr-2"></i>
                <span class="font-semibold">About Grading Policies</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What is a Grading Policy?</h4>
                    <p class="text-gray-700">Grading policies define the maximum scores and weighting rules for assignments and exams per subject. They ensure consistent grading across classes.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Subject</span>
                        <span class="text-sm text-gray-600">The policy applies to this subject</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Assignment Max</span>
                        <span class="text-sm text-gray-600">Maximum total for continuous assessments</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Exam Max</span>
                        <span class="text-sm text-gray-600">Maximum total for exams</span>
                    </div>
                </div>
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        Set policies before entering grades so totals and validations are enforced correctly.
                    </p>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    async loadData() {
        try {
            this.set('loading', true);
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to view data', variant: 'error', duration: 3000 });
                return;
            }

            const response = await api.withToken(token).get('/grading-policies');
            this.set('policies', response.data.data || []);
            this.updateTableData();
            this.set('loading', false);
        } catch (error) {
            this.set('loading', false);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to load grading policies', variant: 'error', duration: 3000 });
        }
    }

    onView(event) {
        const { detail } = event;
        const item = (this.get('policies') || []).find(p => p.id === detail.row.id);
        if (item) {
            this.closeAllModals();
            this.set('viewPolicyData', item);
            this.set('showViewModal', true);
            setTimeout(() => {
                const modal = this.querySelector('grading-policy-view-modal');
                if (modal) modal.setPolicyData(item);
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const item = (this.get('policies') || []).find(p => p.id === detail.row.id);
        if (item) {
            this.closeAllModals();
            this.set('updatePolicyData', item);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const modal = this.querySelector('grading-policy-update-modal');
                if (modal) modal.setPolicyData(item);
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const item = (this.get('policies') || []).find(p => p.id === detail.row.id);
        if (item) {
            this.closeAllModals();
            this.set('deletePolicyData', item);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const dialog = this.querySelector('grading-policy-delete-dialog');
                if (dialog) dialog.setPolicyData(item);
            }, 0);
        }
    }

    onAdd() {
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    updateTableData() {
        const policies = this.get('policies');
        if (!policies) return;

        const tableData = policies.map((policy, index) => ({
            id: policy.id,
            index: index + 1,
            name: policy.name,
            subject: policy.subject_name || policy.subject?.name || '',
            assignment_max_score: policy.assignment_max_score,
            exam_max_score: policy.exam_max_score,
            is_active: Number(policy.is_active) === 1 ? 'Active' : 'Inactive',
            updated: new Date(policy.updated_at || Date.now()).toLocaleDateString(),
        }));

        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updatePolicyData', null);
        this.set('viewPolicyData', null);
        this.set('deletePolicyData', null);
    }

    render() {
        const policies = this.get('policies');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');

        const tableData = policies ? policies.map((policy, index) => ({
            id: policy.id,
            index: index + 1,
            name: policy.name,
            subject: policy.subject_name || policy.subject?.name || '',
            assignment_max_score: policy.assignment_max_score,
            exam_max_score: policy.exam_max_score,
            is_active: Number(policy.is_active) === 1 ? 'Active' : 'Inactive',
            updated: new Date(policy.updated_at || Date.now()).toLocaleDateString(),
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'name', label: 'Policy Name' },
            { key: 'subject', label: 'Subject' },
            { key: 'assignment_max_score', label: 'Assign. Max' },
            { key: 'exam_max_score', label: 'Exam Max' },
            { key: 'is_active', label: 'Status' },
            { key: 'updated', label: 'Updated' }
        ];

        return `
            ${this.renderHeader()}
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <div class="mb-8">
                        <ui-table 
                            title="Grading Policies Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search policies..."
                            pagination
                            page-size="50"
                            action
                            addable
                            refresh
                            print
                            bordered
                            striped
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>

            <grading-policy-add-modal ${showAddModal ? 'open' : ''}></grading-policy-add-modal>
            <grading-policy-update-modal ${showUpdateModal ? 'open' : ''}></grading-policy-update-modal>
            <grading-policy-view-modal ${showViewModal ? 'open' : ''}></grading-policy-view-modal>
            <grading-policy-delete-dialog ${showDeleteDialog ? 'open' : ''}></grading-policy-delete-dialog>
        `;
    }
}

customElements.define('app-grading-policy-management-page', GradingPolicyManagementPage);
export default GradingPolicyManagementPage;


