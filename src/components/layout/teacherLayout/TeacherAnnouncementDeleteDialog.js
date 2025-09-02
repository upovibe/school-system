import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Teacher Announcement Delete Dialog Component
 * 
 * A dialog component for confirming announcement deletion in the teacher panel
 * Teachers can only delete their own announcements
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - announcement-deleted: Fired when an announcement is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class TeacherAnnouncementDeleteDialog extends HTMLElement {
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
        // Listen for confirm button click (Delete Announcement)
        this.addEventListener('confirm', () => {
            this.deleteAnnouncement();
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

    // Set announcement data for deletion
    setAnnouncementData(announcement) {
        this.announcementData = announcement;
    }

    // Delete the announcement
    async deleteAnnouncement() {
        try {
            if (!this.announcementData) {
                Toast.show({
                    title: 'Error',
                    message: 'No announcement data available for deletion',
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
                    message: 'Please log in to delete announcements',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete announcement using the teacher-specific API endpoint
            const response = await api.withToken(token).delete(`/teacher/announcements/${this.announcementData.id}`);
            
            // Check if announcement was deleted successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'Announcement deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('announcement-deleted', {
                    detail: { announcement: this.announcementData },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to delete announcement');
            }

        } catch (error) {
            console.error('❌ Error deleting announcement:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete announcement',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const announcementTitle = this.announcementData ? this.announcementData.title : 'this announcement';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="danger">
                <div slot="title">Delete Announcement</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete <strong>"${announcementTitle}"</strong>?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The announcement will be permanently removed from the system.
                    </p>
                    <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p class="text-sm text-red-800">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            <strong>Warning:</strong> If this announcement is currently active and visible to students, 
                            deleting it will immediately remove it from all student views.
                        </p>
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('teacher-announcement-delete-dialog', TeacherAnnouncementDeleteDialog);
export default TeacherAnnouncementDeleteDialog;
