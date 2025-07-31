import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Class Subject Delete Subject Dialog Component
 * 
 * Dialog for confirming deletion of a specific subject from a class
 */
class ClassSubjectDeleteSubjectDialog extends HTMLElement {
    constructor() {
        super();
        this.deleteSubjectData = null;
        this.loading = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open' && newValue !== null) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for dialog events
        this.addEventListener('confirm', this.deleteSubject.bind(this));
    }

    setDeleteSubjectData(data) {
        this.deleteSubjectData = data;
        this.render();
    }

    async deleteSubject() {
        if (this.loading || !this.deleteSubjectData) return;
        
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

            const response = await api.withToken(token).delete(`/class-subjects/class/${this.deleteSubjectData.classId}/subject/${this.deleteSubjectData.subjectId}`);
            
            if (response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: `Successfully deleted ${this.deleteSubjectData.subjectName} (${this.deleteSubjectData.subjectCode}) from ${this.deleteSubjectData.className} - ${this.deleteSubjectData.classSection}`,
                    variant: 'success',
                    duration: 3000
                });

                // Close modal and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('class-subject-deleted', {
                    detail: {
                        deletedSubject: {
                            classId: this.deleteSubjectData.classId,
                            subjectId: this.deleteSubjectData.subjectId,
                            className: this.deleteSubjectData.className,
                            classSection: this.deleteSubjectData.classSection,
                            subjectName: this.deleteSubjectData.subjectName,
                            subjectCode: this.deleteSubjectData.subjectCode
                        }
                    },
                    bubbles: true,
                    composed: true
                }));
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to delete subject from class',
                    variant: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error deleting subject from class:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete subject from class',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.loading = loading;
        // The ui-dialog component handles the loading state automatically
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    render() {
        const data = this.deleteSubjectData;
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Subject from Class">
                <div slot="content">
                    <div class="space-y-4">
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-red-400"></i>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-red-800">
                                        Are you sure you want to delete this subject?
                                    </h3>
                                    <div class="mt-2 text-sm text-red-700">
                                        <p>This action will remove <strong>${data?.subjectName} (${data?.subjectCode})</strong> from <strong>${data?.className} - ${data?.classSection}</strong>.</p>
                                        <p class="mt-1">This action cannot be undone.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-gray-900 mb-2">Subject Details</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Class:</span>
                                    <span class="font-medium">${data?.className} - ${data?.classSection}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Subject:</span>
                                    <span class="font-medium">${data?.subjectName} (${data?.subjectCode})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('class-subject-delete-subject-dialog', ClassSubjectDeleteSubjectDialog);
export default ClassSubjectDeleteSubjectDialog; 