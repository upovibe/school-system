import '@/components/ui/Modal.js';

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

    render() {
        if (!this.classData) {
            this.innerHTML = `
                <ui-modal 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    position="center" 
                    close-button="true">
                    <div slot="title">Class Details</div>
                    <div class="p-4">
                        <p class="text-gray-500">No class data available</p>
                    </div>
                </ui-modal>
            `;
            return;
        }

        const statusClass = this.classData.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800';

        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="center" 
                close-button="true">
                <div slot="title">Class Details</div>
                <div class="p-4 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                            <p class="text-gray-900 font-medium">${this.classData.name || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <p class="text-gray-900 font-medium">${this.classData.section || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                            <p class="text-gray-900 font-medium">${this.classData.academic_year || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                            <p class="text-gray-900 font-medium">${this.classData.capacity || 'N/A'} students</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                                ${this.classData.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Created</label>
                            <p class="text-gray-900">${this.classData.created_at || 'N/A'}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Updated</label>
                            <p class="text-gray-900">${this.classData.updated_at || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('class-view-modal', ClassViewModal);
export default ClassViewModal; 