import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * Academic Year Archive Dialog Component
 * 
 * Displays confirmation dialog for archiving academic years
 */
class AcademicYearArchiveDialog extends HTMLElement {
    constructor() {
        super();
        this.academicYearData = null;
        this.isArchiveMode = false;
        this.loading = false;
        
        // Ensure the component is visible
        this.style.display = 'block';
        this.style.position = 'relative';
        this.style.zIndex = '1000';
    }

    connectedCallback() {
        this.render();
        this.addEventListener('click', this.handleActions.bind(this));
    }

    setAcademicYearData(year) {
        this.academicYearData = year;
        this.render();
    }

    setArchiveMode(isArchive) {
        this.isArchiveMode = isArchive;
        this.render();
    }

    // Method to set data and automatically open in archive mode
    setDataAndOpen(year) {
        this.academicYearData = year;
        this.isArchiveMode = true;
        this.render();
        
        // Ensure the dialog is visible
        this.style.display = 'block';
    }

    async handleActions(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        
        switch (action) {
            case 'archive-year':
                await this.archiveAcademicYear();
                break;
            case 'delete-year':
                await this.deleteAcademicYear();
                break;
            case 'close-dialog':
                this.close();
                break;
        }
    }

    async archiveAcademicYear() {
        if (!this.academicYearData) return;
        
        try {
            this.setLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                this.showToast('Authentication Error', 'Please log in to archive academic years', 'error');
                return;
            }

            // Call the archive API endpoint
            const response = await api.withToken(token).post(`/academic-years/${this.academicYearData.id}/archive`);
            
            if (response.data.success) {
                this.showToast('Success', 'Academic year archived successfully', 'success');
                
                // Dispatch event to notify parent component
                this.dispatchEvent(new CustomEvent('academic-year-archived', {
                    detail: { 
                        academicYearId: this.academicYearData.id,
                        archiveRecordId: response.data.archive_record_id
                    }
                }));
                
                // Close dialog
                this.close();
            } else {
                throw new Error(response.data.message || 'Archive failed');
            }
            
        } catch (error) {
            console.error('❌ Error archiving academic year:', error);
            this.showToast('Archive Error', error.response?.data?.message || 'Failed to archive academic year', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async deleteAcademicYear() {
        if (!this.academicYearData) return;
        
        try {
            this.setLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                this.showToast('Authentication Error', 'Please log in to delete academic years', 'error');
                return;
            }

            // Call the delete API endpoint
            const response = await api.withToken(token).delete(`/academic-years/${this.academicYearData.id}`);
            
            if (response.data.success) {
                this.showToast('Success', 'Academic year deleted successfully', 'success');
                
                // Dispatch event to notify parent component
                this.dispatchEvent(new CustomEvent('academic-year-deleted', {
                    detail: { academicYearId: this.academicYearData.id }
                }));
                
                // Close dialog
                this.close();
            } else {
                throw new Error(response.data.message || 'Delete failed');
            }
            
        } catch (error) {
            console.error('❌ Error deleting academic year:', error);
            this.showToast('Delete Error', error.response?.data?.message || 'Failed to delete academic year', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.loading = loading;
        this.render();
    }

    showToast(title, message, variant = 'info') {
        // Dispatch custom event for toast notification
        this.dispatchEvent(new CustomEvent('show-toast', {
            detail: { title, message, variant }
        }));
    }

    open() {
        this.setAttribute('open', '');
        this.style.display = 'block';
    }

    close() {
        this.removeAttribute('open');
        this.style.display = 'none';
        this.innerHTML = '';
    }

    render() {
        if (!this.academicYearData) {
            // Don't render anything if no data
            this.innerHTML = '';
            return;
        }

        const year = this.academicYearData;
        
        if (this.isArchiveMode) {
            // Archive mode
            this.innerHTML = `
                <ui-dialog open>
                    <div slot="header" class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="fas fa-archive text-orange-500 mr-2"></i>
                            <span class="font-semibold">Archive Academic Year</span>
                        </div>
                        <button class="text-gray-400 hover:text-gray-600" data-action="close-dialog">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div slot="content" class="space-y-6">
                        <!-- Warning Message -->
                        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-yellow-700">
                                        <strong>Warning:</strong> You are about to archive the academic year <strong>${year.year_code}</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Year Information -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Academic Year Details</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">Year Code</label>
                                    <p class="text-lg font-semibold text-gray-800">${year.year_code}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">Display Name</label>
                                    <p class="text-lg font-semibold text-gray-800">${year.display_name}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">Start Date</label>
                                    <p class="text-lg font-semibold text-gray-800">${year.start_date}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">End Date</label>
                                    <p class="text-lg font-semibold text-gray-800">${year.end_date}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">Status</label>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ${year.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">Current Year</label>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${year.is_current ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                                        ${year.is_current ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- What Happens When Archived -->
                        <div class="bg-blue-50 rounded-lg p-4">
                            <h3 class="text-lg font-semibold text-blue-800 mb-3">What Happens When Archived?</h3>
                            <ul class="list-disc list-inside text-blue-700 space-y-2">
                                <li><strong>Complete Data Snapshot:</strong> All classes, students, teachers, grades, and fees will be preserved</li>
                                <li><strong>Historical Record:</strong> Data will be stored in the Academic Year Records for future reference</li>
                                <li><strong>Status Change:</strong> Year will be marked as "archived" and cannot be modified</li>
                                <li><strong>Data Preservation:</strong> All historical data remains intact and searchable</li>
                                <li><strong>Export Available:</strong> Archived data can be exported for analysis or compliance</li>
                            </ul>
                        </div>

                        <!-- Confirmation -->
                        <div class="bg-orange-50 border border-orange-200 rounded-md p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-info-circle text-orange-400"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-orange-700">
                                        <strong>Note:</strong> This action cannot be undone. The academic year will be permanently archived.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div slot="footer" class="flex justify-end gap-3">
                        <ui-button color="secondary" data-action="close-dialog">Cancel</ui-button>
                        <ui-button 
                            data-action="archive-year" 
                            color="warning" 
                            ${this.loading ? 'disabled' : ''}
                            class="flex items-center gap-2">
                            <i class="fas fa-archive"></i>
                            ${this.loading ? 'Archiving...' : 'Archive Year'}
                        </ui-button>
                    </div>
                </ui-dialog>
            `;
        } else {
            // Delete mode (existing functionality)
            this.innerHTML = `
                <ui-dialog open>
                    <div slot="header" class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="fas fa-trash text-red-500 mr-2"></i>
                            <span class="font-semibold">Delete Academic Year</span>
                        </div>
                        <button class="text-gray-400 hover:text-gray-600" data-action="close-dialog">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div slot="content" class="space-y-6">
                        <!-- Warning Message -->
                        <div class="bg-red-50 border border-red-200 rounded-md p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-red-400"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-red-700">
                                        <strong>Danger:</strong> You are about to permanently delete the academic year <strong>${year.year_code}</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Year Information -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Academic Year Details</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">Year Code</label>
                                    <p class="text-lg font-semibold text-gray-800">${year.year_code}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">Display Name</label>
                                    <p class="text-lg font-semibold text-gray-800">${year.display_name}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">Start Date</label>
                                    <p class="text-lg font-semibold text-gray-800">${year.start_date}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600">End Date</label>
                                    <p class="text-lg font-semibold text-gray-800">${year.end_date}</p>
                                </div>
                            </div>
                        </div>

                        <!-- What Happens When Deleted -->
                        <div class="bg-red-50 rounded-lg p-4">
                            <h3 class="text-lg font-semibold text-red-800 mb-3">What Happens When Deleted?</h3>
                            <ul class="list-disc list-inside text-red-700 space-y-2">
                                <li><strong>Permanent Loss:</strong> All data associated with this year will be permanently deleted</li>
                                <li><strong>No Recovery:</strong> This action cannot be undone</li>
                                <li><strong>Data Loss:</strong> Classes, students, grades, and other records will be lost</li>
                                <li><strong>System Impact:</strong> May affect reports and historical data</li>
                            </ul>
                        </div>

                        <!-- Confirmation -->
                        <div class="bg-red-50 border border-red-200 rounded-md p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-red-400"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-red-700">
                                        <strong>Final Warning:</strong> Are you absolutely sure you want to delete this academic year? This action is irreversible.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div slot="footer" class="flex justify-end gap-3">
                        <ui-button color="secondary" data-action="close-dialog">Cancel</ui-button>
                        <ui-button 
                            data-action="delete-year" 
                            color="danger" 
                            ${this.loading ? 'disabled' : ''}
                            class="flex items-center gap-2">
                            <i class="fas fa-trash"></i>
                            ${this.loading ? 'Deleting...' : 'Delete Year'}
                        </ui-button>
                    </div>
                </ui-dialog>
            `;
        }
    }
}

customElements.define('academic-year-archive-dialog', AcademicYearArchiveDialog);
export default AcademicYearArchiveDialog;
