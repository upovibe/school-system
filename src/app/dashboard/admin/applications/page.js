import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/ApplicationViewModal.js';
import api from '@/services/api.js';

/**
 * Applications Management Page
 * 
 * Displays guest applications using Table component
 */
class ApplicationsPage extends App {
    constructor() {
        super();
        this.applications = null;
        this.loading = false;
        this.showViewModal = false;
        this.viewApplicationData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Applications | School System';
        this.loadData();
        this.addEventListener('table-row-click', this.onRowClick.bind(this));
        this.addEventListener('table-refresh', this.onRefresh.bind(this));
    }

    async loadData() {
        try {
            this.set('loading', true);
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to view data',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }
            // Load applications data
            const response = await api.withToken(token).get('/applications');
            this.set('applications', response.data.data);
            this.set('loading', false);
        } catch (error) {
            console.error('❌ Error loading applications:', error);
            this.set('loading', false);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load applications',
                variant: 'error',
                duration: 3000
            });
        }
    }

    onRowClick(event) {
        const { detail } = event;
        const application = this.get('applications').find(app => app.id === detail.row.id);
        if (application) {
            this.set('viewApplicationData', application);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('application-view-modal');
                if (viewModal) {
                    viewModal.setApplicationData(application);
                    viewModal.open();
                }
            }, 0);
        }
    }

    onRefresh() {
        this.loadData();
    }

    render() {
        const applications = this.get('applications');
        const loading = this.get('loading');
        const showViewModal = this.get('showViewModal');
        const tableData = applications ? applications.map((app, index) => ({
            id: app.id,
            index: index + 1,
            applicant_number: app.applicant_number,
            student_first_name: app.student_first_name,
            student_last_name: app.student_last_name,
            grade: app.grade,
            parent_phone: app.parent_phone,
            email: app.email,
            created: app.created_at,
            updated: app.updated_at
        })) : [];
        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'applicant_number', label: 'Applicant Number' },
            { key: 'student_first_name', label: 'First Name' },
            { key: 'student_last_name', label: 'Last Name' },
            { key: 'grade', label: 'Grade' },
            { key: 'parent_phone', label: 'Parent Phone' },
            { key: 'email', label: 'Email' },
            { key: 'created', label: 'Created' },
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
                            title="Applications Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search applications..."
                            pagination
                            page-size="50"
                            refresh
                            print
                            bordered
                            striped
                            clickable
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>
            <application-view-modal ${showViewModal ? 'open' : ''}></application-view-modal>
        `;
    }
}

customElements.define('app-applications-page', ApplicationsPage);
export default ApplicationsPage; 