import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/ApplicationViewModal.js';
import '@/components/layout/adminLayout/AdmissionConfigModal.js';
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
        this.showConfigModal = false;
    }

    getHeaderCounts() {
        const apps = this.get('applications') || [];
        const total = apps.length;
        const grades = new Set(apps.map(a => a.grade || 'Unspecified')).size;
        const thisMonth = apps.filter(a => {
            const d = new Date(a.created_at);
            const now = new Date();
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length;
        const withEmail = apps.filter(a => (a.email || '').trim().length > 0).length;
        return { total, grades, thisMonth, withEmail };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Applications</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-applications-info" title="About Applications">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-applications-page').loadData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                                <button 
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    data-action="show-settings"
                                    title="Application Settings">
                                    <i class="fas fa-cog text-lg group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage guest/student applications</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Applications</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-layer-group text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.grades}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Grades</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-calendar-plus text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.thisMonth}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">This Month</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-envelope text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.withEmail}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">With Email</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-database text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Records</div>
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
        document.title = 'Applications | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        this.addEventListener('table-row-click', this.onRowClick.bind(this));
        this.addEventListener('table-refresh', this.onRefresh.bind(this));
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-applications-info') {
            this.showApplicationsInfo();
        } else if (action === 'show-settings') {
            this.showSettings();
        }
    }

    showApplicationsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-file-alt text-blue-500 mr-2"></i>
                <span class="font-semibold">About Applications</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What is managed here?</h4>
                    <p class="text-gray-700">Incoming admission applications submitted by guardians/students. Review details and follow up via provided contacts.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Applicant</span>
                        <span class="text-sm text-gray-600">Student name and application number</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Grade</span>
                        <span class="text-sm text-gray-600">Target class/grade level</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Contact</span>
                        <span class="text-sm text-gray-600">Parent phone and email for communication</span>
                    </div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    showSettings() {
        this.set('showConfigModal', true);
        setTimeout(() => {
            const configModal = this.querySelector('admission-config-modal');
            if (configModal) {
                configModal.open();
            }
        }, 0);
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
        const showConfigModal = this.get('showConfigModal');
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
            <admission-config-modal ${showConfigModal ? 'open' : ''}></admission-config-modal>
        `;
    }
}

customElements.define('app-applications-page', ApplicationsPage);
export default ApplicationsPage; 