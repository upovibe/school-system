import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * House Delete Dialog Component
 * 
 * A dialog component for confirming house deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - house-deleted: Fired when a house is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class HouseDeleteDialog extends HTMLElement {
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
        // Listen for confirm button click (Delete House)
        this.addEventListener('confirm', () => {
            this.deleteHouse();
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

    // Set house data for deletion
    setHouseData(house) {
        this.houseData = house;
        this.render();
    }

    // Delete the house
    async deleteHouse() {
        try {
            if (!this.houseData) {
                Toast.show({
                    title: 'Error',
                    message: 'No house data available for deletion',
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
                    message: 'Please log in to delete houses',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete house
            const response = await api.withToken(token).delete(`/houses/${this.houseData.id}`);
            
            // Check if house was deleted successfully
            if (response.status === 200 || response.data.success) {
                Toast.show({
                    title: 'Success',
                    message: 'House deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('house-deleted', {
                    detail: { houseId: this.houseData.id },
                    bubbles: true,
                    composed: true
                }));
            } else {
                throw new Error(response.data.message || 'Failed to delete house');
            }

        } catch (error) {
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete house',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const houseName = this.houseData ? this.houseData.name : 'this house';
        const teacherCount = this.houseData ? (this.houseData.teacher_count || 0) : 0;
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                variant="danger">
                <div slot="title">Delete House</div>
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete <strong>${houseName}</strong>?
                    </p>
                    <p class="text-sm text-gray-500 mb-4">
                        This action cannot be undone. All associated teacher assignments will also be removed.
                    </p>
                    ${teacherCount > 0 ? `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <div class="flex items-center">
                                <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                                <p class="text-sm text-yellow-800">
                                    <strong>Warning:</strong> This house has ${teacherCount} teacher${teacherCount !== 1 ? 's' : ''} assigned. 
                                    All teacher assignments will be removed.
                                </p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('house-delete-dialog', HouseDeleteDialog);
export default HouseDeleteDialog;
