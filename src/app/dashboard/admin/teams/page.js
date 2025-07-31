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

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Team Management | School System';
        this.loadData();
        
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