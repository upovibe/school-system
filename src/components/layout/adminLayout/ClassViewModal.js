import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';

/**
 * Class View Modal Component
 * 
 * A modal component for viewing class details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class ClassViewModal extends HTMLElement {
    constructor() {
        super();
        this.classData = null;
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

    // Set class data for viewing
    setClassData(classItem) {
        this.classData = classItem;
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
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Class Details</div>
                
                <div>
                    ${this.classData ? `
                        <!-- Class Header -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.classData.name || 'N/A'} - Section ${this.classData.section || 'N/A'}</h3>
                            <ui-badge color="${this.classData.status === 'active' ? 'success' : 'error'}">
                                <i class="fas fa-${this.classData.status === 'active' ? 'check' : 'times'} mr-1"></i>
                                ${this.classData.status === 'active' ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>

                        <!-- Class Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Class Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-chalkboard mr-1"></i>Class Name
                                    </label>
                                    <p class="text-gray-900 text-sm font-medium">${this.classData.name || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-layer-group mr-1"></i>Section
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.classData.section || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-alt mr-1"></i>Academic Year
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.classData.academic_year || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-users mr-1"></i>Capacity
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.classData.capacity ? `${this.classData.capacity} students` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Class Teacher -->
                        <div class="border-b pb-4 mt-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-user-tie text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Class Teacher</h4>
                            </div>
                            ${this.classData.class_teacher_name && String(this.classData.class_teacher_name).trim() !== '' ? `
                                <div class="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                                    <div class="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                                        <i class="fas fa-chalkboard-teacher"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="text-gray-900 font-semibold truncate">
                                            ${(this.classData.class_teacher_gender || '').toLowerCase() === 'female' ? 'Madam' : 'Sir'} ${this.classData.class_teacher_name}
                                        </div>
                                        <div class="text-gray-600 text-sm truncate">${this.classData.class_teacher_email || 'No email provided'}</div>
                                    </div>
                                </div>
                            ` : `
                                <div class="bg-gray-50 p-4 rounded-lg text-center">
                                    <i class="fas fa-user-slash text-gray-400 text-2xl mb-2"></i>
                                    <p class="text-gray-600 text-sm">No class teacher assigned.</p>
                                </div>
                            `}
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
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.classData.created_at)}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.classData.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No class data available</p>
                        </div>
                    `}
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('class-view-modal', ClassViewModal);
export default ClassViewModal; 