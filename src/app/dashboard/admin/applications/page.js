import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/ui/SearchDropdown.js';
import '@/components/layout/adminLayout/ApplicationViewModal.js';
import '@/components/layout/adminLayout/ApplicationConfigDialog.js';
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
        this.filters = { gender: '', status: '', class_applying: '' };
        this.filteredApplications = null;
    }

    getHeaderCounts() {
        const apps = this.get('filteredApplications') || this.get('applications') || [];
        const total = apps.length;
        const grades = new Set(apps.map(a => a.class_applying || 'Unspecified')).size;
        const thisMonth = apps.filter(a => {
            const d = new Date(a.created_at);
            const now = new Date();
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length;
        const withEmail = apps.filter(a => (a.email || '').trim().length > 0).length;
        const approved = apps.filter(a => a.status === 'approved').length;
        const rejected = apps.filter(a => a.status === 'rejected').length;
        const pending = apps.filter(a => a.status === 'pending').length;
        return { total, grades, thisMonth, withEmail, approved, rejected, pending };
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
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-applications-info" title="Application Configuration">
                                    <i class="fas fa-cog text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-applications-page').loadData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
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
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-check-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.approved}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Approved</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-red-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-times-circle text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.rejected}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Rejected</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-clock text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.pending}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Pending</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
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
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Applications | School System';
        
        // Ensure clean modal state on component initialization - PREVENT EMPTY MODAL ISSUE
        this.closeAllModals();
        
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events - EXACT PATTERN FROM WORKING PAGES
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-refresh', this.onRefresh.bind(this));
        this.addEventListener('application-status-changed', this.onStatusChanged.bind(this));

        // Filter interactions
        this.addEventListener('change', (e) => {
            const dd = e.target.closest('ui-search-dropdown');
            if (!dd) return;

            const name = dd.getAttribute('name');
            if (!name) return;
            this.filters[name] = dd.value;
            this.applyFilters();
        });

        this.addEventListener('click', (e) => {
            const applyBtn = e.target.closest('[data-action="apply-filters"]');
            if (applyBtn) { e.preventDefault(); this.applyFilters(); return; }
            const clearBtn = e.target.closest('[data-action="clear-filters"]');
            if (clearBtn) {
                e.preventDefault();
                this.filters = { gender: '', status: '', class_applying: '' };
                this.filteredApplications = null;
                this.render();
            }
        });

        // Listen for modal close events to clear data - PREVENT EMPTY MODAL ISSUE
        this.addEventListener('application-view-closed', (event) => {
            this.set('showViewModal', false);
            this.set('viewApplicationData', null);
        });

        // Listen for status changes to close modal
        this.addEventListener('application-status-changed', (event) => {
            // Close the modal after status change
            this.set('showViewModal', false);
            this.set('viewApplicationData', null);
        });
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-applications-info') {
            this.showApplicationsInfo();
        }
    }

    showApplicationsInfo() {
        const dialog = this.querySelector('application-config-dialog');
        if (dialog) {
            dialog.open();
        }
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


    // EXACT PATTERN FROM WORKING PAGES
    onView(event) {
        const { detail } = event;
        const applications = this.get('applications') || [];
        const application = applications.find(app => app.id === detail.row.id);
        if (application) {
            this.closeAllModals();
            this.set('viewApplicationData', application);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('application-view-modal');
                if (viewModal) {
                    viewModal.setApplicationData(application);
                }
            }, 0);
        }
    }

    onRefresh() {
        // Close any open modals before refreshing - PREVENT EMPTY MODAL ISSUE
        this.closeAllModals();
        this.loadData();
    }

    onStatusChanged(event) {
        const { detail } = event;
        const { applicationId, newStatus } = detail;
        
        // Update the local applications data
        const applications = this.get('applications') || [];
        const updatedApplications = applications.map(app => 
            app.id === applicationId 
                ? { ...app, status: newStatus }
                : app
        );
        
        // Update the state to refresh the header counts and table
        this.set('applications', updatedApplications);
        // Re-apply filters to update filtered applications as well
        this.applyFilters();
        // Force re-render to update the UI immediately
        this.render();
    }

    applyFilters() {
        const applications = this.get('applications') || [];
        
        const filtered = applications.filter(app => {
            // Gender filter
            if (this.filters.gender && app.gender !== this.filters.gender) {
                return false;
            }
            
            // Status filter
            if (this.filters.status && app.status !== this.filters.status) {
                return false;
            }
            
            // Class applying filter
            if (this.filters.class_applying && app.class_applying !== this.filters.class_applying) {
                return false;
            }
            
            return true;
        });
        
        this.set('filteredApplications', filtered);
    }

    // EXACT PATTERN FROM WORKING PAGES - Close all modals and dialogs
    closeAllModals() {
        this.set('showViewModal', false);
        this.set('viewApplicationData', null);
    }

    renderFilters() {
        const applications = this.get('applications') || [];
        
        // Hardcoded gender options
        const genderOptions = `
            <ui-option value="male">Male</ui-option>
            <ui-option value="female">Female</ui-option>
        `;
        
        // Hardcoded status options
        const statusOptions = `
            <ui-option value="pending">Pending</ui-option>
            <ui-option value="approved">Approved</ui-option>
            <ui-option value="rejected">Rejected</ui-option>
        `;
        
        // Get unique values for class dropdown
        const classes = [...new Set(applications.map(a => a.class_applying).filter(Boolean))];
        const classOptions = classes.map(c => `<ui-option value="${c}">${c}</ui-option>`).join('');

        const { gender, status, class_applying } = this.filters;
        
        return `
            <div class="bg-gray-100 rounded-md p-3 mb-4 border border-gray-300">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Gender</label>
                        <ui-search-dropdown name="gender" placeholder="All genders" class="w-full" value="${gender || ''}">
                            ${genderOptions}
                        </ui-search-dropdown>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Status</label>
                        <ui-search-dropdown name="status" placeholder="All statuses" class="w-full" value="${status || ''}">
                            ${statusOptions}
                        </ui-search-dropdown>
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Class Applying</label>
                        <ui-search-dropdown name="class_applying" placeholder="All classes" class="w-full" value="${class_applying || ''}">
                            ${classOptions}
                        </ui-search-dropdown>
                    </div>
                </div>
                <div class="flex justify-between gap-2 mt-3 w-full">                    
                    <div class="flex gap-2">
                        <ui-button type="button" data-action="apply-filters" variant="primary" size="sm">
                            <i class="fas fa-filter mr-1"></i> Apply Filters
                        </ui-button>
                        <ui-button type="button" data-action="clear-filters" variant="secondary" size="sm">
                            <i class="fas fa-times mr-1"></i> Clear Filters
                        </ui-button>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        const applications = this.get('applications');
        const filteredApplications = this.get('filteredApplications');
        const displayApplications = filteredApplications || applications;
        const loading = this.get('loading');
        const showViewModal = this.get('showViewModal');
        const tableData = displayApplications ? displayApplications.map((app, index) => ({
            id: app.id,
            index: index + 1,
            applicant_number: app.applicant_number,
            first_name: app.first_name,
            last_name: app.last_name,
            gender: app.gender,
            level_applying: app.level_applying,
            class_applying: app.class_applying,
            phone_number: app.phone_number,
            email: app.email,
            status: app.status,
            created: app.created_at,
            updated: app.updated_at
        })) : [];
        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'applicant_number', label: 'Applicant Number' },
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
            { key: 'gender', label: 'Gender' },
            { key: 'level_applying', label: 'Level' },
            { key: 'class_applying', label: 'Class Applying' },
            { key: 'phone_number', label: 'Parent Phone' },
            { key: 'email', label: 'Parent Email' },
            { key: 'status', label: 'Status' },
            { key: 'created', label: 'Created' },
            // { key: 'updated', label: 'Updated' }
        ];
        return `
            ${this.renderHeader()}
            ${applications && applications.length > 0 ? this.renderFilters() : ''}
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
                            action
                            actions="view"
                            refresh
                            print
                            bordered
                            striped
                            class="w-full">
                        </ui-table>
                    </div>
                `}
            </div>
            <application-view-modal ${showViewModal ? 'open' : ''}></application-view-modal>
            <application-config-dialog></application-config-dialog>
        `;
    }
}

customElements.define('app-applications-page', ApplicationsPage);
export default ApplicationsPage; 