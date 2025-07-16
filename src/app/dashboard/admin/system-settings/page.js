import App from '@/core/App.js';
import '@/components/ui/Card.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Table.js';
import '@/components/ui/Skeleton.js';
import '@/components/ui/Dialog.js';
import '@/components/layout/adminLayout/SystemSettingsModal.js';
import '@/components/layout/adminLayout/SystemUpdateModal.js';
import '@/components/layout/adminLayout/SystemViewModal.js';
import '@/components/layout/adminLayout/SystemDeleteDialog.js';
import api from '@/services/api.js';

/**
 * System Settings Page
 * 
 * Displays system settings data using Table component
 */
class SystemSettingsPage extends App {
    constructor() {
        super();
        this.settings = null;
        this.loading = false;
        this.showAddModal = false;
        this.showUpdateModal = false;
        this.showViewModal = false;
        this.showDeleteDialog = false;
        this.updateSettingData = null;
        this.viewSettingData = null;
        this.deleteSettingData = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'System Settings | School System';
        this.loadData();
        
        // Add event listeners for table events
        this.addEventListener('table-view', this.onView.bind(this));
        this.addEventListener('table-edit', this.onEdit.bind(this));
        this.addEventListener('table-delete', this.onDelete.bind(this));
        this.addEventListener('table-add', this.onAdd.bind(this));
        

        
        // Listen for success events to refresh data
        this.addEventListener('setting-deleted', (event) => {
            // Remove the deleted setting from the current data
            const deletedSettingId = event.detail.settingId;
            const currentSettings = this.get('settings') || [];
            const updatedSettings = currentSettings.filter(setting => setting.id !== deletedSettingId);
            this.set('settings', updatedSettings);
            this.updateTableData();
            
            // Close the delete dialog
            this.set('showDeleteDialog', false);
        });
        
        this.addEventListener('setting-saved', (event) => {
            // Add the new setting to the existing data
            const newSetting = event.detail.setting;
            if (newSetting) {
                const currentSettings = this.get('settings') || [];
                this.set('settings', [...currentSettings, newSetting]);
                this.updateTableData();
                // Close the add modal
                this.set('showAddModal', false);
            } else {
                this.loadData();
            }
        });
        
        this.addEventListener('setting-updated', (event) => {
            // Update the existing setting in the data
            const updatedSetting = event.detail.setting;
            if (updatedSetting) {
                const currentSettings = this.get('settings') || [];
                const updatedSettings = currentSettings.map(setting => 
                    setting.id === updatedSetting.id ? updatedSetting : setting
                );
                this.set('settings', updatedSettings);
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
            if (modal.tagName === 'SYSTEM-UPDATE-MODAL') {
                const updateSettingData = this.get('updateSettingData');
                if (updateSettingData) {
                    modal.setSettingData(updateSettingData);
                }
            } else if (modal.tagName === 'SYSTEM-VIEW-MODAL') {
                const viewSettingData = this.get('viewSettingData');
                if (viewSettingData) {
                    modal.setSettingData(viewSettingData);
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

            // Load settings data
            const settingsResponse = await api.withToken(token).get('/settings');
            
            this.set('settings', settingsResponse.data.data);
            this.set('loading', false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.set('loading', false);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load settings data',
                variant: 'error',
                duration: 3000
            });
        }
    }

    // Action handlers
    onView(event) {
        const { detail } = event;
        const viewSetting = this.get('settings').find(s => s.id === detail.row.id);
        if (viewSetting) {
            this.closeAllModals();
            this.set('viewSettingData', viewSetting);
            this.set('showViewModal', true);
            setTimeout(() => {
                const viewModal = this.querySelector('system-view-modal');
                if (viewModal) {
                    viewModal.setSettingData(viewSetting);
                }
            }, 0);
        }
    }

    onEdit(event) {
        const { detail } = event;
        const editSetting = this.get('settings').find(s => s.id === detail.row.id);
        if (editSetting) {
            this.closeAllModals();
            this.set('updateSettingData', editSetting);
            this.set('showUpdateModal', true);
            setTimeout(() => {
                const updateModal = this.querySelector('system-update-modal');
                if (updateModal) {
                    updateModal.setSettingData(editSetting);
                }
            }, 0);
        }
    }

    onDelete(event) {
        const { detail } = event;
        const deleteSetting = this.get('settings').find(s => s.id === detail.row.id);
        if (deleteSetting) {
            this.closeAllModals();
            this.set('deleteSettingData', deleteSetting);
            this.set('showDeleteDialog', true);
            setTimeout(() => {
                const deleteDialog = this.querySelector('system-delete-dialog');
                if (deleteDialog) {
                    deleteDialog.setSettingData(deleteSetting);
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
        const settings = this.get('settings');
        if (!settings) return;

        // Prepare table data
        const tableData = settings.map(setting => ({
            id: setting.id,
            setting_key: setting.setting_key,
            setting_value: setting.setting_value.length > 50 ? setting.setting_value.substring(0, 50) + '...' : setting.setting_value,
            setting_type: setting.setting_type,
            category: setting.category,
            status: setting.is_active ? 'Active' : 'Inactive',
            updated: new Date(setting.updated_at).toLocaleString(),
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
        this.set('updateSettingData', null);
        this.set('viewSettingData', null);
        this.set('deleteSettingData', null);
    }

    render() {
        const settings = this.get('settings');
        const loading = this.get('loading');
        const showAddModal = this.get('showAddModal');
        const showUpdateModal = this.get('showUpdateModal');
        const showViewModal = this.get('showViewModal');
        const showDeleteDialog = this.get('showDeleteDialog');
        
        const tableData = settings ? settings.map(setting => ({
            id: setting.id,
            setting_key: setting.setting_key,
            setting_value: setting.setting_value.length > 50 ? setting.setting_value.substring(0, 50) + '...' : setting.setting_value,
            setting_type: setting.setting_type,
            category: setting.category,
            status: setting.is_active ? 'Active' : 'Inactive',
            updated: new Date(setting.updated_at).toLocaleString(),
        })) : [];

        const tableColumns = [
            { key: 'id', label: 'ID' },
            { key: 'setting_key', label: 'Key' },
            { key: 'setting_value', label: 'Value' },
            { key: 'setting_type', label: 'Type' },
            { key: 'category', label: 'Category' },
            { key: 'status', label: 'Status' },
            { key: 'updated', label: 'Updated' }
        ];
        
        return `
            <div class="bg-white rounded-lg shadow-lg p-8 m-4">
                ${loading ? `
                    <!-- Simple Skeleton Loading -->
                    <div class="space-y-4">
                        <ui-skeleton class="h-8 w-full"></ui-skeleton>
                        <ui-skeleton class="h-8 w-full"></ui-skeleton>
                        <ui-skeleton class="h-8 w-full"></ui-skeleton>
                    </div>
                ` : `
                    <!-- Settings Table Section -->
                    <div class="mb-8">
                        ${settings && settings.length > 0 ? `
                            <ui-table 
                                title="System Settings"
                                data='${JSON.stringify(tableData)}'
                                columns='${JSON.stringify(tableColumns)}'
                                sortable
                                searchable
                                search-placeholder="Search settings..."
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
                                <p>No settings found in database</p>
                            </div>
                        `}
                    </div>
                `}
            </div>
            
            <!-- Modals and Dialogs -->
            <system-settings-modal ${showAddModal ? 'open' : ''}></system-settings-modal>
            <system-update-modal ${showUpdateModal ? 'open' : ''}></system-update-modal>
            <system-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></system-view-modal>
            <system-delete-dialog ${showDeleteDialog ? 'open' : ''}></system-delete-dialog>
        `;
    }
}

customElements.define('app-system-settings-page', SystemSettingsPage);
export default SystemSettingsPage;
