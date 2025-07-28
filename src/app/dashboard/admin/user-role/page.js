

import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/UserRoleSettingsModal.js';
import '@/components/layout/adminLayout/UserRoleUpdateModal.js';
import '@/components/layout/adminLayout/UserRoleViewModal.js';
import '@/components/layout/adminLayout/UserRoleDeleteDialog.js';
import api from '@/services/api.js';

/**
 * User Role Settings Page
 * 
 * Displays user roles data using Table component
 */
class UserRolePage extends App {
    constructor() {
        super();
        this.userRoles = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateUserRoleData = null;
        this.viewUserRoleData = null;
        this.deleteUserRoleData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'User Role Settings | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('user-role-deleted', (event) => {
            // Remove the deleted user role from the current data
            const deletedUserRoleId = event.detail.userRoleId;
            const currentUserRoles = this.get('userRoles') || [];
            const updatedUserRoles = currentUserRoles.filter(role => role.id !== deletedUserRoleId);
            this.set('userRoles', updatedUserRoles);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('user-role-saved', (event) => {
            // Add the new user role to the existing data
            const newUserRole = event.detail.userRole;
            if (newUserRole) {
                const currentUserRoles = this.get('userRoles') || [];
                this.set('userRoles', [...currentUserRoles, newUserRole]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('user-role-updated', (event) => {
            // Update the existing user role in the data
            const updatedUserRole = event.detail.userRole;
            if (updatedUserRole) {
                const currentUserRoles = this.get('userRoles') || [];
                const updatedUserRoles = currentUserRoles.map(role => 
                    role.id === updatedUserRole.id ? updatedUserRole : role
                );
                this.set('userRoles', updatedUserRoles);
                this.updateTableData();
                // Close the update modal
                this.set('showUpdateModal', false);
            } else {
                this.loadData();
            }
        });
        
        // Listen for modal opened event to pass data
        this.addEventListener('modal-opened', (event) => {
            const modal = event.target;
            if (modal.tagName === 'USER-ROLE-UPDATE-MODAL') {
                const updateUserRoleData = this.get('updateUserRoleData');
                if (updateUserRoleData) {
                    modal.setUserRoleData(updateUserRoleData);
                }
            } else if (modal.tagName === 'USER-ROLE-VIEW-MODAL') {
                const viewUserRoleData = this.get('viewUserRoleData');
                if (viewUserRoleData) {
                    modal.setUserRoleData(viewUserRoleData);
                }
            }
        });
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

            // Load user roles data
            const userRolesResponse = await api.withToken(token).get('/roles');
            
            this.set('userRoles', userRolesResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load user roles data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewUserRole = this.get('userRoles').find(role => role.id === detail.row.id);
        if (viewUserRole) {
            this.closeAllModals();
            this.set('viewUserRoleData', viewUserRole);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('user-role-view-modal');
                if (viewModal) {
                    viewModal.setUserRoleData(viewUserRole);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editUserRole = this.get('userRoles').find(role => role.id === detail.row.id);
        if (editUserRole) {
            this.closeAllModals();
            this.set('updateUserRoleData', editUserRole);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('user-role-update-modal');
                if (updateModal) {
                    updateModal.setUserRoleData(editUserRole);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteUserRole = this.get('userRoles').find(role => role.id === detail.row.id);
        if (deleteUserRole) {
            this.closeAllModals();
            this.set('deleteUserRoleData', deleteUserRole);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('user-role-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setUserRoleData(deleteUserRole);
                }
            }, 0);
        }
    }

    onAdd(event) {
        this.closeAllModals();
        this.set('showAddModal', true);
    }

    onRefresh(event) {
        this.loadData();
    }

    // Update table data without full page reload
    updateTableData() {
        const userRoles = this.get('userRoles');
        if (!userRoles) return;

        // Prepare table data
        const tableData = userRoles.map((role, index) => ({
            id: role.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: role.name,
            description: role.description,
            created: new Date(role.created_at).toLocaleString(),
            updated: new Date(role.updated_at).toLocaleString(),
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
        this.set('updateUserRoleData', null);
        this.set('viewUserRoleData', null);
        this.set('deleteUserRoleData', null);
    }

    render() {
        const userRoles = this.get('userRoles');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        const tableData = userRoles ? userRoles.map((role, index) => ({
            id: role.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: role.name,
            description: role.description,
            created: new Date(role.created_at).toLocaleString(),
            updated: new Date(role.updated_at).toLocaleString(),
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description' },
            { key: 'created', label: 'Created' },
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
                    <!-- User Roles Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="User Roles"
                            data='${JSON.stringify(tableData)}'
                            columns='${JSON.stringify(tableColumns)}'
                            sortable
                            searchable
                            search-placeholder="Search user roles..."
                            pagination
                            page-size="10"
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
            
            <!-- Modals and Dialogs -->
            <user-role-settings-modal ${showAddModal ? 'open' : ''}></user-role-settings-modal>
            <user-role-update-modal ${showUpdateModal ? 'open' : ''}></user-role-update-modal>
            <user-role-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></user-role-view-modal>
            <user-role-delete-dialog ${showDeleteDialog ? 'open' : ''}></user-role-delete-dialog>
        `;
    }
}

customElements.define('app-user-role-page', UserRolePage);
export default UserRolePage;
