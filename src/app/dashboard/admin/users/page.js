import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/UserAddDialog.js';
import '@/components/layout/adminLayout/UserEditDialog.js';
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
        this.users = null;
        this.loading = false;
        this.showAddModal = false;
        this.showEditDialog = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.editUserData = null;
        this.viewUserData = null;
        this.deleteUserData = null;
        this.activeTab = 'all';
        // Initialize state
        this.set('activeTab', 'all');
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'Users Management | School System';
        this.loadData();
        this.addEventListener('click', this.handleClick.bind(this));
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        
        // Listen for success events to refresh data
        this.addEventListener('user-deleted', (event) => {
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
        
        this.addEventListener('user-updated', (event) => {
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
                this.set('showEditDialog', false);
            } else {
                this.loadData();
            }
        });
        
        // Listen for modal opened event to pass data
        this.addEventListener('modal-opened', (event) => {
            const modal = event.target;
            if (modal.tagName === 'USER-EDIT-DIALOG') {
                const editUserData = this.get('editUserData');
                if (editUserData) {
                    modal.setUserData(editUserData);
                }
            } else if (modal.tagName === 'USER-VIEW-MODAL') {
                const viewUserData = this.get('viewUserData');
                if (viewUserData) {
                    modal.setUserData(viewUserData);
                }
            }
        });
    }


    handleClick(event) {
        // Check if click is inside tab navigation area
        const tabNavigation = event.target.closest('nav[aria-label="Tabs"]');
        if (tabNavigation) {
            // Handle tab clicks
            const tabButton = event.target.closest('button[data-tab]');
            if (tabButton) {
                event.stopPropagation();
                event.preventDefault();
                const tab = tabButton.getAttribute('data-tab');
                this.switchTab(tab);
                return;
            }
            // If it's inside tab nav but not a tab button, still prevent propagation
            event.stopPropagation();
            return;
        }

        // Handle header action buttons
        const actionButton = event.target.closest('button[data-action]');
        if (actionButton) {
            const action = actionButton.getAttribute('data-action');
            if (action === 'show-users-info') {
                this.showUsersInfo();
            }
            return;
        }
    }

    switchTab(tab) {
        this.set('activeTab', tab);
        // Close all modals when switching tabs to prevent unwanted modal openings
        this.closeAllModals();
    }

    showUsersInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-users text-blue-500 mr-2"></i>
                <span class="font-semibold">About Users</span>
            </div>
            <div slot="content" class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">What is managed here?</h4>
                    <p class="text-gray-700">Create and manage application users, assign roles, and control access. Keep emails unique and set appropriate statuses.</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Role</span>
                        <span class="text-sm text-gray-600">Determines access (Admin, Teacher, Student, Cashier)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Status</span>
                        <span class="text-sm text-gray-600">Active users can sign in; inactive users cannot</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Security</span>
                        <span class="text-sm text-gray-600">Passwords are hashed; avoid sharing credentials</span>
                    </div>
                </div>
            </div>
            <div slot="footer" class="flex justify-end">
                <ui-button color="primary" onclick="this.closest('ui-dialog').close()">Got it</ui-button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    getHeaderCounts() {
        const users = this.get('users') || [];
        const total = users.length;
        const active = users.filter(u => (u?.status?.toString?.().toLowerCase?.() === 'active') || u?.is_active === true).length;
        const inactive = users.filter(u => (u?.status?.toString?.().toLowerCase?.() === 'inactive') || u?.is_active === false).length;
        const roleSet = new Set(users.map(u => (u?.role || 'N/A')));
        return { total, active, inactive, roles: roleSet.size };
    }

    getFilteredUsers() {
        const users = this.get('users') || [];
        const activeTab = this.get('activeTab');
        
        if (activeTab === 'all') {
            return users;
        }
        
        return users.filter(user => {
            const role = (user?.role || '').toLowerCase();
            return role === activeTab;
        });
    }

    getRoleCounts() {
        const users = this.get('users') || [];
        const counts = {
            all: users.length,
            admin: users.filter(u => (u?.role || '').toLowerCase() === 'admin').length,
            teacher: users.filter(u => (u?.role || '').toLowerCase() === 'teacher').length,
            student: users.filter(u => (u?.role || '').toLowerCase() === 'student').length,
            cashier: users.filter(u => (u?.role || '').toLowerCase() === 'cashier').length
        };
        return counts;
    }

    renderHeader() {
        const c = this.getHeaderCounts();
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">Users</h1>
                                <button class="text-white/90 hover:text-white transition-colors" data-action="show-users-info" title="About Users">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                                <button 
                                    onclick="this.closest('app-users-page').loadData()"
                                    class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                                    title="Refresh data">
                                    <i class="fas fa-sync-alt text-lg ${this.get('loading') ? 'animate-spin' : ''} group-hover:scale-110 transition-transform duration-200"></i>
                                </button>
                            </div>
                            <p class="text-blue-100 text-base sm:text-lg">Manage user accounts and roles</p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                                <div class="text-blue-100 text-xs sm:text-sm">Total Users</div>
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
                                <div class="size-10 flex items-center justify-center bg-indigo-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                                    <i class="fas fa-id-badge text-white text-lg sm:text-xl"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xl sm:text-2xl font-bold">${c.roles}</div>
                                    <div class="text-blue-100 text-xs sm:text-sm">Distinct Roles</div>
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
            this.set('editUserData', editUser);
            this.set('showEditDialog', true);
            setTimeout(() => {
                const editDialog = this.querySelector('user-edit-dialog');
                if (editDialog) {
                    editDialog.setUserData(editUser);
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
        const filteredUsers = this.getFilteredUsers();
        if (!filteredUsers) return;

        // Prepare table data
        const tableData = filteredUsers.map((user, index) => ({
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
        this.set('showEditDialog', false);
        this.set('showViewModal', false);
        this.set('showDeleteDialog', false);
        this.set('editUserData', null);
        this.set('viewUserData', null);
        this.set('deleteUserData', null);
    }

    render() {
        const users = this.get('users');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showEditDialog = this.get('showEditDialog');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        const activeTab = this.get('activeTab');
        
        const filteredUsers = this.getFilteredUsers();
        const roleCounts = this.getRoleCounts();
        
        const tableData = filteredUsers ? filteredUsers.map((user, index) => ({
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
            ${this.renderHeader()}
            <div class="bg-white rounded-lg shadow-lg">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="p-4 space-y-4">
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                        <ui-skeleton class="h-24 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Tab Navigation -->
                    <div class="border-b border-gray-200">
                        <nav class="flex space-x-4 lg:space-x-8 px-4 lg:px-6 pt-6" aria-label="Tabs">
                            <button 
                                class="py-2 px-2 lg:px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'all' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }"
                                data-tab="all"
                                title="All Users (${roleCounts.all})">
                                <i class="fas fa-users ${roleCounts.all > 0 ? 'mr-0 lg:mr-2' : 'mr-0 lg:mr-2'}"></i>
                                <span class="hidden lg:inline">All Users (${roleCounts.all})</span>
                                <span class="lg:hidden text-xs">${roleCounts.all}</span>
                            </button>
                            <button 
                                class="py-2 px-2 lg:px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'admin' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }"
                                data-tab="admin"
                                title="Admins (${roleCounts.admin})">
                                <i class="fas fa-user-shield ${roleCounts.admin > 0 ? 'mr-0 lg:mr-2' : 'mr-0 lg:mr-2'}"></i>
                                <span class="hidden lg:inline">Admins (${roleCounts.admin})</span>
                                <span class="lg:hidden text-xs">${roleCounts.admin}</span>
                            </button>
                            <button 
                                class="py-2 px-2 lg:px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'teacher' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }"
                                data-tab="teacher"
                                title="Teachers (${roleCounts.teacher})">
                                <i class="fas fa-chalkboard-teacher ${roleCounts.teacher > 0 ? 'mr-0 lg:mr-2' : 'mr-0 lg:mr-2'}"></i>
                                <span class="hidden lg:inline">Teachers (${roleCounts.teacher})</span>
                                <span class="lg:hidden text-xs">${roleCounts.teacher}</span>
                            </button>
                            <button 
                                class="py-2 px-2 lg:px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'student' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }"
                                data-tab="student"
                                title="Students (${roleCounts.student})">
                                <i class="fas fa-graduation-cap ${roleCounts.student > 0 ? 'mr-0 lg:mr-2' : 'mr-0 lg:mr-2'}"></i>
                                <span class="hidden lg:inline">Students (${roleCounts.student})</span>
                                <span class="lg:hidden text-xs">${roleCounts.student}</span>
                            </button>
                            <button 
                                class="py-2 px-2 lg:px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'cashier' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }"
                                data-tab="cashier"
                                title="Cashiers (${roleCounts.cashier})">
                                <i class="fas fa-cash-register ${roleCounts.cashier > 0 ? 'mr-0 lg:mr-2' : 'mr-0 lg:mr-2'}"></i>
                                <span class="hidden lg:inline">Cashiers (${roleCounts.cashier})</span>
                                <span class="lg:hidden text-xs">${roleCounts.cashier}</span>
                            </button>
                        </nav>
                    </div>

                    <!-- Tab Content -->
                    <div class="p-6">
                        ${filteredUsers.length > 0 ? `
                            <ui-table 
                                title="Users"
                                data='${JSON.stringify(tableData)}'
                                columns='${JSON.stringify(tableColumns)}'
                                sortable
                                searchable
                                search-placeholder="Search users..."
                                pagination
                                page-size="50"
                                action
                                addable
                                actions="view, edit"
                                refresh
                                print
                                bordered
                                striped
                                class="w-full">
                            </ui-table>
                        ` : `
                            <div class="p-8 text-center">
                                <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                                <p class="text-gray-500">
                                    ${activeTab === 'all' 
                                        ? 'No users have been created yet.' 
                                        : `No ${activeTab}s found in the system.`
                                    }
                                </p>
                            </div>
                        `}
                    </div>
                `}
            </div>
            
            <!-- Modals and Dialogs -->
            <user-add-dialog ${showAddModal ? 'open' : ''}></user-add-dialog>
            <user-edit-dialog ${showEditDialog ? 'open' : ''}></user-edit-dialog>
            <user-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></user-view-modal>
            <user-delete-dialog ${showDeleteDialog ? 'open' : ''}></user-delete-dialog>
        `;
    }
}

customElements.define('app-users-page', UsersPage);
export default UsersPage; 