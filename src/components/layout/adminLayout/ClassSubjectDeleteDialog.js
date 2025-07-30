import '@/components/ui/Dialog.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Class Subject Delete Dialog Component
 * 
 * Dialog for confirming deletion of class subject assignments
 */
class ClassSubjectDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.classSubjectData = null;
        this.loading = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // No additional event listeners needed for delete dialog
    }

    setClassSubjectData(classSubject) {
        this.classSubjectData = classSubject;
        this.render();
    }

    async deleteClassSubject() {
        if (this.loading || !this.classSubjectData) return;
        
        try {
            this.setLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to continue',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const response = await api.withToken(token).delete(`/class-subjects/${this.classSubjectData.id}`);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Class subject assignment deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Dispatch event with the deleted class subject ID
                this.dispatchEvent(new CustomEvent('class-subject-deleted', {
                    detail: {
                        classSubjectId: this.classSubjectData.id
                    }
                }));

                this.close();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to delete class subject assignment',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error deleting class subject:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete class subject assignment',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.loading = loading;
        const deleteBtn = this.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.disabled = loading;
            deleteBtn.textContent = loading ? 'Deleting...' : 'Delete Class Subject';
        }
    }

    close() {
        this.removeAttribute('open');
    }

    render() {
        const classSubject = this.classSubjectData;
        
        if (!classSubject) {
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="Delete Class Subject Assignment">
                    <div slot="content">
                        <p class="text-gray-500">No data to delete</p>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Class Subject Assignment">
                <div slot="content">
                    <div class="flex items-center mb-4">
                        <div class="flex-shrink-0">
                            <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-lg font-medium text-gray-900">Are you sure?</h3>
                            <p class="text-sm text-gray-500 mt-1">
                                This action cannot be undone. This will permanently delete the class subject assignment.
                            </p>
                        </div>
                    </div>

                    <!-- Assignment Details -->
                    <div class="bg-red-50 rounded-lg p-4 mb-6">
                        <h4 class="text-sm font-medium text-red-800 mb-2">Assignment to be deleted:</h4>
                        <div class="space-y-2 text-sm">
                            <div>
                                <span class="font-medium text-gray-700">Class:</span>
                                <span class="text-gray-900 ml-2">${classSubject.class_name || 'N/A'} - ${classSubject.class_section || 'N/A'}</span>
                            </div>
                            <div>
                                <span class="font-medium text-gray-700">Subject:</span>
                                <span class="text-gray-900 ml-2">${classSubject.subject_name || 'N/A'} (${classSubject.subject_code || 'N/A'})</span>
                            </div>
                            <div>
                                <span class="font-medium text-gray-700">Academic Year:</span>
                                <span class="text-gray-900 ml-2">${classSubject.academic_year || 'N/A'}</span>
                            </div>
                            <div>
                                <span class="font-medium text-gray-700">Term:</span>
                                <span class="text-gray-900 ml-2">${classSubject.term ? classSubject.term.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</span>
                            </div>
                            <div>
                                <span class="font-medium text-gray-700">Assignment ID:</span>
                                <span class="text-gray-900 ml-2">${classSubject.id}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Warning -->
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-yellow-700">
                                    <strong>Warning:</strong> Deleting this assignment will remove the subject from the class for the specified academic year and term.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center justify-end space-x-3">
                        <button 
                            type="button" 
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            onclick="this.closest('class-subject-delete-dialog').close()">
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            class="delete-btn px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            onclick="this.closest('class-subject-delete-dialog').deleteClassSubject()">
                            Delete Class Subject
                        </button>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('class-subject-delete-dialog', ClassSubjectDeleteDialog);
export default ClassSubjectDeleteDialog; 