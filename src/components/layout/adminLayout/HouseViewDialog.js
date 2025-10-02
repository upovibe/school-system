import '@/components/ui/Dialog.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Toast.js';

/**
 * House View Dialog Component
 * 
 * A dialog component for viewing house details and assigned teachers in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - dialog-closed: Fired when dialog is closed
 * - remove-teacher: Fired when a teacher is removed from house
 */
class HouseViewDialog extends HTMLElement {
    constructor() {
        super();
        this.houseData = null;
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

        // Remove existing listeners to avoid duplicates
        this.removeEventListener('click', this.handleClick);
        
        // Add click listener
        this.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const target = event.target;
        
        // Handle teacher remove
        if (target.closest('.remove-teacher-btn')) {
            const button = target.closest('.remove-teacher-btn');
            const teacherData = button.dataset;
            console.log('Remove teacher clicked:', teacherData);
            this.onRemoveTeacher(
                teacherData.teacherId,
                teacherData.teacherName,
                teacherData.houseName
            );
        }
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set house data for viewing
    setHouseData(house) {
        this.houseData = house;
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
        const house = this.houseData;
        
        if (!house) {
            this.innerHTML = `
                <ui-dialog 
                    ${this.hasAttribute('open') ? 'open' : ''} 
                    title="View House Details">
                    <div slot="content">
                        <div class="text-center py-8">
                            <p class="text-gray-500">No data to display</p>
                        </div>
                    </div>
                </ui-dialog>
            `;
            return;
        }

        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="View House Details">
                <div slot="content">
                    <div>
                        ${house ? `
                            <!-- House Header -->
                            <div class="flex items-center gap-3 border-b pb-4">
                                <h3 class="text-xl font-semibold text-gray-900">${house.name || 'N/A'}</h3>
                                <ui-badge color="success">
                                    <i class="fas fa-home mr-1"></i>
                                    Active
                                </ui-badge>
                            </div>

                            <!-- House Information -->
                            <div class="border-b pb-4">
                                <div class="flex items-center gap-2 mb-3">
                                    <i class="fas fa-info-circle text-blue-500"></i>
                                    <h4 class="text-md font-semibold text-gray-800">House Information</h4>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            <i class="fas fa-home mr-1"></i>House Name
                                        </label>
                                        <p class="text-gray-900 text-sm font-medium">${house.name || 'N/A'}</p>
                                    </div>
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            <i class="fas fa-users mr-1"></i>Teachers Count
                                        </label>
                                        <p class="text-gray-900 text-sm font-medium">${house.teacher_count || 0}</p>
                                    </div>
                                    <div class="bg-gray-50 p-3 rounded-lg md:col-span-2">
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            <i class="fas fa-align-left mr-1"></i>Description
                                        </label>
                                        <p class="text-gray-900 text-sm">${house.description || 'No description provided'}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Assigned Teachers -->
                            <div class="border-b pb-4">
                                <div class="flex items-center gap-2 mb-3">
                                    <i class="fas fa-chalkboard-teacher text-green-500"></i>
                                    <h4 class="text-md font-semibold text-gray-800">Assigned Teachers</h4>
                                </div>
                                ${house.teachers && house.teachers.length > 0 ? `
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        ${house.teachers.map(teacher => `
                                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div class="flex items-center space-x-3">
                                                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <i class="fas fa-user text-blue-600 text-sm"></i>
                                                    </div>
                                                    <div>
                                                        <p class="text-sm font-medium text-gray-900">${teacher.name || 'N/A'}</p>
                                                        <p class="text-xs text-gray-600">${teacher.email || 'No email'}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    class="remove-teacher-btn inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                    data-teacher-id="${teacher.id}"
                                                    data-teacher-name="${teacher.name}"
                                                    data-house-name="${house.name}"
                                                    title="Remove this teacher from house">
                                                    <i class="fas fa-times text-xs"></i>
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <div class="text-center py-8 bg-gray-50 rounded-lg">
                                        <div class="text-gray-400 text-4xl mb-3">
                                            <i class="fas fa-user-slash"></i>
                                        </div>
                                        <p class="text-gray-500">No teachers assigned to this house</p>
                                    </div>
                                `}
                            </div>

                            <!-- House Details -->
                            <div class="border-b pb-4">
                                <div class="flex items-center gap-2 mb-3">
                                    <i class="fas fa-calendar text-purple-500"></i>
                                    <h4 class="text-md font-semibold text-gray-800">House Details</h4>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            <i class="fas fa-calendar-plus mr-1"></i>Created Date
                                        </label>
                                        <p class="text-gray-900 text-sm">${this.formatDate(house.created_at)}</p>
                                    </div>
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <label class="block text-sm font-medium text-gray-700 mb-1">
                                            <i class="fas fa-calendar-check mr-1"></i>Last Updated
                                        </label>
                                        <p class="text-gray-900 text-sm">${this.formatDate(house.updated_at)}</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Close</ui-button>
                </div>
            </ui-dialog>
        `;
    }

    onRemoveTeacher(teacherId, teacherName, houseName) {
        console.log('Dispatching remove-teacher event:', { teacherId, teacherName, houseName });
        
        // Dispatch event to parent component
        this.dispatchEvent(new CustomEvent('remove-teacher', {
            detail: {
                teacherId: teacherId,
                teacherName: teacherName,
                houseName: houseName
            },
            bubbles: true,
            composed: true
        }));
        
        // Close the dialog
        this.close();
    }
}

customElements.define('house-view-dialog', HouseViewDialog);
export default HouseViewDialog;
