import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';

/**
 * Event View Modal Component
 * 
 * A modal component for viewing event details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class EventViewModal extends HTMLElement {
    constructor() {
        super();
        this.eventData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for close button click
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

    // Set event data for viewing
    setEventData(eventData) {
        this.eventData = eventData;
        this.populateView();
    }

    // Populate view with event data
    populateView() {
        if (!this.eventData) return;

        // Update the modal content with event data
        const titleElement = this.querySelector('#event-title');
        const descriptionElement = this.querySelector('#event-description');
        const categoryElement = this.querySelector('#event-category');
        const statusElement = this.querySelector('#event-status');
        const startDateElement = this.querySelector('#event-start-date');
        const endDateElement = this.querySelector('#event-end-date');
        const locationElement = this.querySelector('#event-location');
        const bannerElement = this.querySelector('#event-banner');
        const createdElement = this.querySelector('#event-created');
        const updatedElement = this.querySelector('#event-updated');

        if (titleElement) titleElement.textContent = this.eventData.title || 'N/A';
        if (descriptionElement) descriptionElement.textContent = this.eventData.description || 'No description available';
        if (categoryElement) categoryElement.textContent = this.eventData.category || 'N/A';
        if (statusElement) {
            statusElement.textContent = this.eventData.status || 'N/A';
            // Add status-specific styling
            statusElement.className = `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusBadgeClass(this.eventData.status)}`;
        }
        if (startDateElement) startDateElement.textContent = this.eventData.start_date ? new Date(this.eventData.start_date).toLocaleString() : 'N/A';
        if (endDateElement) endDateElement.textContent = this.eventData.end_date ? new Date(this.eventData.end_date).toLocaleString() : 'N/A';
        if (locationElement) locationElement.textContent = this.eventData.location || 'TBD';
        if (createdElement) createdElement.textContent = this.eventData.created_at ? new Date(this.eventData.created_at).toLocaleString() : 'N/A';
        if (updatedElement) updatedElement.textContent = this.eventData.updated_at ? new Date(this.eventData.updated_at).toLocaleString() : 'N/A';

        // Handle banner image
        if (bannerElement) {
            if (this.eventData.banner_image) {
                bannerElement.innerHTML = `
                    <img src="/api/${this.eventData.banner_image}" 
                         alt="${this.eventData.title}" 
                         class="w-full h-48 object-cover rounded-lg">
                `;
            } else {
                bannerElement.innerHTML = `
                    <div class="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <i class="fas fa-image text-gray-400 text-4xl"></i>
                    </div>
                `;
            }
        }
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-800';
            case 'ongoing': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="center" 
                close-button="true"
                size="lg">
                <div slot="title">Event Details</div>
                <div class="space-y-6">
                    <!-- Banner Image -->
                    <div id="event-banner" class="w-full">
                        <!-- Banner will be populated here -->
                    </div>

                    <!-- Event Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                            <p id="event-title" class="text-lg font-semibold text-gray-900">-</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <p id="event-category" class="text-gray-900">-</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <p id="event-status" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">-</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <p id="event-location" class="text-gray-900">-</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                            <p id="event-start-date" class="text-gray-900">-</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                            <p id="event-end-date" class="text-gray-900">-</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Created</label>
                            <p id="event-created" class="text-gray-900">-</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                            <p id="event-updated" class="text-gray-900">-</p>
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <div id="event-description" class="text-gray-900 bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                            -
                        </div>
                    </div>
                </div>
                <div slot="footer">
                    <div class="flex justify-end">
                        <ui-button variant="secondary" onclick="this.closest('event-view-modal').close()">
                            Close
                        </ui-button>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('event-view-modal', EventViewModal);
export default EventViewModal; 