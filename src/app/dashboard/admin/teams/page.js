import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/TeamSettingsModal.js';
import '@/components/layout/adminLayout/TeamUpdateModal.js';
import '@/components/layout/adminLayout/TeamViewModal.js';
import '@/components/layout/adminLayout/TeamDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Team Management Page
 * 
 * Displays team members data using Table component
 */
class TeamManagementPage extends App {
    constructor() {
        super();
        this.teams = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.updateTeamData = null;
        this.viewTeamData = null;
        this.deleteTeamData = null;
    }

    getHeaderCounts() {
        const teams = this.get('teams') || [];
        const total = teams.length;
        const active = teams.filter(t => t?.is_active === true || (t?.status?.toString?.().toLowerCase?.() === 'active')).length;
        const inactive = teams.filter(t => t?.is_active === false || (t?.status?.toString?.().toLowerCase?.() === 'inactive')).length;
        const departments = new Set(teams.map(t => t?.department || 'Unassigned')).size;
        return { total, active, inactive, departments };
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Team Members</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-teams-info" title="About Team Members">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage staff and leadership records</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Members</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
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
                                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-building text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.departments}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Departments</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
                            <div class="flex items-center">
                                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-users text-white text-lg sm:text-xl"></i>
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
        document.title = 'Team Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('team-deleted', (event) => {
            // Remove the deleted team from the current data
            const deletedTeamId = event.detail.teamId;
            const currentTeams = this.get('teams') || [];
            const updatedTeams = currentTeams.filter(team => team.id !== deletedTeamId);
            this.set('teams', updatedTeams);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('team-saved', (event) => {
            // Add the new team to the existing data
            const newTeam = event.detail.team;
            if (newTeam) {
                const currentTeams = this.get('teams') || [];
                this.set('teams', [...currentTeams, newTeam]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('team-updated', (event) => {
            // Update the existing team in the data
            const updatedTeam = event.detail.team;
            if (updatedTeam) {
                const currentTeams = this.get('teams') || [];
                const updatedTeams = currentTeams.map(team => 
                    team.id === updatedTeam.id ? updatedTeam : team
                );
                this.set('teams', updatedTeams);
                this.updateTableData();
                // Close the update modal
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
        if (action === 'show-teams-info') {
            this.showTeamsInfo();
        }
    }

    showTeamsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-users text-blue-500 mr-2"></i>
                <span class="font-semibold">About Team Members</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What is managed here?</h4>
                    <p class="text-gray-700">Maintain the school's staff directory, positions, departments, and visibility. This is separate from system user accounts.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Position</span>
                        <span class="text-sm text-gray-600">Role/title displayed publicly (e.g., Principal)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Department</span>
                        <span class="text-sm text-gray-600">Grouping for staff listings</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Status</span>
                        <span class="text-sm text-gray-600">Active members appear in listings</span>
                    </div>
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
            
            // Get the auth token
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

            // Load teams data
            const teamsResponse = await api.withToken(token).get('/teams');
            
            this.set('teams', teamsResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load teams data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewTeam = this.get('teams').find(team => team.id === detail.row.id);
        if (viewTeam) {
            this.closeAllModals();
            this.set('viewTeamData', viewTeam);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('team-view-modal');
                if (viewModal) {
                    viewModal.setTeamData(viewTeam);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editTeam = this.get('teams').find(team => team.id === detail.row.id);
        if (editTeam) {
            // Close any open modals first
            this.closeAllModals();
            this.set('updateTeamData', editTeam);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('team-update-modal');
                if (updateModal) {
                    updateModal.setTeamData(editTeam);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteTeam = this.get('teams').find(team => team.id === detail.row.id);
        if (deleteTeam) {
            // Close any open modals first
            this.closeAllModals();
            this.set('deleteTeamData', deleteTeam);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('team-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setTeamData(deleteTeam);
                }
            }, 0);
        }
    }

    onAdd(event) {
        // Close any open modals first
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onRefresh(event) {
        this.loadData();
    }

    // Update table data without full page reload
    updateTableData() {
        const teams = this.get('teams');
        if (!teams) return;

        // Prepare table data
        const tableData = teams.map((team, index) => ({
            id: team.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: team.name,
            position: team.position,
            department: team.department,
            status: team.is_active ? 'Active' : 'Inactive',
            profile_image: team.profile_image || 'No image',
            created: team.created_at,
            updated: team.updated_at
        }));

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            tableComponent.setAttribute('data', JSON.stringify(tableData));
        }
    }

    // Close all modals and dialogs
    closeAllModals() {
        this.set('showAddModal', false);
        this.set('showUpdateModal', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('updateTeamData', null);
        this.set('viewTeamData', null);
        this.set('deleteTeamData', null);
    }

    render() {
        const teams = this.get('teams');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        // Prepare table data and columns for teams
        const tableData = teams ? teams.map((team, index) => ({
            id: team.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: team.name,
            position: team.position,
            department: team.department,
            status: team.is_active ? 'Active' : 'Inactive',
            profile_image: team.profile_image || 'No image',
            created: team.created_at,
            updated: team.updated_at
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.', html: false },
            { key: 'name', label: 'Name' },
            { key: 'position', label: 'Position' },
            { key: 'department', label: 'Department' },
            { key: 'status', label: 'Status' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            ${this.renderHeader()}
            <div class="bg-white rounded-lg shadow-lg p-4">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Teams Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="Team Members Database"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search team members..."
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
            
            <!-- Add Team Modal -->
            <team-settings-modal ${showAddModal ? 'open' : ''}></team-settings-modal>
            
            <!-- Update Team Modal -->
            <team-update-modal ${showUpdateModal ? 'open' : ''}></team-update-modal>
            
            <!-- View Team Modal -->
            <team-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></team-view-modal>
            
            <!-- Delete Team Dialog -->
            <team-delete-dialog ${showDeleteDialog ? 'open' : ''}></team-delete-dialog>
        `;
    }
}

customElements.define('app-team-management-page', TeamManagementPage);
export default TeamManagementPage; 