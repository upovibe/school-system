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

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Grading Policy Management | School System';
        this.loadData();

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


