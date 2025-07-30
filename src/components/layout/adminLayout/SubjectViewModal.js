import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';

/**
 * Subject View Modal Component
 * 
 * A modal component for viewing subject details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class SubjectViewModal extends HTMLElement {
    constructor() {
        super();
        this.subjectData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for cancel button click (Close modal)
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

    // Set subject data for viewing
    setSubjectData(subject) {
        this.subjectData = subject;
        this.populateView();
    }

    // Populate view with subject data
    populateView() {
        if (!this.subjectData) return;

        // Update the view content
        const nameElement = this.querySelector('[data-field="name"]');
        const codeElement = this.querySelector('[data-field="code"]');
        const descriptionElement = this.querySelector('[data-field="description"]');
        const statusElement = this.querySelector('[data-field="status"]');
        const createdElement = this.querySelector('[data-field="created"]');
        const updatedElement = this.querySelector('[data-field="updated"]');

        if (nameElement) nameElement.textContent = this.subjectData.name || 'N/A';
        if (codeElement) codeElement.textContent = this.subjectData.code || 'N/A';
        if (descriptionElement) descriptionElement.textContent = this.subjectData.description || 'No description available';
        if (statusElement) {
            statusElement.textContent = this.subjectData.status === 'active' ? 'Active' : 'Inactive';
            statusElement.className = this.subjectData.status === 'active' 
                ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
                : 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800';
        }
        if (createdElement) createdElement.textContent = this.subjectData.created_at || 'N/A';
        if (updatedElement) updatedElement.textContent = this.subjectData.updated_at || 'N/A';
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Subject Details</div>
                <div class="space-y-4">
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                            <div data-field="name" class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                Loading...
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                            <div data-field="code" class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                Loading...
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <div data-field="description" class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md min-h-[60px]">
                                Loading...
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <div data-field="status" class="inline-block px-2 py-1 text-xs font-medium rounded-full">
                                Loading...
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                            <div data-field="created" class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                Loading...
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                            <div data-field="updated" class="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                Loading...
                            </div>
                        </div>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('subject-view-modal', SubjectViewModal);
export default SubjectViewModal; 