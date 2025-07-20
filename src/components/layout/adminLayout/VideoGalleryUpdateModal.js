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
class VideoGalleryUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.videoGalleryData = null;
        this.videoLinks = [''];
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    connectedCallback() {
        // Initial render can be empty or a placeholder
        this.innerHTML = ''; 
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('confirm', this.handleSubmit);
        this.addEventListener('cancel', () => this.close());

        this.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="add-video-link"]')) {
                e.preventDefault();
                this.addVideoLink();
            }
            if (e.target.closest('[data-action="remove-video-link"]')) {
                e.preventDefault();
                const index = parseInt(e.target.closest('[data-action="remove-video-link"]').dataset.index, 10);
                this.removeVideoLink(index);
            }
        });
    }

    setVideoGalleryData(data) {
        this.videoGalleryData = data;
        this.videoLinks = (data && data.video_links && data.video_links.length > 0) ? [...data.video_links] : [''];
        this.render();
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    _syncVideoLinksFromDOM() {
        const videoLinkInputs = this.querySelectorAll('input[data-video-index]');
        this.videoLinks = Array.from(videoLinkInputs).map(input => input.value || '');
    }

    addVideoLink() {
        this._syncVideoLinksFromDOM();
        this.videoLinks.push('');
        this.render();
    }

    removeVideoLink(index) {
        this._syncVideoLinksFromDOM();
        if (this.videoLinks.length > 1) {
            this.videoLinks.splice(index, 1);
            this.render();
        }
    }

    async handleSubmit() {
        this._syncVideoLinksFromDOM();

        if (!this.videoGalleryData || !this.videoGalleryData.id) {
            Toast.show({ title: 'Error', message: 'Video gallery data not found', variant: 'error' });
            return;
        }

        try {
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');

            const filteredVideoLinks = this.videoLinks.filter(link => link && link.trim() !== '');

            const data = {
                name: nameInput ? nameInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1,
                video_links: filteredVideoLinks
            };

            if (!data.name || !data.name.trim()) {
                Toast.show({ title: 'Validation Error', message: 'Gallery name is required', variant: 'error' });
                return;
            }

            if (data.video_links.length === 0) {
                Toast.show({ title: 'Validation Error', message: 'At least one video link is required', variant: 'error' });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to update', variant: 'error' });
                return;
            }

            const response = await api.withToken(token).put(`/video-galleries/${this.videoGalleryData.id}`, data);

            Toast.show({ title: 'Success', message: 'Video gallery updated successfully', variant: 'success' });

            this.dispatchEvent(new CustomEvent('video-gallery-updated', {
                detail: { videoGallery: response.data.data },
                bubbles: true,
                composed: true
            }));

            this.close();

        } catch (error) {
            console.error('❌ Error updating video gallery:', error);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update video gallery', variant: 'error' });
        }
    }

    render() {
        if (!this.videoGalleryData) {
            this.innerHTML = ''; // Or a loading state
            return;
        }

        this.innerHTML = `
            <ui-modal 
                open
                title="Update Video Gallery" 
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
                            data-field="name"
                            type="text"
                            placeholder="Enter gallery name"
                            value="${this.videoGalleryData.name || ''}"
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
                            data-field="description"
                            placeholder="Enter gallery description"
                            rows="3"
                            class="w-full">${this.videoGalleryData.description || ''}</ui-textarea>
                    </div>

                    <!-- Video Links -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Video Links *
                        </label>
                        <div class="space-y-3">
                            ${this.videoLinks.map((link, index) => `
                                <div class="flex gap-2 items-center">
                                    <div class="flex-1">
                                        <input
                                            type="url"
                                            placeholder="Enter video URL"
                                            value="${link}"
                                            data-video-index="${index}"
                                            class="w-full upo-input-default">
                                    </div>
                                    ${this.videoLinks.length > 1 ? `
                                        <ui-button
                                            type="button"
                                            variant="danger-outline"
                                            size="sm"
                                            data-action="remove-video-link"
                                            data-index="${index}"
                                            class="px-3">
                                            <i class="fas fa-trash"></i>
                                        </ui-button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div class="flex justify-end mt-2">
                            <ui-button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-action="add-video-link"
                                class="px-3">
                                <i class="fas fa-plus mr-1"></i>
                                Add Link
                            </ui-button>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">
                            Supported platforms: YouTube, Facebook, Vimeo, etc.
                        </p>
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center justify-between">
                        <div>
                            <label class="text-sm font-medium text-gray-700">Active Status</label>
                            <p class="text-xs text-gray-500">Enable or disable this video gallery</p>
                        </div>
                        <ui-switch name="is_active" ${this.videoGalleryData.is_active ? 'checked' : ''}></ui-switch>
                    </div>
                </form>
            </ui-modal>
        `;
        // Re-attach listeners because innerHTML is replaced
        this.setupEventListeners();
    }
}

customElements.define('video-gallery-update-modal', VideoGalleryUpdateModal);
export default VideoGalleryUpdateModal;