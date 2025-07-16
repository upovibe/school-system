import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * User Role Delete Dialog Component
 * 
 * A dialog component for confirming user role deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - user-role-deleted: Fired when a user role is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class UserRoleDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.roleData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete)
        this.addEventListener('confirm', () => {
            this.deleteRole();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.resetForm();
    }

    // Reset form to initial state
    resetForm() {
        this.roleData = null;
        this.render();
    }

    // Set user role data for deletion
    setUserRoleData(roleData) {
        this.roleData = { ...roleData };
        this.render();
    }

    async deleteRole() {
        try {
            if (!this.roleData || !this.roleData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'No role data available for deletion',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete user roles',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete role
            const response = await api.withToken(token).delete(`/roles/${this.roleData.id}`);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'User role deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the deleted role ID
                this.dispatchEvent(new CustomEvent('user-role-deleted', {
                    detail: { userRoleId: this.roleData.id }
                }));

                this.close();
            } else {
                throw new Error(response.data.message || 'Failed to delete user role');
            }

        } catch (error) {
            console.error('❌ Error deleting user role:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || error.message || 'Failed to delete user role',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        if (!this.roleData) {
            return `
                <ui-dialog 
                    title="Delete User Role"
                    ${this.hasAttribute('open') ? 'open' : ''}>
                    
                    <div class="text-center py-8 text-gray-500">
                        <p>No role data available</p>
                    </div>

                    <div slot="footer" class="flex justify-end space-x-3">
                        <ui-button 
                            variant="secondary"
                            onclick="this.closest('user-role-delete-dialog').close()">
                            Cancel
                        </ui-button>
                    </div>
                </ui-dialog>
            `;
        }

        return `
            <ui-dialog 
                title="Delete User Role"
                ${this.hasAttribute('open') ? 'open' : ''}>
                
                <div class="space-y-4">
                    <div class="text-center">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        
                        <h3 class="text-lg font-medium text-gray-900 mb-2">
                            Delete User Role
                        </h3>
                        
                        <p class="text-sm text-gray-500 mb-4">
                            Are you sure you want to delete the user role "<strong>${this.roleData.name}</strong>"?
                        </p>
                        
                        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-yellow-800">
                                        Warning
                                    </h3>
                                    <div class="mt-2 text-sm text-yellow-700">
                                        <p>This action cannot be undone. The role will be permanently deleted from the system.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div slot="footer" class="flex justify-end space-x-3">
                    <ui-button 
                        variant="secondary"
                        onclick="this.closest('user-role-delete-dialog').close()">
                        Cancel
                    </ui-button>
                    <ui-button 
                        variant="danger"
                        onclick="this.closest('user-role-delete-dialog').deleteRole()">
                        Delete Role
                    </ui-button>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('user-role-delete-dialog', UserRoleDeleteDialog);
export default UserRoleDeleteDialog; 