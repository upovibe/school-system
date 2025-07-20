import App from '@/core/App.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Switch.js';
import api from '@/services/api.js';

/**
 * Video Gallery Update Modal Component
 * 
 * Modal for updating existing video galleries
 */
class VideoGalleryUpdateModal extends App {
    constructor() {
        super();
        this.videoGalleryData = null;
        this.videoLinks = [''];
        this.loading = false;
        
        this.set('videoGalleryData', null);
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

            const removeExistingButton = e.target.closest('[data-action="remove-existing-video"]');
            if (removeExistingButton) {
                e.preventDefault();
                const index = parseInt(removeExistingButton.dataset.index);
                this.removeExistingVideo(index);
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

    setVideoGalleryData(data) {
        this.set('videoGalleryData', data);
        if (data && data.video_links) {
            this.set('videoLinks', [...data.video_links]);
        } else {
            this.set('videoLinks', ['']);
        }
        this.populateForm();
    }

    populateForm() {
        const data = this.get('videoGalleryData');
        if (!data) return;

        const form = this.querySelector('form');
        if (form) {
            const nameInput = form.querySelector('[name="name"]');
            const descriptionInput = form.querySelector('[name="description"]');
            const activeSwitch = form.querySelector('[name="is_active"]');

            if (nameInput) nameInput.value = data.name || '';
            if (descriptionInput) descriptionInput.value = data.description || '';
            if (activeSwitch) activeSwitch.checked = data.is_active !== false;
        }
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

    removeExistingVideo(index) {
        const videoGalleryData = this.get('videoGalleryData');
        if (!videoGalleryData || !videoGalleryData.video_links) return;

        const videoLinks = [...videoGalleryData.video_links];
        videoLinks.splice(index, 1);
        
        videoGalleryData.video_links = videoLinks;
        this.set('videoGalleryData', { ...videoGalleryData });
        this.set('videoLinks', [...videoLinks]);
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

            const videoGalleryData = this.get('videoGalleryData');
            if (!videoGalleryData || !videoGalleryData.id) {
                Toast.show({
                    title: 'Error',
                    message: 'Video gallery data not found',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update video gallery',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const response = await api.withToken(token).put(`/video-galleries/${videoGalleryData.id}`, data);

            Toast.show({
                title: 'Success',
                message: 'Video gallery updated successfully',
                variant: 'success',
                duration: 3000
            });

            // Dispatch event to parent component
            this.dispatchEvent(new CustomEvent('video-gallery-updated', {
                detail: { videoGallery: response.data.data },
                bubbles: true
            }));

            this.close();

        } catch (error) {
            console.error('❌ Error updating video gallery:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update video gallery',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    close() {
        const modal = this.querySelector('ui-modal');
        if (modal) {
            modal.close();
        }
    }

    render() {
        const videoGalleryData = this.get('videoGalleryData');
        const videoLinks = this.get('videoLinks');
        const loading = this.get('loading');

        if (!videoGalleryData) {
            return `<ui-modal title="Update Video Gallery" size="lg">
                <div class="text-center py-8 text-gray-500">
                    <p>No video gallery data available</p>
                </div>
            </ui-modal>`;
        }

        return `
            <ui-modal title="Update Video Gallery" size="lg">
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
                            value="${videoGalleryData.name || ''}"
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
                            class="w-full">${videoGalleryData.description || ''}</ui-textarea>
                    </div>

                    <!-- Existing Video Links -->
                    ${videoGalleryData.video_links && videoGalleryData.video_links.length > 0 ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Existing Video Links
                            </label>
                            <div class="space-y-2">
                                ${videoGalleryData.video_links.map((link, index) => `
                                    <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                        <div class="flex-1">
                                            <p class="text-sm text-gray-700 truncate">${link}</p>
                                        </div>
                                        <ui-button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            data-action="remove-existing-video"
                                            data-index="${index}"
                                            class="px-3">
                                            <i class="fas fa-trash text-red-500"></i>
                                        </ui-button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- New Video Links -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Add New Video Links
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
                        <ui-switch name="is_active" ${videoGalleryData.is_active !== false ? 'checked' : ''}></ui-switch>
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
                        Update Video Gallery
                    </ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('video-gallery-update-modal', VideoGalleryUpdateModal);
export default VideoGalleryUpdateModal; 