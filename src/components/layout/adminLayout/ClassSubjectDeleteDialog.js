import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Class Subject Delete Dialog Component
 * 
 * A dialog component for confirming class subject deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - class-subject-deleted: Fired when a class subject is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class ClassSubjectDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.classSubjectData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Class Subject)
        this.addEventListener('confirm', () => {
            this.deleteClassSubject();
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
    }

    // Set class subject data for deletion
    setClassSubjectData(classSubject) {
        this.classSubjectData = classSubject;
        this.render(); // Re-render to show the new data
    }

    // Delete the class subject
    async deleteClassSubject() {
        try {
            if (!this.classSubjectData) {
                Toast.show({
                    title: 'Error',
                    message: 'No class subject data available for deletion',
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
                    message: 'Please log in to delete class subjects',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete class subject
            const response = await api.withToken(token).delete(`/class-subjects/${this.classSubjectData.id}`);
            
            // Check if class subject was deleted successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Class subject assignment deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('class-subject-deleted', {
                    detail: { classSubjectId: this.classSubjectData.id },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to delete class subject assignment');
            }

        } catch (error) {
            console.error('❌ Error deleting class subject:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete class subject assignment',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const classSubject = this.classSubjectData;
        
        if (!classSubject) {
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    variant="danger">
                    <div slot="title">Delete Class Subject Assignment</div>
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
                variant="danger">
                <div slot="title">Delete Class Subject Assignment</div>
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
                    <div class="bg-red-50 rounded-lg p-4 mb-4">
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
                            
                        </div>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('class-subject-delete-dialog', ClassSubjectDeleteDialog);
export default ClassSubjectDeleteDialog; 