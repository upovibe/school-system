import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Event Update Modal Component
 * 
 * A modal component for updating existing events in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - event-updated: Fired when an event is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class EventUpdateModal extends HTMLElement {
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
        // Listen for confirm button click (Update Event)
        this.addEventListener('confirm', () => {
            this.updateEvent();
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

    // Set event data for editing
    setEventData(eventData) {
        this.eventData = eventData;
        this.populateForm();
    }

    // Populate form with existing event data
    populateForm() {
        if (!this.eventData) return;

        const titleInput = this.querySelector('ui-input[data-field="title"]');
        const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
        const locationInput = this.querySelector('ui-input[data-field="location"]');
        const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
        const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
        const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
        const statusDropdown = this.querySelector('ui-dropdown[data-field="status"]');

        if (titleInput) titleInput.value = this.eventData.title || '';
        if (descriptionTextarea) descriptionTextarea.value = this.eventData.description || '';
        if (locationInput) locationInput.value = this.eventData.location || '';
        if (startDateInput) startDateInput.value = this.eventData.start_date ? this.eventData.start_date.slice(0, 16) : '';
        if (endDateInput) endDateInput.value = this.eventData.end_date ? this.eventData.end_date.slice(0, 16) : '';
        if (categoryDropdown) categoryDropdown.value = this.eventData.category || '';
        if (statusDropdown) statusDropdown.value = this.eventData.status || '';
    }

    // Update the event
    async updateEvent() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const locationInput = this.querySelector('ui-input[data-field="location"]');
            const startDateInput = this.querySelector('ui-input[data-field="start_date"]');
            const endDateInput = this.querySelector('ui-input[data-field="end_date"]');
            
            const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
            const statusDropdown = this.querySelector('ui-dropdown[data-field="status"]');
            const bannerFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');

            const eventData = {
                title: titleInput ? titleInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                category: categoryDropdown ? categoryDropdown.value : '',
                status: statusDropdown ? statusDropdown.value : '',
                start_date: startDateInput ? startDateInput.value : '',
                end_date: endDateInput ? endDateInput.value : '',
                location: locationInput ? locationInput.value : ''
            };

            console.log('Event data being sent:', eventData); // Debug log

            // Validate required fields
            if (!eventData.title) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the event title',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!eventData.start_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select a start date',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!eventData.end_date) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please select an end date',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update events',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Prepare form data for multipart request
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(eventData).forEach(key => {
                formData.append(key, eventData[key]);
            });
            
            // Add banner files if selected
            if (bannerFileUpload && bannerFileUpload.getFiles().length > 0) {
                const files = bannerFileUpload.getFiles();
                // Filter out existing files (which are strings/paths) and only include new File objects
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('banner', file, file.name);
                });
            }

            console.log('FormData entries:'); // Debug log
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            // Update the event with multipart data
            const response = await api.withToken(token).put(`/events/${this.eventData.id}`, formData);
            
            Toast.show({
                title: 'Success',
                message: 'Event updated successfully',
                variant: 'success',
                duration: 3000
            });

            // Construct the updated event data from response
            const updatedEvent = {
                id: this.eventData.id,
                title: eventData.title,
                description: eventData.description,
                category: eventData.category,
                status: eventData.status,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                location: eventData.location,
                banner_image: response.data.data?.banner_image || this.eventData.banner_image,
                created_at: this.eventData.created_at,
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('event-updated', {
                detail: { event: updatedEvent },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error updating event:', error);
            console.error('Error response:', error.response?.data); // Debug log
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update event',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Update Event</div>
                    <form id="event-update-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                            <ui-input 
                                data-field="title"
                                type="text" 
                                placeholder="Enter event title"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <ui-textarea 
                                data-field="description"
                                placeholder="Enter event description"
                                rows="4"
                                class="w-full">
                            </ui-textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <ui-dropdown 
                                data-field="category"
                                placeholder="Select category"
                                class="w-full">
                                <option value="sports">Sports</option>
                                <option value="academic">Academic</option>
                                <option value="arts">Arts</option>
                                <option value="career">Career</option>
                                <option value="technology">Technology</option>
                                <option value="community">Community</option>
                                <option value="meeting">Meeting</option>
                                <option value="ceremony">Ceremony</option>
                            </ui-dropdown>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                                <ui-input 
                                    data-field="start_date"
                                    type="datetime-local" 
                                    class="w-full">
                                </ui-input>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                                <ui-input 
                                    data-field="end_date"
                                    type="datetime-local" 
                                    class="w-full">
                                </ui-input>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <ui-input 
                                data-field="location"
                                type="text" 
                                placeholder="Enter event location"
                                class="w-full">
                            </ui-input>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-dropdown 
                                data-field="status"
                                placeholder="Select status"
                                class="w-full">
                                <option value="upcoming">Upcoming</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </ui-dropdown>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                            <ui-file-upload 
                                data-field="banner"
                                accept="image/*"
                                multiple="false"
                                class="w-full">
                            </ui-file-upload>
                        </div>
                    </form>
                <div slot="footer">
                    <div class="flex justify-end space-x-2">
                        <ui-button variant="secondary" onclick="this.closest('event-update-modal').close()">
                            Cancel
                        </ui-button>
                        <ui-button variant="primary" onclick="this.closest('event-update-modal').updateEvent()">
                            Update Event
                        </ui-button>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('event-update-modal', EventUpdateModal);
export default EventUpdateModal; 