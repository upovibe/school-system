import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';

/**
 * Class Subject View Dialog Component
 * 
 * A dialog component for viewing class subject assignment details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - dialog-closed: Fired when dialog is closed
 */
class ClassSubjectViewDialog extends HTMLElement {
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
        // Listen for cancel button click (Close dialog)
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

    // Set class subject data for viewing
    setClassSubjectData(classSubject) {
        this.classSubjectData = classSubject;
        this.render();
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="View Class Subject Assignment">
                <div slot="content">
                    ${this.classSubjectData ? `
                        <!-- Assignment Header -->
                        <div class="flex items-center gap-3 border-b pb-4 mb-4">
                            <h3 class="text-xl font-semibold text-gray-900">
                                ${this.classSubjectData.class_name || 'N/A'} - ${this.classSubjectData.class_section || 'N/A'}
                            </h3>
                            <ui-badge color="info">
                                <i class="fas fa-link mr-1"></i>
                                Assignment
                            </ui-badge>
                        </div>



                        <!-- Class Information -->
                        <div class="border-b pb-4 mb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-chalkboard text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Class Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-chalkboard mr-1"></i>Class Name
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.classSubjectData.class_name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-layer-group mr-1"></i>Section
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.classSubjectData.class_section || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-link mr-1"></i>Full Class
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.classSubjectData.class_name && this.classSubjectData.class_section ? 
                                        `${this.classSubjectData.class_name} - ${this.classSubjectData.class_section}` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Subject Information -->
                        <div class="border-b pb-4 mb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-book text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Subject Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-book mr-1"></i>Subject Name
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.classSubjectData.subject_name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-code mr-1"></i>Subject Code
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.classSubjectData.subject_code || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-link mr-1"></i>Full Subject
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.classSubjectData.subject_name && this.classSubjectData.subject_code ? 
                                        `${this.classSubjectData.subject_name} (${this.classSubjectData.subject_code})` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Timestamps -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-clock text-orange-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-plus mr-1"></i>Created
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.classSubjectData.created_at)}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.classSubjectData.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No class subject data available</p>
                        </div>
                    `}
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('class-subject-view-dialog', ClassSubjectViewDialog);
export default ClassSubjectViewDialog; 