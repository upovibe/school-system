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
        this.addEventListener('click', this.handleHeaderActions.bind(this));
        
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
                
                // Close the update modal first
                this.set('showUpdateModal', false);
                this.set('updateSettingData', null);
                
                // Update table data
                this.updateTableData();
                
                console.log('✅ Setting updated, table refreshed:', updatedSetting);
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
                } else {
                    // If no data, close the modal
                    console.log('❌ No update data found, closing modal');
                    this.set('showUpdateModal', false);
                }
            } else if (modal.tagName === 'SYSTEM-VIEW-MODAL') {
                const viewSettingData = this.get('viewSettingData');
                if (viewSettingData) {
                    modal.setSettingData(viewSettingData);
                } else {
                    // If no data, close the modal
                    console.log('❌ No view data found, closing modal');
                    this.set('showViewModal', false);
                }
            }
        });
    }

    renderHeader() {
        return `
            <div class="space-y-8 mb-4">
                <div class="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-5 text-white">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div>
                            <div class="flex items-center gap-2">
                                <h1 class="text-2xl sm:text-3xl font-bold">System Settings</h1>
                                <button class="text-white/90 mt-2 hover:text-white transition-colors" data-action="show-system-settings-info" title="About System Settings">
                                    <i class="fas fa-question-circle text-lg"></i>
                                </button>
                            </div>
                            <p class="text-indigo-100 text-base sm:text-lg">Configure global options and platform behavior</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleHeaderActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        if (action === 'show-system-settings-info') {
            this.showSystemSettingsInfo();
        }
    }

    showSystemSettingsInfo() {
        const dialog = document.createElement('ui-dialog');
        dialog.setAttribute('open', '');
        dialog.innerHTML = `
            <div slot="header" class="flex items-center">
                <i class="fas fa-cogs text-indigo-500 mr-2"></i>
                <span class="font-semibold">About System Settings</span>
            </div>
            <div slot="content" class="space-y-4">
                <p class="text-gray-700">This page manages global configuration such as feature toggles, categories, and platform defaults. Changes impact the entire system.</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Key</span>
                        <span class="text-sm text-gray-600">Unique identifier of the setting</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Value</span>
                        <span class="text-sm text-gray-600">Configured data used by the system</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm font-medium">Type & Category</span>
                        <span class="text-sm text-gray-600">Helps group and validate settings</span>
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
                if (updateModal && editSetting) {
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
        if (!settings || !Array.isArray(settings)) {
            console.log('❌ No settings data to update table');
            return;
        }

        // Prepare table data with safety checks
        const tableData = settings.map((setting, index) => {
            try {
                return {
                    id: setting.id || 0, // Keep ID for internal use
                    index: index + 1, // Add index number for display
                    setting_key: setting.setting_key || '',
                    setting_value: (setting.setting_value || '').length > 50 ? (setting.setting_value || '').substring(0, 50) + '...' : (setting.setting_value || ''),
                    setting_type: setting.setting_type || '',
                    category: setting.category || '',
                    status: setting.is_active ? 'Active' : 'Inactive',
                    updated: new Date(setting.updated_at || Date.now()).toLocaleString(),
                };
            } catch (error) {
                console.error('❌ Error processing setting:', setting, error);
                return {
                    id: setting.id || 0,
                    index: index + 1,
                    setting_key: setting.setting_key || 'Error',
                    setting_value: 'Error processing value',
                    setting_type: setting.setting_type || 'unknown',
                    category: setting.category || 'unknown',
                    status: 'Error',
                    updated: new Date().toLocaleString(),
                };
            }
        });

        console.log('🔄 Updating table with data:', tableData);

        // Find the table component and update its data
        const tableComponent = this.querySelector('ui-table');
        if (tableComponent) {
            try {
                tableComponent.setAttribute('data', JSON.stringify(tableData));
                console.log('✅ Table data updated successfully');
            } catch (error) {
                console.error('❌ Error updating table:', error);
            }
        } else {
            console.log('❌ Table component not found');
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
        
        const tableData = settings ? settings.map((setting, index) => ({
            id: setting.id, // Keep ID for internal use
            index: index + 1, // Add index number for display
            setting_key: setting.setting_key || '',
            setting_value: (setting.setting_value || '').length > 50 ? (setting.setting_value || '').substring(0, 50) + '...' : (setting.setting_value || ''),
            setting_type: setting.setting_type || '',
            category: setting.category || '',
            status: setting.is_active ? 'Active' : 'Inactive',
            updated: new Date(setting.updated_at || Date.now()).toLocaleString(),
        })) : [];

        const tableColumns = [
            // { key: 'id', label: 'ID' }, // Hidden but kept for reference
            { key: 'index', label: 'No.' },
            { key: 'setting_key', label: 'Key' },
            { key: 'setting_value', label: 'Value' },
            { key: 'setting_type', label: 'Type' },
            { key: 'category', label: 'Category' },
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
                    <!-- Settings Table Section -->
                    <div class="mb-8">
                        <ui-table 
                            title="System Settings"
                            data='${JSON.stringify(tableData).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}'
                            columns='${JSON.stringify(tableColumns).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}'
                            sortable
                            searchable
                            search-placeholder="Search settings..."
                            pagination
                            page-size="50"
                            action
                            actions="view,edit"                                
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
            <system-settings-modal ${showAddModal ? 'open' : ''}></system-settings-modal>
            <system-update-modal ${showUpdateModal ? 'open' : ''}></system-update-modal>
            <system-view-modal id="view-modal" ${showViewModal ? 'open' : ''}></system-view-modal>
            <system-delete-dialog ${showDeleteDialog ? 'open' : ''}></system-delete-dialog>
        `;
    }
}

customElements.define('app-system-settings-page', SystemSettingsPage);
export default SystemSettingsPage;
