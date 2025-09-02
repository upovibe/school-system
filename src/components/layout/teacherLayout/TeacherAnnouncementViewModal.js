import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';

/**
 * Teacher Announcement View Modal Component
 * 
 * A modal component for viewing announcement details in the teacher panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class TeacherAnnouncementViewModal extends HTMLElement {
    constructor() {
        super();
        this.announcementData = null;
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

    // Set announcement data for viewing
    setAnnouncementData(announcement) {
        this.announcementData = announcement;
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

    // Get priority badge styling
    getPriorityBadge() {
        if (!this.announcementData) return '';
        
        const priority = this.announcementData.priority;
        let badgeColor = 'bg-gray-100 text-gray-800';
        let icon = 'fa-circle';
        
        switch (priority) {
            case 'urgent':
                badgeColor = 'bg-red-100 text-red-800';
                icon = 'fa-exclamation-triangle';
                break;
            case 'high':
                badgeColor = 'bg-orange-100 text-orange-800';
                icon = 'fa-exclamation-circle';
                break;
            case 'low':
                badgeColor = 'bg-blue-100 text-blue-800';
                icon = 'fa-info-circle';
                break;
            default: // normal
                badgeColor = 'bg-green-100 text-green-800';
                icon = 'fa-check-circle';
                break;
        }
        
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}">
            <i class="fas ${icon} mr-1"></i>
            ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
        </span>`;
    }

    // Get target audience badge
    getTargetAudienceBadge() {
        if (!this.announcementData) return '';
        
        const audience = this.announcementData.target_audience;
        let badgeColor = 'bg-blue-100 text-blue-800';
        let icon = 'fa-users';
        let label = 'All Users';
        
        switch (audience) {
            case 'students':
                badgeColor = 'bg-green-100 text-green-800';
                icon = 'fa-user-graduate';
                label = 'Students Only';
                break;
            case 'teachers':
                badgeColor = 'bg-purple-100 text-purple-800';
                icon = 'fa-chalkboard-teacher';
                label = 'Teachers Only';
                break;
            case 'admin':
                badgeColor = 'bg-red-100 text-red-800';
                icon = 'fa-user-shield';
                label = 'Admin Only';
                break;
            case 'cashier':
                badgeColor = 'bg-yellow-100 text-yellow-800';
                icon = 'fa-cash-register';
                label = 'Cashier Only';
                break;
            case 'specific_class':
                badgeColor = 'bg-indigo-100 text-indigo-800';
                icon = 'fa-chalkboard';
                label = 'Specific Class';
                break;
        }
        
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}">
            <i class="fas ${icon} mr-1"></i>
            ${label}
        </span>`;
    }

    // Get announcement type badge
    getTypeBadge() {
        if (!this.announcementData) return '';
        
        const type = this.announcementData.announcement_type;
        let badgeColor = 'bg-gray-100 text-gray-800';
        let icon = 'fa-bullhorn';
        
        switch (type) {
            case 'academic':
                badgeColor = 'bg-green-100 text-green-800';
                icon = 'fa-graduation-cap';
                break;
            case 'event':
                badgeColor = 'bg-blue-100 text-blue-800';
                icon = 'fa-calendar-alt';
                break;
            case 'reminder':
                badgeColor = 'bg-yellow-100 text-yellow-800';
                icon = 'fa-bell';
                break;
            case 'emergency':
                badgeColor = 'bg-red-100 text-red-800';
                icon = 'fa-exclamation-triangle';
                break;
            case 'financial':
                badgeColor = 'bg-purple-100 text-purple-800';
                icon = 'fa-dollar-sign';
                break;
            case 'policy':
                badgeColor = 'bg-indigo-100 text-indigo-800';
                icon = 'fa-file-contract';
                break;
        }
        
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}">
            <i class="fas ${icon} mr-1"></i>
            ${type.charAt(0).toUpperCase() + type.slice(1)}
        </span>`;
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right"
                close-button="true">
                <div slot="title">View Announcement Details</div>
                
                <div>
                    ${this.announcementData ? `
                        <!-- Announcement Header -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.announcementData.title || 'No Title'}</h3>
                            ${this.announcementData.is_pinned ? `
                                <ui-badge color="warning">
                                    <i class="fas fa-thumbtack mr-1"></i>
                                    Pinned
                                </ui-badge>
                            ` : ''}
                            <ui-badge color="${this.announcementData.is_active ? 'success' : 'error'}">
                                <i class="fas fa-${this.announcementData.is_active ? 'check' : 'times'} mr-1"></i>
                                ${this.announcementData.is_active ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>

                        <!-- Priority and Type Badges -->
                        <div class="border-b pb-4 mt-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-tags text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Classification</h4>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${this.getPriorityBadge()}
                                ${this.getTypeBadge()}
                                ${this.getTargetAudienceBadge()}
                            </div>
                        </div>

                        <!-- Content Section -->
                        <div class="border-b pb-4 mt-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-file-alt text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Content</h4>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div class="prose max-w-none">
                                    <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">${this.announcementData.content || 'No content available'}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Target Class Information (if applicable) -->
                        ${this.announcementData.target_audience === 'specific_class' && this.announcementData.target_class_id ? `
                            <div class="border-b pb-4 mt-4">
                                <div class="flex items-center gap-2 mb-3">
                                    <i class="fas fa-chalkboard text-indigo-500"></i>
                                    <h4 class="text-md font-semibold text-gray-800">Target Class</h4>
                                </div>
                                <div class="bg-indigo-50 p-4 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                                            <i class="fas fa-chalkboard"></i>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="text-indigo-900 font-semibold">
                                                ${this.announcementData.class_name || 'Unknown Class'} (${this.announcementData.class_section || 'Unknown Section'})
                                            </div>
                                            <div class="text-indigo-600 text-sm">Class ID: ${this.announcementData.target_class_id}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Creator Information -->
                        <div class="border-b pb-4 mt-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-user text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Created By</h4>
                            </div>
                            <div class="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                                <div class="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-gray-900 font-semibold truncate">
                                        ${this.announcementData.creator_name || 'Unknown User'}
                                    </div>
                                    <div class="text-gray-600 text-sm truncate">${this.announcementData.creator_role || 'Unknown Role'}</div>
                                    ${this.announcementData.creator_email ? `
                                        <div class="text-gray-500 text-sm truncate">${this.announcementData.creator_email}</div>
                                    ` : ''}
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
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.announcementData.created_at)}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.formatDate(this.announcementData.updated_at)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Expiration (if set) -->
                        ${this.announcementData.expires_at ? `
                            <div class="mt-4">
                                <div class="flex items-center gap-2 mb-3">
                                    <i class="fas fa-calendar-times text-red-500"></i>
                                    <h4 class="text-md font-semibold text-gray-800">Expiration</h4>
                                </div>
                                <div class="bg-red-50 p-3 rounded-lg">
                                    <div class="text-red-900 text-sm">
                                        <i class="fas fa-exclamation-circle mr-1"></i>
                                        This announcement expires on ${this.formatDate(this.announcementData.expires_at)}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No announcement data available</p>
                        </div>
                    `}
                </div>
                
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" dialog-action="cancel">Close</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('teacher-announcement-view-modal', TeacherAnnouncementViewModal);
export default TeacherAnnouncementViewModal;
