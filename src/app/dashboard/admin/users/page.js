import App from '@/core/App.js';
import '@/components/ui/Table.js';
import '@/components/ui/Button.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Skeleton.js';
import '@/components/layout/adminLayout/UserSettingsModal.js';
import '@/components/layout/adminLayout/UserUpdateModal.js';
import '@/components/layout/adminLayout/UserViewModal.js';
import '@/components/layout/adminLayout/UserDeleteDialog.js';
import api from '@/services/api.js';

/**
 * Users Page Component
 * 
 * Admin page for managing users in the school system
 * 
 * Features:
 * - Display users in a table format
 * - Add new users
 * - Edit existing users
 * - View user details
 * - Delete users
 * - Search and filter functionality
 */
class UsersPage extends App {
    constructor() {
        super();
        this.users = [];
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateUserData = null;
        this.viewUserData = null;
        this.deleteUserData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Users Management | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('user-deleted', (event) => {
            console.log('🎯 user-deleted event received:', event.detail);
            // Remove the deleted user from the current data
            const deletedUserId = event.detail.userId;
            const currentUsers = this.get('users') || [];
            const updatedUsers = currentUsers.filter(user => user.id !== deletedUserId);
            this.set('users', updatedUsers);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('user-saved', (event) => {
            console.log('🎯 user-saved event received:', event.detail);
            // Add the new user to the existing data
            const newUser = event.detail.user;
            if (newUser) {
                const currentUsers = this.get('users') || [];
                this.set('users', [...currentUsers, newUser]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        // Listen for modal closed events
        this.addEventListener('modal-closed', (event) => {
            console.log('🎯 modal-closed event received');
            // Close all modals when any modal is closed
            this.closeAllModals();
        });
        
        this.addEventListener('user-updated', (event) => {
            console.log('🎯 user-updated event received:', event.detail);
            // Update the existing user in the data
            const updatedUser = event.detail.user;
            if (updatedUser) {
                const currentUsers = this.get('users') || [];
                const updatedUsers = currentUsers.map(user => 
                    user.id === updatedUser.id ? updatedUser : user
                );
                this.set('users', updatedUsers);
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
            if (modal.tagName === 'USER-UPDATE-MODAL') {
                const updateUserData = this.get('updateUserData');
                if (updateUserData) {
                    modal.setUserData(updateUserData);
                }
            } else if (modal.tagName === 'USER-VIEW-MODAL') {
                const viewUserData = this.get('viewUserData');
                if (viewUserData) {
                    modal.setUserData(viewUserData);
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

            // Load users data
            const usersResponse = await api.withToken(token).get('/users');
            
            this.set('users', usersResponse.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load users data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewUser = this.get('users').find(user => user.id === detail.row.id);
        if (viewUser) {
            this.closeAllModals();
            this.set('viewUserData', viewUser);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('user-view-modal');
                if (viewModal) {
                    viewModal.setUserData(viewUser);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editUser = this.get('users').find(user => user.id === detail.row.id);
        if (editUser) {
            this.closeAllModals();
            this.set('updateUserData', editUser);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('user-update-modal');
                if (updateModal) {
                    updateModal.setUserData(editUser);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteUser = this.get('users').find(user => user.id === detail.row.id);
        if (deleteUser) {
            this.closeAllModals();
            this.set('deleteUserData', deleteUser);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('user-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setUserData(deleteUser);
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
        const users = this.get('users');
        if (!users) return;

        // Prepare table data
        const tableData = users.map((user, index) => ({
            id: user.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: user.name,
            email: user.email,
            role: user.role || 'N/A',
            status: user.status,
            created: new Date(user.created_at).toLocaleString(),
            updated: new Date(user.updated_at).toLocaleString(),
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
        this.set('updateUserData', null);
        this.set('viewUserData', null);
        this.set('deleteUserData', null);
    }

    render() {
        const users = this.get('users');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        const tableData = users ? users.map((user, index) => ({
            id: user.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            name: user.name,
            email: user.email,
            role: user.role || 'N/A',
            status: user.status,
            created: new Date(user.created_at).toLocaleString(),
            updated: new Date(user.updated_at).toLocaleString(),
        })) : [];

        const tableColumns = [
            { key: 'index', label: 'No.' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'status', label: 'Status' },
            { key: 'created', label: 'Created' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            <div class="bg-white rounded-lg shadow-lg p-8 m-4">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Users Table Section -->
                    <div class="mb-8">
                        ${users && users.length > 0 ? `
                            <ui-table 
                                title="Users"
                                data='${JSON.stringify(tableData)}'
                                columns='${JSON.stringify(tableColumns)}'
                                sortable
                                searchable
                                search-placeholder="Search users..."
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
                        ` : `
                            <div class="text-center py-8 text-gray-500">
                                <p>No users found in database</p>
                            </div>
                        `}
                    </div>
                `}

            </div>
            
            <!-- Modals and Dialogs -->
            <user-settings-modal ${showAddModal ? 'open' : ''}></user-settings-modal>
            <user-update-modal ${showUpdateModal ? 'open' : ''}></user-update-modal>
            <user-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></user-view-modal>
            <user-delete-dialog ${showDeleteDialog ? 'open' : ''}></user-delete-dialog>
            </div>
        `;
    }
}

customElements.define('app-users-page', UsersPage);
export default UsersPage; 