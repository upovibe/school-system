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

        this.addEventListener('submit', (e) => {
            if (e.target.matches('form')) {
                e.preventDefault();
                this.handleSubmit();
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

            const formData = new FormData(this.querySelector('form'));
            const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                is_active: formData.get('is_active') === 'on',
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

            const response = await api.withToken(token).post('/video-galleries', data);

            Toast.show({
                title: 'Success',
                message: 'Video gallery created successfully',
                variant: 'success',
                duration: 3000
            });

            // Dispatch event to parent component
            this.dispatchEvent(new CustomEvent('video-gallery-saved', {
                detail: { videoGallery: response.data.data },
                bubbles: true
            }));

            // Reset form
            this.resetForm();
            this.close();

        } catch (error) {
            console.error('❌ Error creating video gallery:', error);
            
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
            <ui-modal title="Create Video Gallery" size="lg">
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
                            class="w-full">
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
                            class="w-full">
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
                                    <ui-input
                                        type="url"
                                        placeholder="Enter video URL (YouTube, Facebook, etc.)"
                                        value="${link}"
                                        data-video-index="${index}"
                                        class="flex-1">
                                    </ui-input>
                                    ${videoLinks.length > 1 ? `
                                        <ui-button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            data-action="remove-video-link"
                                            data-index="${index}"
                                            class="px-3">
                                            <i class="fas fa-trash text-red-500"></i>
                                        </ui-button>
                                    ` : ''}
                                </div>
                            `).join('')}
                            <ui-button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-action="add-video-link"
                                class="w-full">
                                <i class="fas fa-plus mr-2"></i>
                                Add Another Video Link
                            </ui-button>
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

                <div slot="footer" class="flex justify-end gap-3">
                    <ui-button
                        type="button"
                        variant="outline"
                        @click="${() => this.close()}"
                        disabled="${loading}">
                        Cancel
                    </ui-button>
                    <ui-button
                        type="submit"
                        variant="primary"
                        @click="${() => this.handleSubmit()}"
                        loading="${loading}">
                        Create Video Gallery
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('video-gallery-settings-modal', VideoGallerySettingsModal);
export default VideoGallerySettingsModal; 