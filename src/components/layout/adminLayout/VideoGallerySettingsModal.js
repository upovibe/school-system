import App from '@/core/App.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Switch.js';
import api from '@/services/api.js';

/**
 * Video Gallery Settings Modal Component
 * 
 * Modal for creating new video galleries with video links
 */
class VideoGallerySettingsModal extends App {
    constructor() {
        super();
        this.videoLinks = [''];
        this.loading = false;
        
        this.set('videoLinks', ['']);
        this.set('loading', false);
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save Video Gallery)
        this.addEventListener('confirm', () => {
            this.handleSubmit();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });

        this.addEventListener('click', (e) => {
            const addVideoButton = e.target.closest('[data-action="add-video-link"]');
            if (addVideoButton) {
                e.preventDefault();
                this.addVideoLink();
            }

            const removeVideoButton = e.target.closest('[data-action="remove-video-link"]');
            if (removeVideoButton) {
                e.preventDefault();
                const index = parseInt(removeVideoButton.dataset.index);
                this.removeVideoLink(index);
            }
        });

        // Handle video link input changes
        this.addEventListener('input', (e) => {
            const input = e.target.closest('ui-input');
            if (input && input.hasAttribute('data-video-index')) {
                const index = parseInt(input.getAttribute('data-video-index'));
                const value = input.value;
                this.updateVideoLink(index, value);
            }
        });
    }

    addVideoLink() {
        const videoLinks = this.get('videoLinks');
        videoLinks.push('');
        this.set('videoLinks', [...videoLinks]);
    }

    removeVideoLink(index) {
        const videoLinks = this.get('videoLinks');
        if (videoLinks.length > 1) {
            videoLinks.splice(index, 1);
            this.set('videoLinks', [...videoLinks]);
        }
    }

    updateVideoLink(index, value) {
        const videoLinks = this.get('videoLinks');
        videoLinks[index] = value;
        this.set('videoLinks', [...videoLinks]);
    }

    async handleSubmit() {
        try {
            this.set('loading', true);

            // Get form data using the data-field attributes for reliable selection
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');

            const data = {
                name: nameInput ? nameInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                is_active: isActiveSwitch ? isActiveSwitch.checked : true,
                video_links: this.get('videoLinks').filter(link => link.trim() !== '')
            };

            // Validate required fields
            if (!data.name || !data.name.trim()) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Gallery name is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (data.video_links.length === 0) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'At least one video link is required',
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
                    message: 'Please log in to create video gallery',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Create the video gallery
            const response = await api.withToken(token).post('/video-galleries', data);
            
            Toast.show({
                title: 'Success',
                message: 'Video gallery created successfully',
                variant: 'success',
                duration: 3000
            });

            // Construct the new video gallery data from response
            const newVideoGallery = {
                id: response.data.data?.id || response.data.id,
                name: data.name,
                description: data.description,
                is_active: data.is_active,
                video_links: data.video_links,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('video-gallery-saved', {
                detail: { videoGallery: newVideoGallery },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error saving video gallery:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create video gallery',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    resetForm() {
        const form = this.querySelector('form');
        if (form) {
            form.reset();
        }
        this.set('videoLinks', ['']);
    }

    close() {
        const modal = this.querySelector('ui-modal');
        if (modal) {
            modal.close();
        }
    }

    render() {
        const videoLinks = this.get('videoLinks');
        const loading = this.get('loading');

        return `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Create Video Gallery" 
                size="lg"
                close-button="true">
                <form class="space-y-6">
                    <!-- Gallery Name -->
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                            Gallery Name *
                        </label>
                        <ui-input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Enter gallery name"
                            required
                            class="w-full"
                            data-field="name">
                        </ui-input>
                    </div>

                    <!-- Description -->
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <ui-textarea
                            id="description"
                            name="description"
                            placeholder="Enter gallery description"
                            rows="3"
                            class="w-full"
                            data-field="description">
                        </ui-textarea>
                    </div>

                    <!-- Video Links -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Video Links *
                        </label>
                        <div class="space-y-3">
                            ${videoLinks.map((link, index) => `
                                <div class="flex gap-2">
                                    <div class="flex-1">
                                        <ui-input
                                            type="url"
                                            placeholder="Enter video URL (YouTube, Facebook, etc.)"
                                            value="${link}"
                                            data-video-index="${index}"
                                            class="w-full">
                                        </ui-input>
                                    </div>
                                    ${videoLinks.length > 1 ? `
                                        <div>
                                            <ui-button
                                                type="button"
                                                variant="normal"
                                                size="sm"
                                                data-action="remove-video-link"
                                                data-index="${index}"
                                                class="px-3 bg-transparent">
                                                <i class="fas fa-trash text-red-500"></i>
                                            </ui-button>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                            <div class="flex justify-end">
                                <ui-button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    data-action="add-video-link"
                                    class="px-3">
                                    <i class="fas fa-plus mr-1"></i>
                                    Add
                                </ui-button>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">
                            Supported platforms: YouTube, Facebook, Vimeo, Dailymotion, and more
                        </p>
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-gray-700">Active Status</label>
                            <p class="text-xs text-gray-500">Enable or disable this video gallery</p>
                        </div>
                        <ui-switch name="is_active" checked></ui-switch>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('video-gallery-settings-modal', VideoGallerySettingsModal);
export default VideoGallerySettingsModal; 